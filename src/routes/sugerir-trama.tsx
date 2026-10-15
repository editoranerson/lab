import { createFileRoute } from "@tanstack/react-router";
import { Wizard, type Step } from "@/components/Wizard";
import { SCENES } from "@/lib/schemas";

const steps: Step[] = [
  {
    title: "A cena",
    fields: [
      { name: "title", label: "Título", max: 120 },
      { name: "scene_type", label: "Tipo de cena", type: "choice", options: SCENES },
      { name: "characters", label: "Personagens envolvidos", max: 500, placeholder: "Dante, a IA, ..." },
    ],
  },
  {
    title: "Descrição detalhada",
    fields: [{ name: "description", label: "Conte a trama (mínimo 30 caracteres)", type: "textarea", max: 6000 }],
  },
];

export const Route = createFileRoute("/sugerir-trama")({
  head: () => ({
    meta: [
      { title: "Sugerir Trama — Laboratório Querido Dante" },
      { name: "description", content: "Proponha uma cena de comédia, romance, drama escolar ou plot twist para Querido Dante." },
      { property: "og:title", content: "Sugerir Trama para Querido Dante" },
      { property: "og:description", content: "Formulário em etapas para propor uma nova trama." },
    ],
  }),
  component: () => (
    <div>
      <h1 className="mb-8 text-center text-4xl font-extrabold">
        Sugerir <span className="text-gradient">Trama</span>
      </h1>
      <Wizard kind="trama" steps={steps} />
    </div>
  ),
});
