import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [j, s] = await Promise.all([
    sb.from("judges").select("id, name, kind, description").eq("active", true).order("sort_order"),
    sb.from("showcase").select("id, name, creator, synopsis, image_url").order("sort_order").order("created_at", { ascending: false }),
  ]);
  return { judges: j.data ?? [], showcase: s.data ?? [] };
});

export const getGuidelines = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await publicClient().from("guidelines").select("content, updated_at").eq("id", 1).maybeSingle();
  return data ?? { content: "", updated_at: null };
});
