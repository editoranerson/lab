import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupSubmission } from "@/lib/submissions.functions";
import { StatusBadge } from "@/components/StatusBadge";

export const Route = createFileRoute("/acompanhar")({
  head: () => ({
    meta: [
      { title: "Acompanhar protocolo — Laboratório Querido Dante" },
      { name: "description", content: "Consulte o status da sua proposta com protocolo e chave privada." },
      { property: "og:title", content: "Acompanhar proposta — Querido Dante" },
      { property: "og:description", content: "Use protocolo e chave privada para ver o status do seu experimento." },
    ],
  }),
  component: Page,
});

type Result = Awaited<ReturnType<typeof lookupSubmission>>;

function Page() {
  const [protocol, setProtocol] = useState("");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Result | null>(null);
  const lookup = useServerFn(lookupSubmission);

  const go = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      setRes(await lookup({ data: { protocol, key } }));
    } catch {
      toast.error("Protocolo ou chave privada incorretos.");
      setRes(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-center text-4xl font-extrabold">
        Acompanhar <span className="text-gradient">protocolo</span>
      </h1>
      <form onSubmit={go} className="glass space-y-4 rounded-3xl p-6">
        <div className="space-y-2">
          <Label htmlFor="p">Protocolo</Label>
          <Input id="p" placeholder="QD-XXXXXXXX" value={protocol} onChange={(e) => setProtocol(e.target.value)} className="bg-card font-mono uppercase" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="k">Chave privada</Label>
          <Input id="k" type="password" value={key} onChange={(e) => setKey(e.target.value)} className="bg-card font-mono" />
        </div>
        <Button disabled={busy} className="w-full rounded-full bg-gradient-brand">
          <Search className="h-4 w-4" /> Consultar
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Tem conta? Associe a proposta em <Link to="/painel" className="font-bold text-pink">Minhas Contribuições</Link>.
        </p>
      </form>
      {res && (
        <div className="glass space-y-4 rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-muted-foreground">{res.submission.protocol}</p>
              <h2 className="text-xl font-bold">{res.submission.title}</h2>
              <p className="text-xs text-muted-foreground">{res.submission.kind === "personagem" ? "Personagem" : "Trama"}</p>
            </div>
            <StatusBadge status={res.submission.status} implemented={res.submission.implemented} />
          </div>
          {res.notifications.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-bold">Avisos da moderação</h3>
              {res.notifications.map((n) => (
                <div key={n.id} className="rounded-2xl bg-secondary p-3 text-sm">
                  <p>{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
