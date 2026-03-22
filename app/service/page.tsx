import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserProfile, isAllowedSchoolUser } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/env";
import { WikiContent } from "@/components/wiki-content";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { SignOutButton } from "@/components/sign-out-button";
import { buildWikiLinkMap, getPageSections, getWikiHomepage, getWikiPages } from "@/lib/wiki";

function getStatusText(isLoggedIn: boolean, isAllowedDomain: boolean) {
  if (!isLoggedIn) {
    return "읽기는 누구나 가능하고, 작성은 로그인한 학과 구성원만 할 수 있도록 준비 중입니다.";
  }

  if (!isAllowedDomain) {
    return "현재 로그인은 되었지만 학교 메일 사용자가 아니라서 작성 권한은 막혀 있습니다.";
  }

  return "학교 메일 로그인이 확인되었습니다. 다음 단계에서 문서 작성과 저장 권한을 연결할 준비가 끝났습니다.";
}

export default async function ServicePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const authError = typeof params.auth_error === "string" ? params.auth_error : null;
  const envReady = hasSupabaseEnv();
  const userProfile = envReady ? await getCurrentUserProfile() : null;
  const isAllowedDomain = isAllowedSchoolUser(userProfile);
  const [{ page: homepage, source }, { pages }] = await Promise.all([getWikiHomepage(), getWikiPages()]);
  const isAdmin =
    Boolean(userProfile?.email) &&
    userProfile?.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

  if (userProfile && !isAllowedDomain) {
    redirect("/auth/error?reason=domain_not_allowed");
  }

  const sections = homepage ? getPageSections(homepage.content) : [];
  const categories = [...new Set(pages.map((page) => page.category))];
  const linkMap = buildWikiLinkMap(pages);

  return (
    <main className="shell">
      <div className="wiki-topbar">
        <Link href="/" className="logo-link">
          시디위키
        </Link>
        <div className="wiki-topbar-actions">
          <Link className="secondary-link" href={homepage ? `/wiki/${homepage.slug}` : "/"}>
            대문 문서 보기
          </Link>
        </div>
      </div>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Service Status</p>
          <h1>이제 문서를 실제 서비스 구조에서 읽어올 준비가 됐습니다.</h1>
          <p className="hero-text">
            이 화면은 로그인, 권한, DB 연결 상태를 확인하는 서비스 점검용 페이지입니다. 메인 화면은
            기존 위키 UI를 그대로 유지하고, 이 페이지에서만 서버 연결 상태를 점검합니다.
          </p>
          <div className="hero-actions">
            {userProfile ? <SignOutButton /> : <GoogleSignInButton />}
            <Link className="secondary-link" href="/wiki/community-guidelines">
              전체 규칙 문서 보기
            </Link>
          </div>
        </div>

        <div className="status-card">
          <span className="status-label">서비스 상태</span>
          <strong>
            {!envReady ? "환경변수 입력 필요" : userProfile ? "로그인 연결 완료" : "읽기 공개 모드"}
          </strong>
          <p>
            {!envReady
              ? "Supabase 환경변수를 아직 넣지 않아 로그인 확인을 시작하지 않은 상태입니다."
              : getStatusText(Boolean(userProfile), isAllowedDomain)}
          </p>
          <p>문서 데이터 소스: {source === "database" ? "Supabase" : "seed fallback"}</p>
        </div>
      </section>

      {!envReady ? (
        <section className="notice">
          <strong>먼저 채워야 할 값</strong>
          <p>
            <code>.env.local</code> 파일에 Supabase URL과 Anon Key를 넣어야 로그인 연결이
            시작됩니다. 형식은 프로젝트의 <code>.env.example</code>를 그대로 따라가면 됩니다.
          </p>
        </section>
      ) : null}

      {authError ? (
        <section className="notice error">
          <strong>로그인 제한 안내</strong>
          <p>
            현재 계정은 허용된 학교 메일 계정이 아니어서 작성 권한을 열 수 없습니다.
            <code>@kookmin.ac.kr</code> 계정으로 다시 로그인해 주세요.
          </p>
        </section>
      ) : null}

      <section className="wiki-layout">
        <article className="panel wiki-article-panel">
          {homepage ? (
            <>
              <div className="article-meta-row">
                <div>
                  <span className="status-label">현재 대문</span>
                  <h2>{homepage.title}</h2>
                </div>
                <Link className="secondary-link" href={`/wiki/${homepage.slug}`}>
                  전체 문서 열기
                </Link>
              </div>
              <WikiContent content={homepage.content} linkMap={linkMap} />
            </>
          ) : (
            <p className="empty-copy">아직 표시할 대문 문서가 없습니다.</p>
          )}
        </article>

        <aside className="wiki-sidebar">
          <section className="panel">
            <h2>목차</h2>
            {sections.length > 0 ? (
              <ul className="compact-list">
                {sections.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-copy">대문 문서에 표시할 목차가 없습니다.</p>
            )}
          </section>

          <section className="panel">
            <h2>문서 둘러보기</h2>
            <ul className="compact-list">
              {pages.slice(0, 12).map((page) => (
                <li key={page.slug}>
                  <Link href={`/wiki/${page.slug}`} className="wiki-link">
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>현재 확인된 것</h2>
          <ul>
            <li>읽기 공개, 작성 로그인 필요 구조로 갈 수 있는 기본 환경이 준비되었습니다.</li>
            <li>학교 메일 도메인 제한을 서버에서 검사할 자리가 마련되었습니다.</li>
            <li>문서는 이제 Supabase 테이블을 먼저 읽고, 비어 있으면 시드 데이터로 fallback합니다.</li>
          </ul>
        </article>

        <article className="panel">
          <h2>현재 로그인 상태</h2>
          {userProfile ? (
            <dl className="facts">
              <div>
                <dt>이메일</dt>
                <dd>{userProfile.email}</dd>
              </div>
              <div>
                <dt>학교 메일 여부</dt>
                <dd>{isAllowedDomain ? "허용됨" : "제한됨"}</dd>
              </div>
              <div>
                <dt>관리자 여부</dt>
                <dd>{isAdmin ? "관리자" : "일반 사용자"}</dd>
              </div>
            </dl>
          ) : (
            <p className="empty-copy">아직 로그인하지 않았습니다. 지금은 누구나 읽을 수 있는 공개 진입 상태입니다.</p>
          )}
        </article>

        <article className="panel">
          <h2>현재 데이터 구조</h2>
          <ul>
            <li>총 문서 수: {pages.length}</li>
            <li>분류 수: {categories.length}</li>
            <li>대문 문서 slug: {homepage?.slug ?? "없음"}</li>
            <li>초기 관리자 이메일: {process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "미설정"}</li>
          </ul>
        </article>

        <article className="panel">
          <h2>다음 단계에서 붙일 기능</h2>
          <p>
            다음에는 기존 위키 UI 안으로 로그인 상태와 편집 권한을 자연스럽게 연결하고, 새 문서
            작성과 수정 저장을 DB 기반으로 바꾸면 됩니다.
          </p>
        </article>
      </section>
    </main>
  );
}
