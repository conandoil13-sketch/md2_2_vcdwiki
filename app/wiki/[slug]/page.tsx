import Link from "next/link";
import { notFound } from "next/navigation";
import { WikiContent } from "@/components/wiki-content";
import { buildWikiLinkMap, getPageSections, getWikiPageBySlug, getWikiPages } from "@/lib/wiki";

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ page, source }, { pages }] = await Promise.all([getWikiPageBySlug(slug), getWikiPages()]);

  if (!page) {
    notFound();
  }

  const relatedPages = pages
    .filter((item) => item.category === page.category && item.slug !== page.slug)
    .slice(0, 8);
  const sections = getPageSections(page.content);
  const linkMap = buildWikiLinkMap(pages);

  return (
    <main className="shell">
      <div className="wiki-topbar">
        <Link href="/" className="logo-link">
          시디위키
        </Link>
        <div className="wiki-topbar-actions">
          <Link href="/" className="secondary-link">
            대문으로
          </Link>
        </div>
      </div>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">{page.category}</p>
          <h1>{page.title}</h1>
          <p className="hero-text">{page.summary}</p>
        </div>

        <div className="status-card">
          <span className="status-label">문서 정보</span>
          <strong>{source === "database" ? "DB에서 불러옴" : "시드 데이터 사용 중"}</strong>
          <p>최종 표시 날짜: {page.updatedAt}</p>
        </div>
      </section>

      <section className="wiki-layout">
        <article className="panel wiki-article-panel">
          <WikiContent content={page.content} linkMap={linkMap} />
        </article>

        <aside className="wiki-sidebar">
          <section className="panel">
            <h2>목차</h2>
            {sections.length > 0 ? (
              <ul className="compact-list">
                {sections.map((section) => (
                  <li key={section}>{section}</li>
                ))}
              </ul>
            ) : (
              <p className="empty-copy">아직 자동 목차가 없습니다.</p>
            )}
          </section>

          <section className="panel">
            <h2>같은 분류 문서</h2>
            <ul className="compact-list">
              {relatedPages.map((item) => (
                <li key={item.slug}>
                  <Link href={`/wiki/${item.slug}`} className="wiki-link">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  );
}
