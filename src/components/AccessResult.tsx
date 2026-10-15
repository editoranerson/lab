import { Link } from "@tanstack/react-router";
import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AccessResult({ protocol, accessKey, linked }: { protocol: string; accessKey: string; linked: boolean }) {
  const copy = () => {
    navigator.clipboard.writeText(`Protocolo: ${protocol}\nChave privada: ${accessKey}`);
    toast.success("Dados de acesso copiados");
  };
  return (
    <div className="glass mx-auto max-w-xl rounded-3xl p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand text-primary-foreground">
        <KeyRound />
      </span>
      <h2 className="mt-4 text-2xl font-extrabold">Experimento enviado!</h2>
      <p className="mt-2 text-muted-foreground">
        Guarde estes dados. Eles são a única forma de acompanhar a proposta ou associá-la a uma conta depois.
      </p>
      <div className="mt-6 space-y-3 rounded-2xl bg-secondary p-4 text-left font-mono text-sm">
        <p>
          <span className="text-muted-foreground">Protocolo:</span> <b>{protocol}</b>
        </p>
        <p className="break-all">
          <span className="text-muted-foreground">Chave privada:</span> <b>{accessKey}</b>
        </p>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">A chave não será exibida novamente.</p>
      {linked && <p className="mt-2 text-sm font-semibold text-success">Proposta já associada à sua conta.</p>}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={copy} className="rounded-full bg-gradient-brand">
          <Copy className="h-4 w-4" /> Copiar dados
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link to="/acompanhar">Acompanhar</Link>
        </Button>
      </div>
    </div>
  );
}
