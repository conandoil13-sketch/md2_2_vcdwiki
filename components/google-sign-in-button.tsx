"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function GoogleSignInButton() {
  async function handleSignIn() {
    const supabase = createSupabaseBrowserClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/`;

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          hd: process.env.NEXT_PUBLIC_GOOGLE_HOSTED_DOMAIN ?? "kookmin.ac.kr",
          prompt: "select_account",
        },
      },
    });
  }

  return (
    <button className="button-primary" type="button" onClick={handleSignIn}>
      Google로 로그인
    </button>
  );
}
