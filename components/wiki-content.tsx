import Link from "next/link";

function renderInline(text: string, linkMap: Map<string, string>) {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      const slug = linkMap.get(match[2]) ?? match[2];
      const label = match[3] ?? match[2];
      nodes.push(
        <Link key={`${slug}-${match.index}`} href={`/wiki/${encodeURIComponent(slug)}`} className="wiki-link">
          {label}
        </Link>
      );
    } else if (match[4] && match[5]) {
      nodes.push(
        <a
          key={`${match[5]}-${match.index}`}
          href={match[5]}
          target="_blank"
          rel="noreferrer"
          className="wiki-link"
        >
          {match[4]}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export function WikiContent({
  content,
  linkMap,
}: {
  content: string;
  linkMap: Map<string, string>;
}) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: string[] = [];

  function flushList() {
    if (listBuffer.length === 0) {
      return;
    }

    blocks.push(
      <ul key={`list-${blocks.length}`} className="wiki-list">
        {listBuffer.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInline(item, linkMap)}</li>
        ))}
      </ul>
    );
    listBuffer = [];
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith("- ")) {
      listBuffer.push(line.replace(/^- /, ""));
      return;
    }

    flushList();

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={`h2-${index}`} className="wiki-h2">
          {line.replace(/^##\s+/, "")}
        </h2>
      );
      return;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={`h3-${index}`} className="wiki-h3">
          {line.replace(/^###\s+/, "")}
        </h3>
      );
      return;
    }

    if (line.startsWith("> ")) {
      blocks.push(
        <blockquote key={`quote-${index}`} className="wiki-quote">
          {renderInline(line.replace(/^>\s+/, ""), linkMap)}
        </blockquote>
      );
      return;
    }

    blocks.push(
      <p key={`p-${index}`} className="wiki-paragraph">
        {renderInline(line, linkMap)}
      </p>
    );
  });

  flushList();

  return <div className="wiki-content">{blocks}</div>;
}
