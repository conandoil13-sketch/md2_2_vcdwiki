import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "관리자만 문서 잠금을 변경할 수 있습니다." }, { status: 403 });
  }

  const body = await request.json();
  const locked = Boolean(body?.locked);

  const { data, error } = await supabase
    .from("wiki_pages")
    .update({
      is_locked: locked,
      locked_by: locked ? user.id : null,
      locked_at: locked ? new Date().toISOString() : null,
    })
    .eq("slug", slug)
    .select("slug, is_locked, locked_at, locked_by")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "문서 잠금 상태를 바꾸지 못했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    slug: data.slug,
    isLocked: data.is_locked,
    lockedAt: data.locked_at,
    lockedBy: data.locked_by,
  });
}
