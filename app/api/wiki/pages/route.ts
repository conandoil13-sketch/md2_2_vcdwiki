import { NextResponse } from "next/server";
import { isAllowedSchoolUser } from "@/lib/auth";
import { getWikiPages } from "@/lib/wiki";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getPublicAliasFromId } from "@/lib/public-alias";

function normalizeLegacyPage(page: {
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
  updatedAt: string;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
}) {
  return {
    id: page.slug,
    title: page.title,
    summary: page.summary,
    category: page.category,
    updatedAt: page.updatedAt,
    content: page.content,
    isLocked: page.isLocked,
    lockedAt: page.lockedAt,
    lockedByAlias: page.lockedBy ? getPublicAliasFromId(page.lockedBy) : null,
  };
}

export async function GET() {
  const { pages, source } = await getWikiPages();

  return NextResponse.json(
    {
      source,
      pages: pages.map(normalizeLegacyPage),
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  if (!isAllowedSchoolUser(user)) {
    return NextResponse.json({ error: "학교 메일 계정만 문서를 저장할 수 있습니다." }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const body = await request.json();
  const slug = String(body?.id ?? "").trim();
  const title = String(body?.title ?? "").trim();
  const summary = String(body?.summary ?? "").trim();
  const category = String(body?.category ?? "문서").trim() || "문서";
  const content = String(body?.content ?? "");
  const updatedAt = String(body?.updatedAt ?? "").trim() || new Date().toISOString().slice(0, 10);

  if (!slug || !title) {
    return NextResponse.json({ error: "문서 제목과 식별자는 비워둘 수 없습니다." }, { status: 400 });
  }

  const { data: existingPage, error: existingError } = await supabase
    .from("wiki_pages")
    .select("id, slug, is_locked")
    .eq("slug", slug)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "기존 문서 조회에 실패했습니다." }, { status: 500 });
  }

  if (existingPage?.is_locked && !isAdmin) {
    return NextResponse.json({ error: "이 문서는 관리자에 의해 잠겨 있어 수정할 수 없습니다." }, { status: 423 });
  }

  let pageId = existingPage?.id ?? null;

  if (existingPage) {
    const { data, error } = await supabase
      .from("wiki_pages")
      .update({
        title,
        summary,
        category,
        content,
        updated_at: updatedAt,
        is_published: true,
      })
      .eq("slug", slug)
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "문서 수정에 실패했습니다." }, { status: 500 });
    }

    pageId = data.id;
  } else {
    const { data, error } = await supabase
      .from("wiki_pages")
      .insert({
        slug,
        title,
        summary,
        category,
        content,
        updated_at: updatedAt,
        is_published: true,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "문서 생성에 실패했습니다." }, { status: 500 });
    }

    pageId = data.id;
  }

  const { error: revisionError } = await supabase.from("wiki_page_revisions").insert({
    page_id: pageId,
    editor_id: user.id,
    title,
    summary,
    category,
    content,
    revision_note: existingPage ? "위키 문서 수정" : "위키 문서 생성",
  });

  if (revisionError) {
    return NextResponse.json({ error: "수정 기록 저장에 실패했습니다." }, { status: 500 });
  }

  return NextResponse.json({
    page: {
      id: slug,
      title,
      summary,
      category,
      updatedAt,
      content,
    },
  });
}
