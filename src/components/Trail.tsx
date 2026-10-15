import s1 from "@/assets/stage-1.jpg";
import s2 from "@/assets/stage-2.jpg";
import s3 from "@/assets/stage-3.jpg";
import s4 from "@/assets/stage-4.jpg";
import s5 from "@/assets/stage-5.jpg";
import s6 from "@/assets/stage-6.jpg";
import s7 from "@/assets/stage-7.jpg";
import s8 from "@/assets/stage-8.jpg";
import { STAGES, getProgress } from "@/lib/stages";
import { Progress } from "@/components/ui/progress";

const IMGS = [s1, s2, s3, s4, s5, s6, s7, s8];
const fmt = (n: number) => n.toLocaleString("pt-BR");

export function Trail({ points }: { points: number }) {
  const p = getProgress(points);
  return (
    <section className="glass rounded-3xl p-5 sm:p-7">
      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
        <img
          src={IMGS[p.index]}
          alt={p.current.name}
          width={816}
          height={816}
          className="aspect-square w-full rounded-2xl object-cover shadow-glow [animation:float_6s_ease-in-out_infinite]"
        />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-pink">Trilha de progressão</p>
          <h2 className="mt-1 text-3xl font-extrabold">{p.current.name}</h2>
          <p className="mt-1 text-muted-foreground">{p.current.idea}</p>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-2">
            <span className="text-4xl font-extrabold text-gradient">{fmt(p.points)} pts</span>
            {p.next ? (
              <span className="text-sm text-muted-foreground">
                Faltam <b className="text-foreground">{fmt(p.remaining)}</b> para <b className="text-foreground">{p.next.name}</b> ({fmt(p.next.min)})
              </span>
            ) : (
              <span className="text-sm font-semibold text-pink">Etapa máxima alcançada ✦</span>
            )}
          </div>
          <Progress value={p.pct} className="mt-3 h-3" />
          <p className="mt-3 text-xs text-muted-foreground">
            Os pontos servem só para a sua progressão. Eles são independentes da nota editorial e não decidem incorporação na obra.
          </p>
        </div>
      </div>
      <ol className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-8">
        {STAGES.map((st, i) => (
          <li key={st.name} className={`text-center ${i <= p.index ? "" : "opacity-40 grayscale"}`} title={st.name}>
            <img src={IMGS[i]} alt="" loading="lazy" width={816} height={816} className="aspect-square w-full rounded-xl object-cover" />
            <p className="mt-1 text-[10px] font-semibold leading-tight">{st.name}</p>
            <p className="text-[10px] text-muted-foreground">{fmt(st.min)}</p>
          </li>
        ))}
      </ol>
      <style>{`@keyframes float{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-8px) rotate(1deg)}}`}</style>
    </section>
  );
}
