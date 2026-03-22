import fs from "node:fs/promises";
import path from "node:path";
import Script from "next/script";

async function getLegacyBodyHtml() {
  const legacyHtmlPath = path.join(process.cwd(), "public/legacy/index.html");
  const html = await fs.readFile(legacyHtmlPath, "utf8");
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  if (!match) {
    throw new Error("legacy index.html의 body 내용을 읽지 못했습니다.");
  }

  return match[1].trim();
}

async function getLegacyCss() {
  const legacyCssPath = path.join(process.cwd(), "public/legacy/styles.css");
  return fs.readFile(legacyCssPath, "utf8");
}

export default async function HomePage() {
  const [legacyBodyHtml, legacyCss] = await Promise.all([getLegacyBodyHtml(), getLegacyCss()]);

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=IBM+Plex+Sans+KR:wght@400;500;600;700&family=IBM+Plex+Serif:wght@500;600&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: legacyCss }} />
      <Script src="/legacy/data/wikiData.js" strategy="beforeInteractive" />
      <Script src="/legacy/app.js" strategy="afterInteractive" />
      <main
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: legacyBodyHtml }}
      />
    </>
  );
}
