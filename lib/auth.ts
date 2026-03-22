type MinimalUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
} | null;

export async function getCurrentUserProfile() {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export function isAllowedSchoolUser(user: MinimalUser) {
  if (!user?.email) {
    return false;
  }

  const email = user.email.toLowerCase();
  const hostedDomain = String(user.user_metadata?.hd ?? "");
  const expectedDomain = (process.env.NEXT_PUBLIC_GOOGLE_HOSTED_DOMAIN ?? "kookmin.ac.kr").toLowerCase();

  return email.endsWith(`@${expectedDomain}`) && (hostedDomain === "" || hostedDomain === expectedDomain);
}
