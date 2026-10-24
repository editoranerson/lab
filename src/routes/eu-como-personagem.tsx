import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Copy, ImageUp, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { AccessResult } from "@/components/AccessResult";
import { getMirrorPrompt } from "@/lib/public.functions";
import { createSubmission } from "@/lib/submissions.functions";
import { MAX_PHOTO_BYTES, submissionInput } from "@/lib/schemas";

const promptQuery = queryOptions({ queryKey: ["mirror-prompt"], queryFn: () => getMirrorPrompt() });

export const Route = createFileRoute("/eu-como-personagem")({
  head: () => ({
    meta: [
      { title: "Eu como Personagem (IA) — Laboratório Querido Dante" },
      { name: "description", content: "Pergunte à sua IA que personagem você seria numa comédia romântica e participe do universo Querido Dante." },
      { property: "og:title", content: "Eu como Personagem — o espelho da IA" },
      { property: "og:description", content: "Copie o prompt, cole a resposta da sua IA e vire aluno(a) ou professor(a) em Querido Dante." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(promptQuery),
  component: Page,
});

const MODES = [
  { value: "nenhuma", label: "Não, pode enviar" },
  { value: "texto", label: "Sim, descrevendo" },
  { value: "foto", label: "Sim, com foto" },
] as const;
type Mode = (typeof MODES)[number]["value"];

function Page() {
  const { data } = useSuspenseQuery(promptQuery);
  const submit = useServerFn(createSubmission);
  const [i, setI] = useState(0);
  const [v, setV] = useState({ full_name: "", phone: "", ai_response: "", name: "", gender: "", appearance: "", photo_note: "" });
  const [mode, setMode] = useState<Mode | "">("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoTerms, setPhotoTerms] = useState(false);
  const [adult, setAdult] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ protocol: string; key: string; linked: boolean } | null>(null);
  const set = (k: keyof typeof v, val: string) => setV((p) => ({ ...p, [k]: val }));

  if (done) return <AccessResult protocol={done.protocol} accessKey={done.key} linked={done.linked} />;

  const titles = ["Identificação", "O espelho da IA", "Seu personagem", "Aparência", "Aceite legal"];
  const last = i === titles.length - 1;

  const next = () => {
    const req: Record<number, [keyof typeof v, string][]> = {
      0: [["full_name", "Nome completo"], ["phone", "Telefone / WhatsApp"]],
      1: [["ai_response", "Resposta da IA"]],
      2: [["name", "Nome do personagem"], ["gender", "Gênero"]],
    };
    const miss = (req[i] ?? []).find(([k]) => !v[k].trim());
    if (miss) { toast.error(`Preencha: ${miss[1]}`); return; }
    if (i === 3) {
      if (!mode) { toast.error("Escolha se quer descrever a aparência"); return; }
      if (mode === "texto" && !v.appearance.trim()) { toast.error("Descreva a aparência"); return; }
      if (mode === "foto" && !photo) { toast.error("Envie a foto"); return; }
    }
    setI(i + 1);
  };

  const onFile = (f?: File) => {
    if (!f) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { toast.error("Use JPG, PNG ou WEBP"); return; }
    if (f.size > MAX_PHOTO_BYTES) { toast.error("Foto acima de 5 MB"); return; }
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(f);
  };

  const send = async () => {
    if (mode === "foto" && !photoTerms) { toast.error("Aceite o termo de uso de imagem"); return; }
    const parsed = submissionInput.safeParse({
      kind: "espelho",
      full_name: v.full_name,
      phone: v.phone,
      ai_prompt: "",
      adult,
      terms,
      data: {
        ai_response: v.ai_response,
        name: v.name,
        gender: v.gender,
        appearance_mode: mode,
        appearance: mode === "texto" ? v.appearance : "",
        photo_note: mode === "foto" ? v.photo_note : "",
      },
      photo: mode === "foto" ? (photo ?? undefined) : undefined,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    try {
      setDone(await submit({ data: parsed.data }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="mb-3 text-center text-4xl font-extrabold">
        Eu como <span className="text-gradient">Personagem</span>
      </h1>
      <p className="mx-auto mb-8 max-w-xl text-center text-muted-foreground">
        Pergunte à IA que você mais usa que personagem você seria em Querido Dante — aluno(a) ou professor(a) — e traga a resposta pra banca.
      </p>
      <div className="glass mx-auto max-w-2xl rounded-3xl p-5 sm:p-8">
        <div className="mb-6 flex gap-1.5">
          {titles.map((t, idx) => (
            <div key={t} className={`h-1.5 flex-1 rounded-full ${idx <= i ? "bg-gradient-brand" : "bg-muted"}`} />
          ))}
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-pink">Etapa {i + 1} de {titles.length}</p>
        <h2 className="mt-1 text-2xl font-extrabold">{titles[i]}</h2>

        <div key={i} className="mt-6 space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
          {i === 0 && (
            <>
              <p className="text-sm text-muted-foreground">Usados apenas pela equipe editorial. Nunca aparecem publicamente.</p>
              <F label="Nome completo"><Input maxLength={120} value={v.full_name} onChange={(e) => set("full_name", e.target.value)} className="bg-card" /></F>
              <F label="Telefone / WhatsApp com DDD"><Input maxLength={20} placeholder="(11) 99999-9999" value={v.phone} onChange={(e) => set("phone", e.target.value)} className="bg-card" /></F>
            </>
          )}
          {i === 1 && (
            <>
              <p className="text-sm text-muted-foreground">1. Copie o prompt. 2. Cole na IA que você mais usa (ChatGPT, Gemini, Claude…). 3. Cole a resposta abaixo.</p>
              <div className="rounded-2xl bg-secondary p-4 text-sm whitespace-pre-wrap">{data.prompt}</div>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(data.prompt);
                  toast.success("Prompt copiado! Agora cole na sua IA.");
                }}
              >
                <Copy className="h-4 w-4" /> Copiar prompt
              </Button>
              <F label="Resposta da IA"><Textarea rows={10} maxLength={8000} value={v.ai_response} onChange={(e) => set("ai_response", e.target.value)} className="bg-card" /></F>
            </>
          )}
          {i === 2 && (
            <>
              <F label="Nome do personagem"><Input maxLength={80} value={v.name} onChange={(e) => set("name", e.target.value)} className="bg-card" /></F>
              <F label="Gênero"><Input maxLength={80} value={v.gender} onChange={(e) => set("gender", e.target.value)} className="bg-card" /></F>
            </>
          )}
          {i === 3 && (
            <>
              <Label>Quer descrever a aparência do personagem?</Label>
              <div className="flex flex-wrap gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMode(m.value)}
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
                      mode === m.value ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow" : "bg-card hover:border-ring"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              {mode === "texto" && (
                <F label="Descreva a aparência"><Textarea rows={5} maxLength={2000} value={v.appearance} onChange={(e) => set("appearance", e.target.value)} className="bg-card" /></F>
              )}
              {mode === "foto" && (
                <div className="space-y-3">
                  <p className="rounded-2xl bg-secondary p-3 text-sm">
                    A foto será usada apenas como <b>referência</b> para criar a aparência do personagem com Inteligência Artificial. Ela fica visível só para a equipe editorial e nunca é publicada.
                  </p>
                  <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed bg-card p-4 text-sm hover:border-ring">
                    <ImageUp className="h-5 w-5 text-pink" />
                    <span>{photo ? "Foto selecionada — clique para trocar" : "Escolher foto (JPG, PNG ou WEBP, até 5 MB)"}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  </label>
                  {photo && <img src={photo} alt="Prévia" className="max-h-56 rounded-xl object-contain" />}
                  <F label="Observação sobre a foto (opcional)"><Input maxLength={500} value={v.photo_note} onChange={(e) => set("photo_note", e.target.value)} className="bg-card" /></F>
                </div>
              )}
            </>
          )}
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
                  <Link to="/diretrizes" target="_blank" className="font-bold text-pink underline">diretrizes</Link>, incluindo a cessão de direitos para possível incorporação na obra. Entendo que o envio não garante incorporação nem crédito.
                </span>
              </label>
              {mode === "foto" && (
                <label className="flex items-start gap-3">
                  <Checkbox checked={photoTerms} onCheckedChange={(c) => setPhotoTerms(c === true)} className="mt-0.5" />
                  <span>Sou a pessoa da foto (ou tenho autorização dela) e autorizo seu uso como referência visual, inclusive com IA, para criar a aparência de um personagem de Querido Dante. A foto não será publicada.</span>
                </label>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-between gap-2">
          <Button variant="ghost" className="rounded-full" disabled={i === 0} onClick={() => setI(i - 1)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          {last ? (
            <Button className="rounded-full bg-gradient-brand" disabled={busy || !adult || !terms || (mode === "foto" && !photoTerms)} onClick={send}>
              <Send className="h-4 w-4" /> {busy ? "Enviando..." : "Enviar"}
            </Button>
          ) : (
            <Button className="rounded-full bg-gradient-brand" onClick={next}>
              Continuar <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
