import { createFileRoute } from "@tanstack/react-router";
import { Wizard, type Step } from "@/components/Wizard";
import { RELATIONS, ROLES } from "@/lib/schemas";

const steps: Step[] = [
  {
    title: "Papel e conceito",
    fields: [
      { name: "role", label: "Papel", type: "choice", options: ROLES },
      { name: "relation", label: "Relação com o protagonista", type: "choice", options: RELATIONS },
      { name: "name", label: "Nome do personagem", max: 80 },
      { name: "concept", label: "Conceito", type: "textarea", max: 1500, placeholder: "Quem é, o que quer, por que importa para a história." },
    ],
  },
  {
    title: "Ficha visual",
    fields: [
      { name: "ethnicity", label: "Etnia / cor", max: 80 },
      { name: "gender", label: "Gênero", max: 80 },
      { name: "orientation", label: "Orientação sexual", max: 80 },
      { name: "hair", label: "Cabelo", max: 200 },
      { name: "accessories", label: "Acessórios", optional: true, max: 300 },
      { name: "clothing", label: "Vestimenta", type: "textarea", max: 400 },
    ],
  },
  {
    title: "Personalidade e conflito",
    fields: [
      { name: "qualities_flaws", label: "Qualidades e defeitos", type: "textarea", max: 1500 },
      { name: "pressure", label: "Reação sob pressão", type: "textarea", max: 800 },
      { name: "communication", label: "Estilo de comunicação", type: "textarea", max: 800 },
      { name: "hobbies", label: "Hobbies", max: 500 },
      { name: "free", label: "Campo livre", type: "textarea", optional: true, max: 2000 },
    ],
  },
];

export const Route = createFileRoute("/criar-personagem")({
  head: () => ({
    meta: [
      { title: "Criar Personagem — Laboratório Querido Dante" },
      { name: "description", content: "Crie um aluno ou professor para o universo de Querido Dante." },
      { property: "og:title", content: "Criar Personagem para Querido Dante" },
      { property: "og:description", content: "Formulário em etapas para propor um novo personagem." },
    ],
  }),
  component: () => (
    <div>
      <h1 className="mb-8 text-center text-4xl font-extrabold">
        Criar <span className="text-gradient">Personagem</span>
      </h1>
      <Wizard kind="personagem" steps={steps} />
    </div>
  ),
});
