import Link from "next/link";
import { getCurrentUserProfile, isAllowedSchoolUser } from "@/lib/auth";

export default async function HomePage() {
  const userProfile = await getCurrentUserProfile().catch(() => null);
  const isAllowedDomain = isAllowedSchoolUser(userProfile);
  const isAdmin = userProfile?.email?.toLowerCase() === process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase();

  return (
    <main className="legacy-shell">
      <div className="legacy-toolbar">
        <div className="legacy-toolbar-copy">
          <strong>시디위키 서비스 연결 중</strong>
          <p>메인 화면은 기존 위키 UI를 그대로 보여주고, 로그인과 권한 상태는 여기서 이어서 확인합니다.</p>
        </div>
        <div className="legacy-toolbar-actions">
          {userProfile ? (
            <>
              <span className="legacy-user-chip">
                {userProfile.email}
                {isAdmin ? " · 관리자" : isAllowedDomain ? " · 로그인됨" : " · 제한됨"}
              </span>
              <Link href="/service" className="secondary-link">
                서비스 상태
              </Link>
            </>
          ) : (
            <Link href="/auth" className="button-primary">
              학교 메일 로그인
            </Link>
          )}
          <Link href="/service" className="secondary-link">
            서버 연결 보기
          </Link>
        </div>
      </div>

      <iframe
        className="legacy-frame"
        src="/legacy/index.html"
        title="시디위키 프로토타입"
      />
    </main>
  );
}
