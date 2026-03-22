import Link from "next/link";
import { GoogleSignInButton } from "@/components/google-sign-in-button";

export default function AuthPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">Sign In</p>
        <h1>학교 메일로 로그인</h1>
        <p>
          시디위키는 읽기는 누구나 가능하지만, 작성과 관리자 기능은 <code>@kookmin.ac.kr</code>
          학교 메일 로그인 후 사용할 수 있게 준비하고 있습니다.
        </p>
        <div className="hero-actions">
          <GoogleSignInButton />
          <Link className="secondary-link" href="/">
            홈으로 돌아가기
          </Link>
        </div>
        <p className="auth-help">
          해시 주소가 붙은 링크를 보다가 로그인하려면 주소창에서 <code>#...</code> 부분을 지우고{" "}
          <code>/auth</code>로 들어오면 됩니다.
        </p>
      </section>
    </main>
  );
}
