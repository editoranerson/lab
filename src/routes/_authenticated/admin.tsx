import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Copy, Flag, Plus, Save, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { INCORPORATION_LABEL, STATUS_LABEL } from "@/lib/stages";
import { FIELD_LABELS, buildAiCopy } from "@/lib/schemas";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Laboratório Querido Dante" },
      { name: "description", content: "Painel editorial restrito." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Laboratório Querido Dante" },
      { property: "og:description", content: "Área restrita." },
    ],
  }),
  component: Admin,
});

type Judge = Database["public"]["Tables"]["judges"]["Row"];
type Status = Database["public"]["Enums"]["participant_status"];
type Incorp = Database["public"]["Enums"]["incorporation_status"];

function Admin() {
  const { isAdmin, ready } = useSession();
  if (!ready) return <p className="text-center text-muted-foreground">Verificando acesso…</p>;
  if (!isAdmin)
    return (
      <div className="glass mx-auto max-w-md rounded-3xl p-8 text-center">
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <p className="mt-2 text-sm text-muted-foreground">Esta área é exclusiva da equipe editorial.</p>
      </div>
    );
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-extrabold">
        Painel <span className="text-gradient">Admin</span>
      </h1>
      <Tabs defaultValue="personagem">
        <TabsList className="glass flex h-auto flex-wrap rounded-2xl">
          <TabsTrigger value="personagem">Personagens</TabsTrigger>
          <TabsTrigger value="trama">Tramas</TabsTrigger>
          <TabsTrigger value="banca">Banca</TabsTrigger>
          <TabsTrigger value="vitrine">Vitrine</TabsTrigger>
          <TabsTrigger value="diretrizes">Diretrizes</TabsTrigger>
        </TabsList>
        <TabsContent value="personagem"><Submissions kind="personagem" /></TabsContent>
        <TabsContent value="trama"><Submissions kind="trama" /></TabsContent>
        <TabsContent value="banca"><JudgesAdmin /></TabsContent>
        <TabsContent value="vitrine"><ShowcaseAdmin /></TabsContent>
        <TabsContent value="diretrizes"><GuidelinesAdmin /></TabsContent>
      </Tabs>
    </div>
  );
}

function useJudges() {
  return useQuery({
    queryKey: ["admin-judges"],
    queryFn: async () => (await supabase.from("judges").select("*").order("sort_order")).data ?? [],
  });
}

function Submissions({ kind }: { kind: "personagem" | "trama" }) {
  const [status, setStatus] = useState<string>("todos");
  const [sort, setSort] = useState<"date" | "avg">("date");
  const { data: judges = [] } = useJudges();
  const { data = [], refetch } = useQuery({
    queryKey: ["admin-subs", kind],
    queryFn: async () =>
      (await supabase.from("submissions").select("*, evaluations(*)").eq("kind", kind).order("created_at", { ascending: false })).data ?? [],
  });

  const rows = useMemo(() => {
    const withAvg = data.map((s) => {
      const scores = s.evaluations.map((e) => e.editorial_score).filter((x): x is number => x != null).map(Number);
      return { ...s, avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null };
    });
    const f = status === "todos" ? withAvg : withAvg.filter((s) => s.status === status);
    return [...f].sort((a, b) => (sort === "avg" ? (b.avg ?? -1) - (a.avg ?? -1) : b.created_at.localeCompare(a.created_at)));
  }, [data, status, sort]);

  return (
    <div className="mt-4 space-y-4">
      <div className="glass flex flex-wrap gap-3 rounded-2xl p-3 text-sm">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-full border bg-card px-3 py-1.5">
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as "date" | "avg")} className="rounded-full border bg-card px-3 py-1.5">
          <option value="date">Mais recentes</option>
          <option value="avg">Maior média editorial</option>
        </select>
        <span className="ml-auto self-center text-muted-foreground">{rows.length} propostas</span>
      </div>
      {rows.map((s) => <SubmissionRow key={s.id} s={s} judges={judges} onChange={refetch} />)}
      {!rows.length && <p className="text-center text-sm text-muted-foreground">Nada por aqui.</p>}
    </div>
  );
}

type Sub = Database["public"]["Tables"]["submissions"]["Row"] & {
  evaluations: Database["public"]["Tables"]["evaluations"]["Row"][];
  avg: number | null;
};

