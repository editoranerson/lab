import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { createSubmission } from "@/lib/submissions.functions";
import { submissionInput } from "@/lib/schemas";
import { AccessResult } from "./AccessResult";

export type Field = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "choice";
  options?: readonly string[];
  optional?: boolean;
  placeholder?: string;
  max?: number;
};
export type Step = { title: string; hint?: string; fields: Field[] };

const IDENT: Step = {
  title: "Identificação",
  hint: "Usados apenas pela equipe editorial. Nunca aparecem publicamente.",
  fields: [
    { name: "full_name", label: "Nome completo", max: 120 },
    { name: "phone", label: "Telefone / WhatsApp com DDD", placeholder: "(11) 99999-9999", max: 20 },
  ],
};
const AI: Step = {
  title: "Prompt para jurados de IA",
  hint: "Opcional: escreva uma instrução para ChatGPT, Gemini e outros jurados de IA ao lerem sua proposta.",
  fields: [{ name: "ai_prompt", label: "Prompt (opcional)", type: "textarea", optional: true, max: 2000 }],
};

export function Wizard({ kind, steps }: { kind: "personagem" | "trama"; steps: Step[] }) {
  const all = [IDENT, ...steps, AI, { title: "Aceite legal", fields: [] }];
  const [i, setI] = useState(0);
  const [v, setV] = useState<Record<string, string>>({});
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ protocol: string; key: string; linked: boolean } | null>(null);
  const submit = useServerFn(createSubmission);

  if (done) return <AccessResult protocol={done.protocol} accessKey={done.key} linked={done.linked} />;

  const step = all[i];
  const last = i === all.length - 1;
  const set = (k: string, val: string) => setV((p) => ({ ...p, [k]: val }));

  const next = () => {
    const missing = step.fields.find((f) => !f.optional && !(v[f.name] ?? "").trim());
    if (missing) return toast.error(`Preencha: ${missing.label}`);
    setI(i + 1);
  };

  const send = async () => {
    const dataKeys = steps.flatMap((s) => s.fields.map((f) => f.name));
    const payload = {
      kind,
      full_name: v.full_name ?? "",
      phone: v.phone ?? "",
      ai_prompt: v.ai_prompt ?? "",
      adult,
      terms,
      data: Object.fromEntries(dataKeys.map((k) => [k, v[k] ?? ""])),
    };
    const parsed = submissionInput.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return toast.error(`${issue.path.at(-1) ? String(issue.path.at(-1)) + ": " : ""}${issue.message}`);
    }
    setBusy(true);
    try {
      const r = await submit({ data: parsed.data });
      setDone(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass mx-auto max-w-2xl rounded-3xl p-5 sm:p-8">
      <div className="mb-6 flex gap-1.5">
        {all.map((s, idx) => (
          <div key={s.title} className={`h-1.5 flex-1 rounded-full transition-colors ${idx <= i ? "bg-gradient-brand" : "bg-muted"}`} />
        ))}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-pink">
        Etapa {i + 1} de {all.length}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold">{step.title}</h2>
      {step.hint && <p className="mt-1 text-sm text-muted-foreground">{step.hint}</p>}

      <div key={i} className="mt-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
        {step.fields.map((f) => (
          <div key={f.name} className="space-y-2">
            <Label htmlFor={f.name}>
              {f.label} {f.optional && <span className="text-muted-foreground">(opcional)</span>}
            </Label>
            {f.type === "choice" ? (
              <div className="flex flex-wrap gap-2">
                {f.options!.map((o) => (
                  <button
                    type="button"
                    key={o}
                    onClick={() => set(f.name, o)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      v[f.name] === o ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow" : "bg-card hover:border-ring"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
            ) : f.type === "textarea" ? (
              <Textarea id={f.name} rows={4} maxLength={f.max} placeholder={f.placeholder} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className="bg-card" />
            ) : (
              <Input id={f.name} maxLength={f.max} placeholder={f.placeholder} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} className="bg-card" />
            )}
          </div>
        ))}

        {last && (
          <div className="space-y-4 text-sm">
            <label className="flex items-start gap-3">
              <Checkbox checked={adult} onCheckedChange={(c) => setAdult(c === true)} className="mt-0.5" />
              <span>Declaro ter 18 anos ou mais.</span>
            </label>
            <label className="flex items-start gap-3">
              <Checkbox checked={terms} onCheckedChange={(c) => setTerms(c === true)} className="mt-0.5" />
              <span>
                Li e aceito as{" "}
                <Link to="/diretrizes" target="_blank" className="font-bold text-pink underline">
                  diretrizes
                </Link>
                , incluindo a cessão de direitos para possível incorporação na obra. Entendo que o envio não garante incorporação nem crédito.
              </span>
            </label>
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-between gap-2">
        <Button variant="ghost" className="rounded-full" disabled={i === 0} onClick={() => setI(i - 1)}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        {last ? (
          <Button className="rounded-full bg-gradient-brand" disabled={busy || !adult || !terms} onClick={send}>
            <Send className="h-4 w-4" /> {busy ? "Enviando..." : "Enviar experimento"}
          </Button>
        ) : (
          <Button className="rounded-full bg-gradient-brand" onClick={next}>
            Continuar <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
