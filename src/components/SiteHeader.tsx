import { Link, useNavigate } from "@tanstack/react-router";
import { FlaskConical, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

const linkCls =
  "rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
const activeCls = { className: "bg-secondary text-foreground" };

export function SiteHeader() {
  const { user, isAdmin } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = (
    <>
      <Link to="/" className={linkCls} activeProps={activeCls} activeOptions={{ exact: true }} onClick={() => setOpen(false)}>
        Início
      </Link>
      <Link to="/diretrizes" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Diretrizes
      </Link>
      <Link to="/acompanhar" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
        Acompanhar protocolo
      </Link>
      {user && (
        <Link to="/painel" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
          Minhas Contribuições
        </Link>
      )}
      {isAdmin && (
        <Link to="/admin" className={linkCls} activeProps={activeCls} onClick={() => setOpen(false)}>
          Admin
        </Link>
      )}
    </>
  );

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className="glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-2">
        <Link to="/" className="flex items-center gap-2 font-display text-sm font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-primary-foreground">
            <FlaskConical className="h-4 w-4" />
          </span>
          <span className="hidden sm:inline">Laboratório Querido Dante</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">{links}</nav>
        <div className="flex items-center gap-2">
          {user ? (
            <Button size="sm" variant="ghost" onClick={signOut} className="rounded-full">
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          ) : (
            <Button asChild size="sm" className="rounded-full bg-gradient-brand">
              <Link to="/auth">Entrar</Link>
            </Button>
          )}
          <Button size="icon" variant="ghost" className="rounded-full lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>
      {open && <nav className="glass mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl p-3 lg:hidden">{links}</nav>}
    </header>
  );
}
