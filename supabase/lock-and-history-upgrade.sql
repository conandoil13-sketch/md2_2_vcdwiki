alter table public.wiki_pages
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_by uuid references public.profiles (id) on delete set null,
  add column if not exists locked_at timestamptz;

drop policy if exists "kookmin_users_update_pages" on public.wiki_pages;
create policy "kookmin_users_update_pages"
on public.wiki_pages
for update
to authenticated
using (public.is_kookmin_user() and (is_locked = false or public.is_admin_user()))
with check (public.is_kookmin_user() and (is_locked = false or public.is_admin_user()));

drop policy if exists "revisions_public_read" on public.wiki_page_revisions;
create policy "revisions_public_read"
on public.wiki_page_revisions
for select
to authenticated
using (public.is_admin_user() or public.is_kookmin_user());
