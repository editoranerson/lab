import { z } from "zod";

const s = (max: number, min = 1) => z.string().trim().min(min, "Campo obrigatório").max(max, `Máximo de ${max} caracteres`);
const opt = (max: number) => z.string().trim().max(max, `Máximo de ${max} caracteres`).optional().default("");

export const identificationSchema = z.object({
  full_name: s(120, 3),
  phone: z
    .string()
    .trim()
    .refine((v) => /^\d{10,11}$/.test(v.replace(/\D/g, "")), "Informe telefone/WhatsApp com DDD"),
  adult: z.literal(true, { errorMap: () => ({ message: "É preciso ter 18 anos ou mais" }) }),
  terms: z.literal(true, { errorMap: () => ({ message: "É preciso aceitar as diretrizes" }) }),
  ai_prompt: opt(2000),
});

export const ROLES = ["Aluno", "Professor"] as const;
export const RELATIONS = ["Amizade", "Inimizade", "Romance", "Coadjuvante"] as const;
export const SCENES = ["Comédia", "Romance", "Drama escolar", "Reviravolta / Plot twist"] as const;

export const characterData = z.object({
  role: z.enum(ROLES),
  relation: z.enum(RELATIONS),
  name: s(80),
  concept: s(1500),
  ethnicity: s(80),
  gender: s(80),
  orientation: s(80),
  hair: s(200),
  accessories: opt(300),
  clothing: s(400),
  qualities_flaws: s(1500),
  pressure: s(800),
  communication: s(800),
  hobbies: s(500),
  free: opt(2000),
});

export const plotData = z.object({
  title: s(120),
  scene_type: z.enum(SCENES),
  characters: s(500),
  description: s(6000, 30),
});

export const submissionInput = z.discriminatedUnion("kind", [
  identificationSchema.extend({ kind: z.literal("personagem"), data: characterData }),
  identificationSchema.extend({ kind: z.literal("trama"), data: plotData }),
]);
export type SubmissionInput = z.infer<typeof submissionInput>;

export const accessSchema = z.object({
  protocol: z.string().trim().toUpperCase().regex(/^QD-[A-Z0-9]{8}$/, "Protocolo inválido"),
  key: z.string().trim().min(16).max(64),
});

export const FIELD_LABELS: Record<string, string> = {
  role: "Papel",
  relation: "Relação com o protagonista",
  name: "Nome",
  concept: "Conceito",
  ethnicity: "Etnia / cor",
  gender: "Gênero",
  orientation: "Orientação sexual",
  hair: "Cabelo",
  accessories: "Acessórios",
  clothing: "Vestimenta",
  qualities_flaws: "Qualidades e defeitos",
  pressure: "Reação sob pressão",
  communication: "Estilo de comunicação",
  hobbies: "Hobbies",
  free: "Campo livre",
  title: "Título",
  scene_type: "Tipo de cena",
  characters: "Personagens envolvidos",
  description: "Descrição detalhada",
};

/** Text for AI judges: never includes name, phone or any personal data. */
export function buildAiCopy(sub: { protocol: string; kind: string; data: Record<string, unknown>; ai_prompt?: string | null }) {
  const lines = [
    `Proposta ${sub.protocol} — ${sub.kind === "personagem" ? "Personagem" : "Trama"} para "Querido Dante"`,
    "",
    ...Object.entries(sub.data)
      .filter(([, v]) => v !== "" && v != null)
      .map(([k, v]) => `${FIELD_LABELS[k] ?? k}: ${String(v)}`),
  ];
  if (sub.ai_prompt) lines.push("", `Pedido do participante aos jurados de IA: ${sub.ai_prompt}`);
  lines.push(
    "",
    "Avalie com nota editorial de 0 a 10 (criatividade, coerência e viabilidade para o livro) e, separadamente, de 0 a 100 pontos de progressão.",
  );
  return lines.join("\n");
}
