import { KIND_LABEL } from "@/lib/schemas";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { claimSubmission, markNotificationRead, myContributions } from "@/lib/submissions.functions";
import { Trail } from "@/components/Trail";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Minhas Contribuições — Laboratório Querido Dante" },
      { name: "description", content: "Seus protocolos, status, avisos e trilha de progressão." },
      { property: "og:title", content: "Minhas Contribuições" },
      { property: "og:description", content: "Acompanhe suas propostas no Laboratório Querido Dante." },
    ],
  }),
  component: Painel,
});

function Painel() {
  const fetchMine = useServerFn(myContributions);
  const claim = useServerFn(claimSubmission);
  const markRead = useServerFn(markNotificationRead);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["mine"], queryFn: () => fetchMine() });
  const [protocol, setProtocol] = useState("");
  const [key, setKey] = useState("");

  const doClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await claim({ data: { protocol, key } });
      toast.success("Proposta associada à sua conta!");
      setProtocol("");
      setKey("");
      qc.invalidateQueries({ queryKey: ["mine"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  };

  const unread = data?.notifications.filter((n) => !n.read) ?? [];
  const titleOf = (id: string) => data?.submissions.find((s) => s.id === id)?.protocol ?? "";

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-extrabold">
        Minhas <span className="text-gradient">Contribuições</span>
      </h1>
      <Trail points={data?.totalPoints ?? 0} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass rounded-3xl p-6">
          <h2 className="text-xl font-bold">Propostas</h2>
          {isLoading ? (
            <p className="mt-4 text-sm text-muted-foreground">Carregando…</p>
          ) : data?.submissions.length ? (
            <ul className="mt-4 divide-y">
              {data.submissions.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{s.protocol}</p>
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {KIND_LABEL[s.kind] ?? s.kind} · {new Date(s.created_at).toLocaleDateString("pt-BR")} · {s.points} pts
                    </p>
                  </div>
                  <StatusBadge status={s.status} implemented={s.implemented} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma proposta ainda. Envie uma ou associe uma enviada como visitante.</p>
          )}

          <form onSubmit={doClaim} className="mt-6 space-y-3 rounded-2xl bg-secondary p-4">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <Link2 className="h-4 w-4" /> Associar proposta enviada como visitante
            </h3>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input placeholder="Protocolo QD-XXXXXXXX" value={protocol} onChange={(e) => setProtocol(e.target.value)} className="bg-card font-mono uppercase" />
              <Input placeholder="Chave privada" type="password" value={key} onChange={(e) => setKey(e.target.value)} className="bg-card font-mono" />
            </div>
            <Button size="sm" className="rounded-full bg-gradient-brand">Associar</Button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="glass rounded-3xl p-6">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Bell className="h-5 w-5" /> Notificações
              {unread.length > 0 && <span className="rounded-full bg-gradient-brand px-2 text-xs text-primary-foreground">{unread.length}</span>}
            </h2>
            <ul className="mt-4 space-y-2">
              {(data?.notifications ?? []).map((n) => (
                <li key={n.id} className={`rounded-2xl p-3 text-sm ${n.read ? "bg-muted" : "bg-accent"}`}>
                  <p className="font-mono text-[10px] text-muted-foreground">{titleOf(n.submission_id)}</p>
                  <p>{n.message}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString("pt-BR")}
                    {!n.read && (
                      <button
                        className="font-bold text-pink"
                        onClick={async () => {
                          await markRead({ data: { id: n.id } });
                          qc.invalidateQueries({ queryKey: ["mine"] });
                        }}
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </li>
              ))}
              {!data?.notifications.length && <li className="text-sm text-muted-foreground">Nenhum aviso.</li>}
            </ul>
          </section>
          <AccountForm />
        </div>
      </div>
    </div>
  );
}

function AccountForm() {
  const [v, setV] = useState({ display_name: "", full_name: "", phone: "" });
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUid(u.user.id);
      const { data } = await supabase.from("profiles").select("display_name, full_name, phone").eq("id", u.user.id).maybeSingle();
      if (data) setV({ display_name: data.display_name ?? "", full_name: data.full_name ?? "", phone: data.phone ?? "" });
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;
    if (v.phone && !/^\d{10,11}$/.test(v.phone.replace(/\D/g, ""))) { toast.error("Telefone com DDD inválido"); return; }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: uid, display_name: v.display_name.slice(0, 80), full_name: v.full_name.slice(0, 120), phone: v.phone.replace(/\D/g, "") || null });
    if (error) toast.error("Não foi possível salvar");
    else toast.success("Dados atualizados");
  };

  return (
    <form onSubmit={save} className="glass space-y-3 rounded-3xl p-6">
      <h2 className="text-xl font-bold">Dados da conta</h2>
      <p className="text-xs text-muted-foreground">Visíveis apenas para você e para a equipe editorial.</p>
      {(
        [
          ["display_name", "Nome de exibição"],
          ["full_name", "Nome completo"],
          ["phone", "Telefone / WhatsApp com DDD"],
        ] as const
      ).map(([k, l]) => (
        <div key={k} className="space-y-1">
          <Label htmlFor={k}>{l}</Label>
          <Input id={k} value={v[k]} onChange={(e) => setV({ ...v, [k]: e.target.value })} className="bg-card" />
        </div>
      ))}
      <Button size="sm" className="rounded-full bg-gradient-brand">Salvar</Button>
    </form>
  );
}
