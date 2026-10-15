import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { getGuidelines } from "@/lib/public.functions";

const q = queryOptions({ queryKey: ["guidelines"], queryFn: () => getGuidelines() });

export const Route = createFileRoute("/diretrizes")({
  head: () => ({
    meta: [
      { title: "Diretrizes — Laboratório Querido Dante" },
      { name: "description", content: "Critérios, regras de participação e cessão de direitos do Laboratório Criativo de Querido Dante." },
      { property: "og:title", content: "Diretrizes do Laboratório Querido Dante" },
      { property: "og:description", content: "Como as propostas são avaliadas e o que você precisa saber antes de enviar." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(q);
  return (
    <article className="glass prose-lab mx-auto max-w-3xl rounded-3xl p-6 sm:p-10">
      <ReactMarkdown
        components={{ a: ({ node: _n, ...p }) => <a {...p} target="_blank" rel="noreferrer" /> }}
      >
        {data.content}
      </ReactMarkdown>
    </article>
  );
}
