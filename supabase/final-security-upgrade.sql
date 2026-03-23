-- 최종 공개 전 보안 보강 SQL
-- 목적:
-- 1) 일반 사용자가 자기 profiles.role 을 admin 으로 올리는 권한 상승 방지
-- 2) 수정 기록(wiki_page_revisions)을 로그인한 학교 구성원/관리자만 읽도록 제한
-- 3) 잠금 컬럼과 관련 정책이 누락된 배포 환경도 한 번에 정리
--
-- 사용 방법:
-- Supabase SQL Editor에서 이 파일 전체를 그대로 실행하세요.
-- 이미 일부가 적용된 상태여도 다시 실행할 수 있게 idempotent 형태로 작성했습니다.

begin;

alter table public.wiki_pages
  add column if not exists is_locked boolean not null default false,
  add column if not exists locked_by uuid references public.profiles (id) on delete set null,
  add column if not exists locked_at timestamptz;

create or replace function public.prevent_profile_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- role 변경은 관리자만 가능
  if new.role is distinct from old.role and not public.is_admin_user() then
    raise exception 'role은 관리자만 변경할 수 있습니다.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_role_escalation_on_profiles on public.profiles;
create trigger prevent_profile_role_escalation_on_profiles
before update on public.profiles
for each row
execute function public.prevent_profile_role_escalation();

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update"
on public.profiles
for update
to authenticated
using (auth.uid() = id or public.is_admin_user())
with check (auth.uid() = id or public.is_admin_user());

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

commit;
