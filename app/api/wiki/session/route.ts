import { NextResponse } from "next/server";
import { isAllowedSchoolUser } from "@/lib/auth";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({
      isLoggedIn: false,
      canEdit: false,
      isAdmin: false,
      email: null,
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return NextResponse.json({
    isLoggedIn: true,
    canEdit: isAllowedSchoolUser(user),
    isAdmin: profile?.role === "admin",
    email: user.email ?? null,
  });
}
