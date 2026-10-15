import { STATUS_LABEL } from "@/lib/stages";

const tone: Record<string, string> = {
  em_avaliacao: "bg-secondary text-secondary-foreground",
  pre_selecionado: "bg-accent text-accent-foreground",
  aprovado: "bg-success text-primary-foreground",
  reprovado: "bg-muted text-muted-foreground",
  desclassificado: "bg-destructive text-destructive-foreground",
};

export function StatusBadge({ status, implemented }: { status: string; implemented?: boolean }) {
  return (
    <span className="inline-flex flex-wrap gap-1">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${tone[status] ?? tone.em_avaliacao}`}>{STATUS_LABEL[status] ?? status}</span>
      {implemented && <span className="rounded-full bg-gradient-brand px-2.5 py-0.5 text-xs font-bold text-primary-foreground">Entrou na história ✦</span>}
    </span>
  );
}
