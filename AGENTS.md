<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Laboratório Querido Dante
- Submissions are written/read only through server functions in `src/lib/submissions.functions.ts` (service client after validation); RLS on submissions/evaluations/notifications allows only admins, so participants never see personal data or the internal "rascunho" incorporation state.
- Guest access uses protocol + SHA-256-hashed private key; account linking requires both, never name/phone.
- Admin UI talks to the database with the browser client and relies on `has_role(...,'admin')` RLS; the first account ever created becomes admin (trigger `handle_new_user`).
- Progression points (0–100 per judge) and editorial score (0–10) are separate columns; trail total = sum of points across the user's submissions.
