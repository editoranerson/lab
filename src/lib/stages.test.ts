import { describe, expect, it } from "vitest";
import { getProgress } from "./stages";

describe("trilha de progressão", () => {
  it("começa em Página em branco com 0 pontos", () => {
    const r = getProgress(0);
    expect(r.current!.name).toBe("Página em branco");
    expect(r.next?.name).toBe("Primeiras palavras");
    expect(r.remaining).toBe(1000);
  });
  it("Leitor curioso a partir de 5.000", () => {
    expect(getProgress(4999).current!.name).toBe("Primeiras palavras");
    expect(getProgress(5000).current!.name).toBe("Leitor curioso");
  });
  it("Mestre literário em 30.000 e falta 20.000 para Lenda", () => {
    const r = getProgress(30000);
    expect(r.current!.name).toBe("Mestre literário");
    expect(r.remaining).toBe(20000);
  });
  it("Lenda do universo é a etapa final em 50.000", () => {
    const r = getProgress(52000);
    expect(r.current!.name).toBe("Lenda do universo");
    expect(r.next).toBeNull();
  });
});
