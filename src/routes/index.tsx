import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Bot, Sparkles, User, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getHomeData } from "@/lib/public.functions";

const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHomeData() });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Laboratório Criativo de Querido Dante — Processo seletivo" },
      { name: "description", content: "Crie personagens e sugira tramas para o universo da comédia romântica pop Querido Dante." },
      { property: "og:title", content: "Laboratório Criativo de Querido Dante" },
      { property: "og:description", content: "Leitores e mentes criativas cocriando o universo de Querido Dante." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  return (
    <div className="space-y-20">
      <section className="relative pt-6 text-center sm:pt-14">
        <span className="glass inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-pink">
          <Sparkles className="h-3.5 w-3.5" /> Laboratório Criativo
        </span>
        <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          Processo seletivo de novo membro pro{" "}
          <s className="decoration-pink decoration-4 text-muted-foreground">hospício</s>{" "}
          <span className="text-gradient">Universo Querido Dante</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Um adolescente ranzinza, uma Inteligência Artificial e um universo que leitores e mentes criativas ajudam a construir.
          Envie personagens e tramas para a banca avaliar.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg" className="lift rounded-full bg-gradient-brand">
            <Link to="/criar-personagem">
              <Wand2 className="h-4 w-4" /> Criar Personagem
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="lift glass rounded-full">
            <Link to="/sugerir-trama">
              <BookOpen className="h-4 w-4" /> Sugerir Trama
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="lift glass rounded-full">
            <Link to="/eu-como-personagem">
              <Bot className="h-4 w-4" /> Eu como Personagem (IA)
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="rounded-full">
            <Link to="/diretrizes">Ver Diretrizes</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">Não precisa de conta: você recebe um protocolo e uma chave privada para acompanhar.</p>
      </section>

      <section>
        <h2 className="text-center text-3xl font-extrabold">Banca avaliadora</h2>
        <p className="mt-2 text-center text-muted-foreground">Quem lê cada experimento.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.judges.map((j) => (
            <div key={j.id} className="glass lift rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-primary-foreground">
                  {j.kind === "ia" ? <Bot /> : <User />}
                </span>
                <div>
                  <h3 className="text-lg font-bold">{j.name}</h3>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-foreground">
                    {j.kind === "ia" ? "IA" : "Humano"}
                  </span>
                </div>
              </div>
              {j.description && <p className="mt-4 text-sm text-muted-foreground">{j.description}</p>}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-center text-3xl font-extrabold">Vitrine de experimentos aprovados</h2>
        <p className="mt-2 text-center text-muted-foreground">Ideias que passaram pela banca.</p>
        {data.showcase.length === 0 ? (
          <div className="glass mx-auto mt-8 max-w-md rounded-3xl p-8 text-center text-muted-foreground">
            A vitrine ainda está vazia. O primeiro experimento aprovado pode ser o seu.
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.showcase.map((s) => (
              <article key={s.id} className="glass lift overflow-hidden rounded-3xl">
                {s.image_url ? (
                  <img src={s.image_url} alt={s.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="aspect-[4/3] w-full bg-gradient-brand opacity-80" />
                )}
                <div className="p-5">
                  <h3 className="text-xl font-bold">{s.name}</h3>
                  <p className="text-xs font-semibold text-pink">por {s.creator}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.synopsis}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16 text-center">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Apoio Cultural
        </span>
        <div className="mx-auto mt-3 max-w-4xl">
          <a
            href="https://instagram.com/vssd_design"
            target="_blank"
            rel="noopener noreferrer"
            className="glass lift group block overflow-hidden rounded-3xl border border-white/10 p-2 sm:p-3 transition-all duration-300 hover:border-pink/40 hover:shadow-glow"
          >
            <img
              src="/IMG-20261005-WA2514.jpg"
              alt="Publicidade Querido Dante"
              loading="lazy"
              className="w-full rounded-2xl object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </a>
        </div>
      </section>
    </div>
  );
}