function SubmissionRow({ s, judges, onChange }: { s: Sub; judges: Judge[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [evals, setEvals] = useState<Record<string, { score: string; points: string }>>(() =>
    Object.fromEntries(s.evaluations.map((e) => [e.judge_id, { score: e.editorial_score?.toString() ?? "", points: e.progress_points?.toString() ?? "" }])),
  );
  const [msg, setMsg] = useState("");
  const data = (s.data ?? {}) as Record<string, unknown>;
  const totalPts = s.evaluations.reduce((a, e) => a + (e.progress_points ?? 0), 0);

  const update = async (patch: { status?: Status; incorporation?: Incorp }) => {
    const { error } = await supabase.from("submissions").update(patch).eq("id", s.id);
    if (error) toast.error("Erro ao salvar");
    else onChange();
  };

  const saveEvals = async () => {
    const rows = [];
    for (const j of judges) {
      const e = evals[j.id];
      if (!e || (e.score === "" && e.points === "")) continue;
      const score = e.score === "" ? null : Number(e.score);
      const points = e.points === "" ? null : Math.round(Number(e.points));
      if (score != null && (isNaN(score) || score < 0 || score > 10)) { toast.error(`Nota de ${j.name} deve ser 0–10`); return; }
      if (points != null && (isNaN(points) || points < 0 || points > 100)) { toast.error(`Pontos de ${j.name} devem ser 0–100`); return; }
      rows.push({ submission_id: s.id, judge_id: j.id, editorial_score: score, progress_points: points, updated_at: new Date().toISOString() });
    }
    const { error } = await supabase.from("evaluations").upsert(rows, { onConflict: "submission_id,judge_id" });
    if (error) toast.error("Erro ao salvar avaliações");
    else {
      toast.success("Avaliações salvas");
      onChange();
    }
  };

  const notify = async () => {
    if (!msg.trim()) return;
    const { error } = await supabase.from("notifications").insert({ submission_id: s.id, kind: "moderacao", message: msg.trim().slice(0, 1000) });
    if (error) toast.error("Erro ao notificar");
    else {
      toast.success("Participante notificado");
      setMsg("");
    }
  };

  return (
    <div className="glass rounded-2xl">
      <button onClick={() => setOpen(!open)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left">
        <span className="font-mono text-xs text-muted-foreground">{s.protocol}</span>
        <span className="font-semibold">{s.title}</span>
        <StatusBadge status={s.status} />
        <span className="ml-auto text-sm">
          Média <b>{s.avg != null ? s.avg.toFixed(1) : "—"}</b> · {totalPts} pts · {new Date(s.created_at).toLocaleDateString("pt-BR")}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="grid gap-6 border-t p-4 lg:grid-cols-2">
          <div className="space-y-3 text-sm">
            <div className="rounded-xl bg-secondary p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">Dados pessoais (restrito)</p>
              <p>{s.full_name}</p>
              <p>{s.phone}</p>
              <p className="text-xs text-muted-foreground">{s.user_id ? "Associada a uma conta" : "Enviada como visitante"}</p>
            </div>
            {Object.entries(data).map(([k, v]) =>
              v ? (
                <p key={k}>
                  <b>{FIELD_LABELS[k] ?? k}:</b> <span className="whitespace-pre-wrap">{String(v)}</span>
                </p>
              ) : null,
            )}
            {s.ai_prompt && <p><b>Prompt para IA:</b> {s.ai_prompt}</p>}
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(buildAiCopy({ protocol: s.protocol, kind: s.kind, data, ai_prompt: s.ai_prompt }));
                toast.success("Copiado sem dados pessoais");
              }}
            >
              <Copy className="h-4 w-4" /> Copiar para IA
            </Button>
          </div>
          <div className="space-y-5">
            <div>
              <h4 className="mb-2 text-sm font-bold">Avaliação por jurado</h4>
              <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-xs font-semibold text-muted-foreground">
                <span>Jurado</span><span>Nota 0–10</span><span>Pontos 0–100</span>
              </div>
              {judges.map((j) => (
                <div key={j.id} className="mt-2 grid grid-cols-[1fr_80px_80px] items-center gap-2">
                  <span className="text-sm">{j.name} <span className="text-xs text-muted-foreground">({j.kind === "ia" ? "IA" : "Humano"})</span></span>
                  <Input type="number" min={0} max={10} step={0.5} value={evals[j.id]?.score ?? ""} onChange={(e) => setEvals({ ...evals, [j.id]: { score: e.target.value, points: evals[j.id]?.points ?? "" } })} className="h-8 bg-card" />
                  <Input type="number" min={0} max={100} value={evals[j.id]?.points ?? ""} onChange={(e) => setEvals({ ...evals, [j.id]: { score: evals[j.id]?.score ?? "", points: e.target.value } })} className="h-8 bg-card" />
                </div>
              ))}
              <Button size="sm" className="mt-3 rounded-full bg-gradient-brand" onClick={saveEvals}><Save className="h-4 w-4" /> Salvar avaliações</Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="font-bold">Status do participante</span>
                <select value={s.status} onChange={(e) => update({ status: e.target.value as Status })} className="w-full rounded-full border bg-card px-3 py-1.5">
                  {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-sm">
                <span className="font-bold">Incorporação (interno)</span>
                <select value={s.incorporation} onChange={(e) => update({ incorporation: e.target.value as Incorp })} className="w-full rounded-full border bg-card px-3 py-1.5">
                  {Object.entries(INCORPORATION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold">Notificar / sinalizar infração</h4>
              <Textarea rows={3} maxLength={1000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Mensagem visível ao participante" className="bg-card" />
              <Button size="sm" variant="outline" className="rounded-full" onClick={notify}><Flag className="h-4 w-4" /> Enviar aviso</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function JudgesAdmin() {
  const { data = [] } = useJudges();
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-judges"] });
  const [n, setN] = useState({ name: "", kind: "ia" as "ia" | "humano", description: "" });

  const add = async () => {
    if (!n.name.trim()) return;
    const { error } = await supabase.from("judges").insert({ ...n, name: n.name.trim().slice(0, 80), sort_order: data.length + 1 });
    if (error) { toast.error("Erro"); return; }
    setN({ name: "", kind: "ia", description: "" });
    refresh();
  };

  return (
    <div className="mt-4 space-y-3">
      {data.map((j) => (
        <div key={j.id} className="glass flex flex-wrap items-center gap-3 rounded-2xl p-4">
          <b>{j.name}</b>
          <span className="rounded-full bg-accent px-2 text-xs font-bold text-accent-foreground">{j.kind === "ia" ? "IA" : "Humano"}</span>
          <span className="text-sm text-muted-foreground">{j.description}</span>
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={j.active} onChange={async (e) => { await supabase.from("judges").update({ active: e.target.checked }).eq("id", j.id); refresh(); }} /> Ativo
          </label>
          <Button size="icon" variant="ghost" onClick={async () => { if (confirm("Remover jurado e suas avaliações?")) { await supabase.from("judges").delete().eq("id", j.id); refresh(); } }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="glass grid gap-2 rounded-2xl p-4 sm:grid-cols-[1fr_auto_2fr_auto]">
        <Input placeholder="Nome" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} className="bg-card" />
        <select value={n.kind} onChange={(e) => setN({ ...n, kind: e.target.value as "ia" | "humano" })} className="rounded-md border bg-card px-3">
          <option value="ia">IA</option>
          <option value="humano">Humano</option>
        </select>
        <Input placeholder="Descrição" value={n.description} onChange={(e) => setN({ ...n, description: e.target.value })} className="bg-card" />
        <Button onClick={add} className="bg-gradient-brand"><Plus className="h-4 w-4" /> Adicionar</Button>
      </div>
    </div>
  );
}

function ShowcaseAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin-showcase"],
    queryFn: async () => (await supabase.from("showcase").select("*").order("sort_order")).data ?? [],
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-showcase"] }); qc.invalidateQueries({ queryKey: ["home"] }); };
  const [n, setN] = useState({ name: "", creator: "", synopsis: "", image_url: "" });

  const add = async () => {
    if (!n.name.trim() || !n.creator.trim() || !n.synopsis.trim()) { toast.error("Preencha nome, criador(a) e sinopse"); return; }
    if (n.image_url && !/^https:\/\//.test(n.image_url)) { toast.error("A imagem precisa ser um link https"); return; }
    const { error } = await supabase.from("showcase").insert({ ...n, image_url: n.image_url || null, sort_order: data.length + 1 });
    if (error) { toast.error("Erro"); return; }
    setN({ name: "", creator: "", synopsis: "", image_url: "" });
    refresh();
  };

  return (
    <div className="mt-4 space-y-3">
      {data.map((s) => (
        <div key={s.id} className="glass flex items-center gap-4 rounded-2xl p-3">
          {s.image_url ? <img src={s.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <div className="h-16 w-16 rounded-xl bg-gradient-brand" />}
          <div className="flex-1">
            <b>{s.name}</b> <span className="text-xs text-pink">por {s.creator}</span>
            <p className="line-clamp-2 text-sm text-muted-foreground">{s.synopsis}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={async () => { await supabase.from("showcase").delete().eq("id", s.id); refresh(); }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="glass grid gap-2 rounded-2xl p-4 sm:grid-cols-2">
        <Input placeholder="Nome do experimento" value={n.name} onChange={(e) => setN({ ...n, name: e.target.value })} className="bg-card" />
        <Input placeholder="Criador(a)" value={n.creator} onChange={(e) => setN({ ...n, creator: e.target.value })} className="bg-card" />
        <Input placeholder="Link da arte/foto (https://…)" value={n.image_url} onChange={(e) => setN({ ...n, image_url: e.target.value })} className="bg-card sm:col-span-2" />
        <Textarea placeholder="Sinopse" value={n.synopsis} onChange={(e) => setN({ ...n, synopsis: e.target.value })} className="bg-card sm:col-span-2" />
        <Button onClick={add} className="bg-gradient-brand sm:col-span-2"><Plus className="h-4 w-4" /> Adicionar à vitrine</Button>
      </div>
    </div>
  );
}

function GuidelinesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-guidelines"],
    queryFn: async () => (await supabase.from("guidelines").select("content").eq("id", 1).maybeSingle()).data,
  });
  const [text, setText] = useState<string | null>(null);
  const value = text ?? data?.content ?? "";
  const save = async () => {
    const { error } = await supabase.from("guidelines").upsert({ id: 1, content: value, updated_at: new Date().toISOString() });
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Diretrizes publicadas");
      qc.invalidateQueries({ queryKey: ["guidelines"] });
    }
  };
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm text-muted-foreground">Edite em Markdown. O conteúdo aparece em /diretrizes.</p>
      <Textarea rows={24} value={value} onChange={(e) => setText(e.target.value)} className="glass font-mono text-sm" />
      <Button onClick={save} className="rounded-full bg-gradient-brand"><Save className="h-4 w-4" /> Salvar diretrizes</Button>
    </div>
  );
}
