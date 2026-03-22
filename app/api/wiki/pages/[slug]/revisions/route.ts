import { NextResponse } from "next/server";
import { createSupabaseRouteHandlerClient } from "@/lib/supabase/server";
import { getPublicAliasFromId } from "@/lib/public-alias";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createSupabaseRouteHandlerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "수정 기록은 로그인 후 확인할 수 있습니다." }, { status: 401 });
  }

  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  const { data: page, error: pageError } = await supabase
    .from("wiki_pages")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (pageError || !page) {
    return NextResponse.json({ error: "문서를 찾지 못했습니다." }, { status: 404 });
  }

  const { data: revisions, error } = await supabase
    .from("wiki_page_revisions")
    .select("id, title, summary, category, content, revision_note, created_at, editor_id")
    .eq("page_id", page.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "수정 기록을 불러오지 못했습니다." }, { status: 500 });
  }

  const editorIds = [...new Set((revisions ?? []).map((item) => item.editor_id).filter(Boolean))];
  let emailById = new Map<string, string>();

  if (isAdmin && editorIds.length > 0) {
    const { data: editors } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", editorIds);

    emailById = new Map((editors ?? []).map((editor) => [editor.id, editor.email]));
  }

  return NextResponse.json({
    revisions: (revisions ?? []).map((revision) => ({
      id: revision.id,
      title: revision.title,
      summary: revision.summary,
      category: revision.category,
      content: revision.content,
      revisionNote: revision.revision_note,
      createdAt: revision.created_at,
      editorAlias: getPublicAliasFromId(revision.editor_id),
      editorEmail: isAdmin && revision.editor_id ? emailById.get(revision.editor_id) ?? null : null,
    })),
    isAdmin,
  });
}
