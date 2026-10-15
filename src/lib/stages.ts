export type Stage = { name: string; min: number; idea: string };

export const STAGES: Stage[] = [
  { name: "Página em branco", min: 0, idea: "Uma folha limpa suspensa, esperando a primeira ideia." },
  { name: "Primeiras palavras", min: 1000, idea: "Letras de tinta flutuam e começam a se encontrar." },
  { name: "Leitor curioso", min: 5000, idea: "Um livro aberto com marcador e palavras saltando." },
  { name: "Explorador de histórias", min: 10000, idea: "Um livro-portal com mini-cenários para explorar." },
  { name: "Aprendiz das palavras", min: 15000, idea: "A caneta-tinteiro escreve uma página iluminada." },
  { name: "Arquiteto de histórias", min: 20000, idea: "Cenas e personagens montados como maquete." },
  { name: "Mestre literário", min: 30000, idea: "Encadernação com páginas douradas e histórias em órbita." },
  { name: "Lenda do universo", min: 50000, idea: "O livro-cosmos, com personagens e cenários próprios." },
];

export function getProgress(points: number) {
  const p = Math.max(0, Math.floor(points || 0));
  let idx = 0;
  for (let i = 0; i < STAGES.length; i++) if (p >= STAGES[i].min) idx = i;
  const current = STAGES[idx];
  const next = STAGES[idx + 1] ?? null;
  const remaining = next ? next.min - p : 0;
  const pct = next ? Math.round(((p - current.min) / (next.min - current.min)) * 100) : 100;
  return { points: p, index: idx, current, next, remaining, pct };
}

export const STATUS_LABEL: Record<string, string> = {
  em_avaliacao: "Em avaliação",
  pre_selecionado: "Pré-selecionado",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  desclassificado: "Desclassificado",
};

export const INCORPORATION_LABEL: Record<string, string> = {
  nenhum: "Sem decisão",
  rascunho: "Rascunho (interno)",
  implementado: "Implementado",
};
