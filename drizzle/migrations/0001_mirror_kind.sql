ALTER TYPE public.submission_kind ADD VALUE IF NOT EXISTS 'espelho';
ALTER TABLE public.guidelines ADD COLUMN IF NOT EXISTS mirror_prompt text NOT NULL DEFAULT 'Com base em tudo o que você já sabe sobre mim pelas nossas conversas, imagine que eu sou um personagem de uma comédia romântica pop ambientada numa escola.

Responda em português, de forma divertida e carinhosa:
1. Como você me vê: minha personalidade (sou gentil, estressado(a), sonhador(a), sarcástico(a)...?), manias e jeito de falar.
2. Que tipo de ALUNO(A) eu seria nessa escola.
3. Que tipo de PROFESSOR(A) eu seria nessa escola.
4. Uma ideia de conflito ou trama engraçada/romântica envolvendo meu personagem.

Não inclua meu nome real, telefone, endereço ou qualquer dado pessoal.';
CREATE POLICY "mirror photos admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'mirror-photos' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mirror photos admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'mirror-photos' AND public.has_role(auth.uid(), 'admin'));