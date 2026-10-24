import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { accessSchema, submissionInput } from "./schemas";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randomString(len: number, alphabet = ALPHA) {
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}
async function admin() {
  return (await import("@/integrations/supabase/client.server")).supabaseAdmin;
}

type Row = {
  id: string;
  protocol: string;
  kind: string;
  title: string;
  status: string;
  incorporation: string;
  created_at: string;
};

// Participant-safe view: no personal data, no internal editorial "rascunho".
function publicView(r: Row) {
  return {
    id: r.id,
    protocol: r.protocol,
    kind: r.kind,
    title: r.title,
    status: r.status,
    implemented: r.incorporation === "implementado",
    created_at: r.created_at,
  };
}

export const createSubmission = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => submissionInput.parse(input))
  .handler(async ({ data }) => {
    const sb = await admin();
    let userId: string | null = null;
    const auth = getRequest()?.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const { data: u } = await sb.auth.getUser(auth.slice(7));
      userId = u.user?.id ?? null;
    }
    const protocol = `QD-${randomString(8)}`;
    const key = randomString(24, ALPHA + "abcdefghijkmnpqrstuvwxyz");
    const title = data.kind === "trama" ? data.data.title : data.data.name;
    const record: Record<string, unknown> = { ...data.data };
    if (data.kind === "espelho" && data.photo) {
      const [head, b64] = data.photo.split(",");
      const mime = head!.slice(5, head!.indexOf(";"));
      const bytes = Uint8Array.from(atob(b64!), (c) => c.charCodeAt(0));
      if (bytes.length > 5 * 1024 * 1024) throw new Error("Foto acima de 5 MB.");
      const path = `${protocol}.${mime.split("/")[1]}`;
      const up = await sb.storage.from("mirror-photos").upload(path, bytes, { contentType: mime });
      if (up.error) {
        console.error(up.error);
        throw new Error("Não foi possível enviar a foto. Tente novamente.");
      }
      record["photo_path"] = path;
    }
    const { error } = await sb.from("submissions").insert({
      protocol,
      key_hash: await sha256(key),
      user_id: userId,
      kind: data.kind,
      full_name: data.full_name,
      phone: data.phone.replace(/\D/g, ""),
      title,
      data: record as never,
      ai_prompt: data.ai_prompt || null,
    });
    if (error) {
      console.error(error);
      throw new Error("Não foi possível registrar a proposta. Tente novamente.");
    }
    return { protocol, key, linked: !!userId };
  });

async function findByAccess(protocol: string, key: string) {
  const sb = await admin();
  const { data } = await sb
    .from("submissions")
    .select("id, protocol, kind, title, status, incorporation, created_at, key_hash, user_id")
    .eq("protocol", protocol)
    .maybeSingle();
  if (!data || data.key_hash !== (await sha256(key))) return null;
  return data;
}

export const lookupSubmission = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => accessSchema.parse(input))
  .handler(async ({ data }) => {
    const row = await findByAccess(data.protocol, data.key);
    if (!row) throw new Error("Protocolo ou chave privada incorretos.");
    const sb = await admin();
    const { data: notes } = await sb
      .from("notifications")
      .select("id, kind, message, created_at")
      .eq("submission_id", row.id)
      .order("created_at", { ascending: false });
    return { submission: publicView(row), notifications: notes ?? [] };
  });

export const claimSubmission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => accessSchema.parse(input))
  .handler(async ({ data, context }) => {
    const row = await findByAccess(data.protocol, data.key);
    if (!row) throw new Error("Protocolo ou chave privada incorretos.");
    if (row.user_id && row.user_id !== context.userId) throw new Error("Esta proposta já está associada a outra conta.");
    const sb = await admin();
    await sb.from("submissions").update({ user_id: context.userId }).eq("id", row.id);
    return { ok: true };
  });

export const myContributions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const sb = await admin();
    const { data: rows } = await sb
      .from("submissions")
      .select("id, protocol, kind, title, status, incorporation, created_at, evaluations(progress_points)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    const list = rows ?? [];
    const ids = list.map((r) => r.id);
    let totalPoints = 0;
    const submissions = list.map((r) => {
      const pts = (r.evaluations ?? []).reduce((a, e) => a + (e.progress_points ?? 0), 0);
      totalPoints += pts;
      return { ...publicView(r), points: pts };
    });
    const { data: notes } = ids.length
      ? await sb
          .from("notifications")
          .select("id, kind, message, read, created_at, submission_id")
          .in("submission_id", ids)
          .order("created_at", { ascending: false })
      : { data: [] };
    return { submissions, totalPoints, notifications: notes ?? [] };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const sb = await admin();
    const { data: n } = await sb
      .from("notifications")
      .select("id, submissions!inner(user_id)")
      .eq("id", data.id)
      .maybeSingle();
    const owner = (n as unknown as { submissions?: { user_id: string | null } } | null)?.submissions?.user_id;
    if (!n || owner !== context.userId) throw new Error("Não encontrado");
    await sb.from("notifications").update({ read: true }).eq("id", data.id);
    return { ok: true };
  });
