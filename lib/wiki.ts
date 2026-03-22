import { homepageId, seedPages, type SeedWikiPage } from "@/lib/wiki-seed.generated";
import { hasSupabaseEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type WikiPage = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
  updatedAt: string;
  isPublished: boolean;
  isLocked: boolean;
  lockedBy: string | null;
  lockedAt: string | null;
};

function mapSeedPage(page: SeedWikiPage): WikiPage {
  return {
    id: page.id,
    slug: page.id,
    title: page.title,
    summary: page.summary,
    category: page.category,
    content: page.content,
    updatedAt: page.updatedAt,
    isPublished: true,
    isLocked: false,
    lockedBy: null,
    lockedAt: null,
  };
}

function mapDatabasePage(page: {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  content: string;
  updated_at: string;
  is_published: boolean;
  is_locked?: boolean;
  locked_by?: string | null;
  locked_at?: string | null;
}): WikiPage {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    summary: page.summary,
    category: page.category,
    content: page.content,
    updatedAt: page.updated_at,
    isPublished: page.is_published,
    isLocked: Boolean(page.is_locked),
    lockedBy: page.locked_by ?? null,
    lockedAt: page.locked_at ?? null,
  };
}

function getSeedPages() {
  return seedPages.map(mapSeedPage);
}

export async function getWikiPages() {
  if (!hasSupabaseEnv()) {
    return {
      pages: getSeedPages(),
      source: "seed" as const,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("wiki_pages")
      .select("id, slug, title, summary, category, content, updated_at, is_published, is_locked, locked_by, locked_at")
      .eq("is_published", true)
      .order("title", { ascending: true });

    if (error || !data || data.length === 0) {
      return {
        pages: getSeedPages(),
        source: "seed" as const,
      };
    }

    return {
      pages: data.map(mapDatabasePage),
      source: "database" as const,
    };
  } catch {
    return {
      pages: getSeedPages(),
      source: "seed" as const,
    };
  }
}

export async function getWikiHomepage() {
  const { pages, source } = await getWikiPages();
  const page = pages.find((item) => item.slug === homepageId) ?? pages[0] ?? null;

  return { page, source };
}

export async function getWikiPageBySlug(slug: string) {
  const { pages, source } = await getWikiPages();
  const page = pages.find((item) => item.slug === slug) ?? null;

  return { page, source };
}

export function buildWikiLinkMap(pages: WikiPage[]) {
  const entries = new Map<string, string>();

  pages.forEach((page) => {
    entries.set(page.slug, page.slug);
    entries.set(page.title, page.slug);
  });

  return entries;
}

export function getPageSections(content: string) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## "))
    .map((line) => line.replace(/^##\s+/, ""));
}
