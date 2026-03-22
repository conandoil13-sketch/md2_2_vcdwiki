create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique,
  display_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  category text not null default '일반',
  content text not null default '',
  updated_at date not null default current_date,
  is_published boolean not null default true,
  is_locked boolean not null default false,
  locked_by uuid references public.profiles (id) on delete set null,
  locked_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  modified_at timestamptz not null default now()
);

create table if not exists public.wiki_page_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.wiki_pages (id) on delete cascade,
  editor_id uuid references public.profiles (id) on delete set null,
  title text not null,
  summary text not null default '',
  category text not null default '일반',
  content text not null default '',
  revision_note text,
  created_at timestamptz not null default now()
);

create or replace function public.set_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_page_modified_at()
returns trigger
language plpgsql
as $$
begin
  new.modified_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    updated_at = now();

  return new;
end;
$$;

create or replace function public.is_kookmin_user()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'email', '') ilike '%@kookmin.ac.kr';
$$;

create or replace function public.is_admin_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

drop trigger if exists on_profiles_updated on public.profiles;
create trigger on_profiles_updated
before update on public.profiles
for each row
execute function public.set_timestamp();

drop trigger if exists on_wiki_pages_modified on public.wiki_pages;
create trigger on_wiki_pages_modified
before update on public.wiki_pages
for each row
execute function public.set_page_modified_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.wiki_pages enable row level security;
alter table public.wiki_page_revisions enable row level security;

drop policy if exists "profiles_self_or_admin_select" on public.profiles;
create policy "profiles_self_or_admin_select"
on public.profiles
for select
to authenticated
using (auth.uid() = id or public.is_admin_user());

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "published_pages_public_read" on public.wiki_pages;
create policy "published_pages_public_read"
on public.wiki_pages
for select
to anon, authenticated
using (is_published = true or public.is_admin_user());

drop policy if exists "kookmin_users_insert_pages" on public.wiki_pages;
create policy "kookmin_users_insert_pages"
on public.wiki_pages
for insert
to authenticated
with check (
  public.is_kookmin_user()
  and created_by = auth.uid()
);

drop policy if exists "kookmin_users_update_pages" on public.wiki_pages;
create policy "kookmin_users_update_pages"
on public.wiki_pages
for update
to authenticated
using (public.is_kookmin_user() and (is_locked = false or public.is_admin_user()))
with check (public.is_kookmin_user() and (is_locked = false or public.is_admin_user()));

drop policy if exists "admin_delete_pages" on public.wiki_pages;
create policy "admin_delete_pages"
on public.wiki_pages
for delete
to authenticated
using (public.is_admin_user());

drop policy if exists "revisions_public_read" on public.wiki_page_revisions;
create policy "revisions_public_read"
on public.wiki_page_revisions
for select
to authenticated
using (public.is_admin_user() or public.is_kookmin_user());

drop policy if exists "kookmin_users_insert_revisions" on public.wiki_page_revisions;
create policy "kookmin_users_insert_revisions"
on public.wiki_page_revisions
for insert
to authenticated
with check (
  public.is_kookmin_user()
  and editor_id = auth.uid()
);

comment on table public.wiki_pages is '실제 공개 위키 문서 본문을 저장하는 기본 테이블';
comment on table public.wiki_page_revisions is '문서 수정 이력을 쌓아두는 테이블';
comment on table public.profiles is '로그인한 사용자와 역할 정보를 저장하는 테이블';
