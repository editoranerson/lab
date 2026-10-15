
CREATE TYPE public.app_role AS ENUM ('admin','user');
CREATE TYPE public.participant_status AS ENUM ('em_avaliacao','pre_selecionado','aprovado','reprovado','desclassificado');
CREATE TYPE public.incorporation_status AS ENUM ('nenhum','rascunho','implementado');
CREATE TYPE public.submission_kind AS ENUM ('personagem','trama');
CREATE TYPE public.judge_kind AS ENUM ('ia','humano');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  full_name text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)))
  ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.judges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  kind public.judge_kind NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.judges TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.judges TO authenticated;
GRANT ALL ON public.judges TO service_role;
ALTER TABLE public.judges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "judges public read" ON public.judges FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "judges admin write" ON public.judges FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.judges (name, kind, description, sort_order) VALUES
 ('ChatGPT','ia','Analisa coerência e potencial narrativo.',1),
 ('Gemini','ia','Avalia criatividade e originalidade.',2),
 ('Autor / Opinião Pública','humano','Decide o encaixe final no universo.',3);

CREATE TABLE public.guidelines (
  id int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.guidelines TO anon, authenticated;
GRANT INSERT, UPDATE ON public.guidelines TO authenticated;
GRANT ALL ON public.guidelines TO service_role;
ALTER TABLE public.guidelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guidelines public read" ON public.guidelines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "guidelines admin write" ON public.guidelines FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.guidelines (content) VALUES ($md$# Diretrizes do Laboratório Criativo

## Sobre a obra
**Querido Dante** é uma comédia romântica pop sobre um adolescente ranzinza e uma Inteligência Artificial que insiste em entender o coração humano. O Laboratório é o espaço onde leitores e mentes criativas cocriam esse universo.

## Critérios de avaliação
- **Criatividade** — originalidade da ideia e do tom.
- **Coerência** — encaixe com personagens, tom e regras da história.
- **Viabilidade** — potencial real de virar cena ou personagem no livro.

## Quem pode participar
Apenas pessoas com **18 anos ou mais**.

## Limites por etapa
Cada participante pode enviar até **3 personagens** e **3 tramas** por etapa do processo.

## Uso e cessão de direitos
Ao enviar uma proposta, você autoriza o autor a usar, adaptar, modificar e incorporar a ideia, total ou parcialmente, na obra e em materiais derivados, sem compensação obrigatória.

## Sem garantia de incorporação ou crédito
O envio **não garante** incorporação na história nem crédito. A incorporação oficial é decidida pelo autor somente após análise.

## Conduta
Propostas com discurso de ódio, plágio, conteúdo sexual explícito ou dados de terceiros serão desclassificadas.

## Contato
Acompanhe o autor no Instagram: [@anerson_7](https://instagram.com/anerson_7)
$md$);

CREATE TABLE public.showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  creator text NOT NULL,
  synopsis text NOT NULL,
  image_url text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.showcase TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.showcase TO authenticated;
GRANT ALL ON public.showcase TO service_role;
ALTER TABLE public.showcase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "showcase public read" ON public.showcase FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "showcase admin write" ON public.showcase FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol text NOT NULL UNIQUE,
  key_hash text NOT NULL,
  user_id uuid,
  kind public.submission_kind NOT NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  title text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_prompt text,
  status public.participant_status NOT NULL DEFAULT 'em_avaliacao',
  incorporation public.incorporation_status NOT NULL DEFAULT 'nenhum',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.submissions (user_id);
GRANT SELECT, UPDATE, DELETE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions admin all" ON public.submissions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  judge_id uuid NOT NULL REFERENCES public.judges(id) ON DELETE CASCADE,
  editorial_score numeric(4,2) CHECK (editorial_score >= 0 AND editorial_score <= 10),
  progress_points int CHECK (progress_points >= 0 AND progress_points <= 100),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, judge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.evaluations TO authenticated;
GRANT ALL ON public.evaluations TO service_role;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "evaluations admin all" ON public.evaluations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'aviso',
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications admin all" ON public.notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
