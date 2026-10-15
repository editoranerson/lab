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
