import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Laboratório Querido Dante" },
      { name: "description", content: "Crie uma conta opcional para acompanhar suas contribuições e sua trilha." },
      { property: "og:title", content: "Entrar no Laboratório Querido Dante" },
      { property: "og:description", content: "Conta opcional para acompanhar contribuições." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/painel" } });
        if (error) throw error;
        toast.success("Confira seu e-mail para confirmar a conta.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/painel" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin });
    if (r.error) return toast.error("Não foi possível entrar.");
    if (r.redirected) return;
    navigate({ to: "/painel" });
  };

  return (
    <div className="glass mx-auto max-w-md rounded-3xl p-8">
      <h1 className="text-center text-3xl font-extrabold">{mode === "in" ? "Entrar" : "Criar conta"}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">A conta é opcional e serve para acompanhar suas contribuições.</p>
      <div className="mt-6 space-y-2">
        <Button variant="outline" className="w-full rounded-full bg-card" onClick={() => oauth("google")}>
          Continuar com Google
        </Button>
        <button type="button" className="lovable-auth-button w-full" onClick={() => oauth("lovable")}>
          Continue with Lovable
        </button>
      </div>
      <div className="my-6 text-center text-xs text-muted-foreground">ou com e-mail</div>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="e">E-mail</Label>
          <Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-card" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pw">Senha</Label>
          <Input id="pw" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-card" />
        </div>
        <Button disabled={busy} className="w-full rounded-full bg-gradient-brand">
          {mode === "in" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
      <button className="mt-4 w-full text-center text-sm font-semibold text-pink" onClick={() => setMode(mode === "in" ? "up" : "in")}>
        {mode === "in" ? "Não tem conta? Criar agora" : "Já tem conta? Entrar"}
      </button>
    </div>
  );
}
