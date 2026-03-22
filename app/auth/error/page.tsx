import Link from "next/link";

const reasonMap: Record<string, { title: string; description: string }> = {
  domain_not_allowed: {
    title: "학교 메일 계정이 필요합니다",
    description:
      "시디위키는 읽기는 누구나 가능하지만, 작성은 국민대학교 학교 메일 계정으로 로그인한 사용자만 허용할 예정입니다.",
  },
  oauth_failed: {
    title: "로그인 연결에 실패했습니다",
    description: "Google 로그인 또는 Supabase 설정 중 하나가 아직 완전히 연결되지 않았을 수 있습니다.",
  },
  default: {
    title: "로그인 상태를 확인해 주세요",
    description: "다시 로그인해 보거나, Redirect URL과 Google Provider 설정이 맞는지 점검해 주세요.",
  },
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const reason = typeof params.reason === "string" ? params.reason : "default";
  const content = reasonMap[reason] ?? reasonMap.default;

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Auth Check</p>
        <h1>{content.title}</h1>
        <p>{content.description}</p>
        <div className="hero-actions">
          <Link className="button-primary" href="/">
            홈으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
