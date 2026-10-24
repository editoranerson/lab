import { describe, expect, it } from "vitest";
import { buildAiCopy, identificationSchema } from "./schemas";

describe("cópia para IA", () => {
  it("não inclui telefone nem nome completo", () => {
    const txt = buildAiCopy({ protocol: "QD-ABCDEFGH", kind: "trama", data: { title: "Baile", description: "x" } });
    expect(txt).not.toMatch(/telefone|whatsapp|nome completo/i);
  });
});

describe("identificação", () => {
  const base = { full_name: "Ana Souza", adult: true, terms: true };
  it("exige DDD no telefone", () => {
    expect(identificationSchema.safeParse({ ...base, phone: "99999-9999" }).success).toBe(false);
    expect(identificationSchema.safeParse({ ...base, phone: "(11) 99999-9999" }).success).toBe(true);
  });
  it("exige 18 anos ou mais", () => {
    expect(identificationSchema.safeParse({ ...base, adult: false, phone: "11999999999" }).success).toBe(false);
  });
});

import { submissionInput as si } from "./schemas";
describe("espelho", () => {
  const base = { kind: "espelho", full_name: "Ana Souza", phone: "11999999999", adult: true, terms: true,
    data: { ai_response: "x".repeat(40), name: "Lia", gender: "Feminino", appearance_mode: "nenhuma" } };
  it("aceita sem aparência", () => expect(si.safeParse(base).success).toBe(true));
  it("exige foto no modo foto", () =>
    expect(si.safeParse({ ...base, data: { ...base.data, appearance_mode: "foto" } }).success).toBe(false));
  it("exige descrição no modo texto", () =>
    expect(si.safeParse({ ...base, data: { ...base.data, appearance_mode: "texto" } }).success).toBe(false));
});
