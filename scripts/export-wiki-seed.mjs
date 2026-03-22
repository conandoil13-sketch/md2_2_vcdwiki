import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const projectRoot = process.cwd();
const sourcePath = path.join(projectRoot, "data/wikiData.js");
const outputTsPath = path.join(projectRoot, "lib/wiki-seed.generated.ts");
const outputSqlPath = path.join(projectRoot, "supabase/seed.sql");

const source = fs.readFileSync(sourcePath, "utf8");
const context = {
  window: {},
};

vm.createContext(context);
vm.runInContext(source, context);

const seedData = context.window.WIKI_SEED_DATA;

if (!seedData || !Array.isArray(seedData.pages)) {
  throw new Error("WIKI_SEED_DATA.pages를 읽지 못했습니다.");
}

const tsContent = `/* 이 파일은 scripts/export-wiki-seed.mjs가 data/wikiData.js를 기준으로 생성합니다. */
export type SeedWikiPage = {
  id: string;
  title: string;
  summary: string;
  category: string;
  updatedAt: string;
  content: string;
};

export const homepageId = ${JSON.stringify(seedData.homepage)};

export const seedPages: SeedWikiPage[] = ${JSON.stringify(seedData.pages, null, 2)} as SeedWikiPage[];
`;

const sqlRows = seedData.pages
  .map((page) => {
    const values = [
      page.id,
      page.title,
      page.summary,
      page.category,
      page.content,
      page.updatedAt,
    ].map((value) => `$sql$${String(value)}$sql$`);

    return `(${values.join(", ")}, true)`;
  })
  .join(",\n");

const sqlContent = `-- 이 파일은 scripts/export-wiki-seed.mjs가 data/wikiData.js를 기준으로 생성합니다.
insert into public.wiki_pages (
  slug,
  title,
  summary,
  category,
  content,
  updated_at,
  is_published
)
values
${sqlRows}
on conflict (slug) do update
set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  content = excluded.content,
  updated_at = excluded.updated_at,
  is_published = excluded.is_published;
`;

fs.mkdirSync(path.dirname(outputTsPath), { recursive: true });
fs.mkdirSync(path.dirname(outputSqlPath), { recursive: true });
fs.writeFileSync(outputTsPath, tsContent);
fs.writeFileSync(outputSqlPath, sqlContent);

console.log(`Generated ${path.relative(projectRoot, outputTsPath)} and ${path.relative(projectRoot, outputSqlPath)}`);
