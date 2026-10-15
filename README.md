# Dante's Creative Haven

Aplicação web full-stack para o “Laboratório Criativo de Querido Dante”, plataforma de criação colaborativa de personagens e tramas para a comédia romântica pop “Querido Dante”, sobre um adolescente ranzinza e uma Inteligência Artificial. Construa com a stack full-stack do Lovable.

Quero uma experiência moderna, responsiva para celular e desktop, com estética “Tech-Romance”: roxo e rosa (violeta/púrpura e pink/fúcsia), superfícies leves em glassmorphism, bordas suaves, microinterações fluidas, títulos expressivos e texto legível.

A página inicial deve apresentar o Laboratório como um espaço em que leitores e mentes criativas cocriam o universo da história, com os CTAs “Criar Personagem”, “Sugerir Trama” e “Ver Diretrizes”. O título principal é “Processo seletivo de novo membro pro ~~hospício~~ Universo Querido Dante”, com “hospício” tachado. Inclua uma banca avaliadora com jurados identificados como IA ou humano, inicialmente ChatGPT, Gemini e Autor / Opinião Pública, gerenciável no Admin. Inclua também a vitrine de experimentos aprovados, mostrando arte/foto, nome, criador(a) e sinopse.

Crie a página /diretrizes com conteúdo editável pelo Admin em Markdown: contexto da obra, critérios de avaliação (criatividade, coerência e viabilidade), idade mínima de 18 anos, limites de propostas por etapa, regras de uso e cessão de direitos para possível incorporação na obra, explicação de que o envio não garante incorporação ou crédito, e link para o Instagram do autor @anerson_7. A incorporação oficial é decidida após análise. O status “Rascunho” é um controle editorial interno do autor: uma ideia pode permanecer em rascunho sem decisão de implementar; “Implementado” indica que entrou na história. Não exponha “Rascunho” como status editorial interno ao participante.

Contas são opcionais. Permita envio por visitante, com protocolo e chave privada para acompanhar ou associar depois; só associe à conta quando protocolo e chave privada forem apresentados. Não use nome e telefone como prova de posse. Quem cria conta pode acompanhar contribuições no painel; o visitante recebe seus dados de acesso ao envio. Nome completo e telefone/WhatsApp com DDD são campos de identificação do formulário, mas mantenha telefone e dados pessoais estritamente fora dos endpoints públicos e disponíveis apenas para Admin autenticado. Não exponha telefone na cópia de proposta para IA.

Crie formulários em etapas. Formulário de personagem: identificação; papel (aluno/professor), relação com protagonista (amizade/inimizade/romance/coadjuvante), nome e conceito; ficha visual (etnia/cor, gênero, orientação sexual, cabelo, acessórios e vestimenta); personalidade e conflito (qualidades e defeitos, reação sob pressão, estilo de comunicação, hobbies e campo livre); prompt opcional para jurados de IA; aceite legal. Formulário de trama: identificação, título, tipo de cena (comédia, romance, drama escolar, reviravolta/plot twist), personagens envolvidos, descrição detalhada, prompt opcional para IA e aceite legal.

Inclua área “Minhas Contribuições” para contas, com protocolo, propostas e status visível de avaliação, e central de notificações para avisos de moderação. Permita ao usuário definir ou editar dados da conta. Mantenha trilha de progressão por pontos, não insígnias. A pontuação da trilha é separada da nota editorial e serve somente para progressão: não decide incorporação nem elegibilidade ou resgate de prêmios. Cada jurado pode dar de 0 a 100 pontos de progressão por proposta, independentemente da nota editorial de 0 a 10 para adequação ao livro. Registre os pontos de cada jurado e use a soma para o total acumulado da trilha.

Etapas da trilha e pontos necessários: Página em branco — 0; Primeiras palavras — 1.000; Leitor curioso — 5.000; Explorador de histórias — 10.000; Aprendiz das palavras — 15.000; Arquiteto de histórias — 20.000; Mestre literário — 30.000; Lenda do universo — 50.000. Crie uma representação 3D própria para cada fase, mantendo uma metáfora literária consistente e elementos de livro, papel, tinta, escrita, histórias e universo, com acentos violeta e rosa. Ideias visuais previamente definidas: folha limpa suspensa; letras de tinta flutuantes; livro aberto com marcador e palavras saltando; livro-portal com mini-cenários; caneta-tinteiro escrevendo página iluminada; livro com cenas/personagens como maquete; livro encadernado com páginas douradas e histórias orbitando; livro-cosmos com personagens e cenários. Apresente progresso, pontos atuais, próximo marco e diferença até a próxima etapa.

Painel /admin com acesso restrito e seguro. Separe personagens e tramas; mostre protocolos, notas editoriais de jurados (0 a 10), pontos de progressão por jurado (0 a 100), média editorial e status de participante (“Em avaliação”, “Pré-selecionado”, “Aprovado”, “Reprovado”, “Desclassificado”). Permita filtro por status e ordenação por média ou data. A avaliação editorial, os pontos de progressão e a decisão de incorporação são campos/processos independentes. Ofereça cópia rápida do conteúdo da proposta para IA sem telefone ou dados sensíveis. Permita notificar/sinalizar infrações ao participante. Inclua gestão da vitrine, da banca e das diretrizes em Markdown.

Pode haver recompensas amplas e discricionárias, como e-books autorais, mas trate-as como bônus-surpresa, sem promessa pública, sem relação com a pontuação, a avaliação ou a incorporação, e sem exigir decisão de prêmio no fluxo da proposta.

Use persistência e autenticação apropriadas para os dados e áreas privadas. Implemente validação e controles de acesso para que dados pessoais e funções de Admin nunca fiquem acessíveis publicamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/5c0b73b6-eb48-482f-bbdc-f9f8effe0a98).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
