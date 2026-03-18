(function () {
  const STORAGE_KEY = "kmu-vcd-wiki-local-pages";
  const THEME_STORAGE_KEY = "kmu-vcd-wiki-theme";
  const THEMES = [
    {
      id: "council-26",
      label: "26 학생회",
      accent: "#cf2129",
      secondary: "#abd9ca",
      text: "#231314",
      muted: "#684449",
      bgStart: "#fff4f4",
      bgMid: "#eff7f3",
      bgEnd: "#fffaf7",
      orbLeft: "rgba(207, 33, 41, 0.18)",
      orbRight: "rgba(171, 217, 202, 0.28)",
    },
    {
      id: "council-25",
      label: "25 학생회",
      accent: "#003e87",
      secondary: "#ebebeb",
      text: "#0d1a2b",
      muted: "#4d5f78",
      bgStart: "#edf4ff",
      bgMid: "#f4f7fb",
      bgEnd: "#ffffff",
      orbLeft: "rgba(0, 62, 135, 0.18)",
      orbRight: "rgba(235, 235, 235, 0.7)",
    },
    {
      id: "council-24",
      label: "24 학생회",
      accent: "#2a4938",
      secondary: "#f3cfda",
      text: "#2f2027",
      muted: "#6a5b62",
      bgStart: "#fffafb",
      bgMid: "#f6f1f3",
      bgEnd: "#ffffff",
      orbLeft: "rgba(243, 207, 218, 0.42)",
      orbRight: "rgba(235, 235, 235, 0.85)",
    },
    {
      id: "council-23",
      label: "23 학생회",
      accent: "#2c8bbf",
      secondary: "#ffeda3",
      text: "#142532",
      muted: "#4a6570",
      bgStart: "#eef8fc",
      bgMid: "#fff9df",
      bgEnd: "#fffdf2",
      orbLeft: "rgba(44, 139, 191, 0.22)",
      orbRight: "rgba(255, 237, 163, 0.52)",
    },
  ];

  const state = {
    pages: [],
    currentPageId: null,
    mode: "view",
    searchTerm: "",
    themeId: null,
    showSuggestions: false,
  };

  const elements = {
    pageList: document.getElementById("page-list"),
    pageCountBadge: document.getElementById("page-count-badge"),
    recentChanges: document.getElementById("recent-changes"),
    articleView: document.getElementById("article-view"),
    editorPanel: document.getElementById("editor-panel"),
    editorTitle: document.getElementById("editor-title"),
    editorSummary: document.getElementById("editor-summary"),
    editorTextarea: document.getElementById("editor-textarea"),
    searchInput: document.getElementById("search-input"),
    searchSuggestions: document.getElementById("search-suggestions"),
    tocList: document.getElementById("toc-list"),
    heroPageName: document.getElementById("hero-page-name"),
    heroUpdatedAt: document.getElementById("hero-updated-at"),
    heroTitle: document.getElementById("hero-title"),
    heroDescription: document.getElementById("hero-description"),
    articlePath: document.getElementById("article-path"),
    viewModeButton: document.getElementById("view-mode-button"),
    editModeButton: document.getElementById("edit-mode-button"),
    previewModeButton: document.getElementById("preview-mode-button"),
    createPageButton: document.getElementById("create-page-button"),
    saveButton: document.getElementById("save-button"),
    copyCodeButton: document.getElementById("copy-code-button"),
    cancelButton: document.getElementById("cancel-button"),
    copyFeedback: document.getElementById("copy-feedback"),
    resetStorageButton: document.getElementById("reset-storage-button"),
    themeSelector: document.getElementById("theme-selector"),
    macroButtons: Array.from(document.querySelectorAll(".macro-button")),
    topbar: document.querySelector(".topbar"),
  };

  const fakeWikiApi = {
    async fetchPages() {
      await delay(120);
      const seedPages = deepClone(window.WIKI_SEED_DATA.pages || []);
      const localPages = loadLocalPages();
      return mergePages(seedPages, localPages);
    },

    async savePage(page) {
      await delay(100);
      const pages = loadLocalPages();
      const existingIndex = pages.findIndex((item) => item.id === page.id);

      if (existingIndex >= 0) {
        pages[existingIndex] = page;
      } else {
        pages.push(page);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
      return page;
    },

    async clearLocalEdits() {
      await delay(80);
      localStorage.removeItem(STORAGE_KEY);
    },
  };

  initialize();

  async function initialize() {
    bindEvents();
    updateTopbarHeight();
    window.addEventListener("resize", updateTopbarHeight);

    state.themeId = loadThemeId();
    renderThemeSelector();
    applyTheme(state.themeId);

    state.pages = await fakeWikiApi.fetchPages();
    state.currentPageId = resolveInitialPageId();
    renderApp();
  }

  function bindEvents() {
    elements.searchInput.addEventListener("input", (event) => {
      state.searchTerm = event.target.value.trim().toLowerCase();
      state.showSuggestions = Boolean(state.searchTerm);
      renderSearchSuggestions();
    });

    elements.searchInput.addEventListener("focus", () => {
      state.showSuggestions = Boolean(state.searchTerm);
      renderSearchSuggestions();
    });

    document.addEventListener("click", (event) => {
      const searchBox = elements.searchInput.closest(".searchbox");
      if (searchBox && !searchBox.contains(event.target)) {
        state.showSuggestions = false;
        renderSearchSuggestions();
      }
    });

    elements.viewModeButton.addEventListener("click", () => setMode("view"));
    elements.editModeButton.addEventListener("click", () => setMode("edit"));
    elements.previewModeButton.addEventListener("click", () => setMode("preview"));

    elements.createPageButton.addEventListener("click", () => {
      const newPage = createBlankPage();
      state.pages = [newPage, ...state.pages];
      state.currentPageId = newPage.id;
      fillEditor(newPage);
      setMode("edit");
      renderApp();
    });

    elements.saveButton.addEventListener("click", async () => {
      const draft = buildPageFromEditor();
      await fakeWikiApi.savePage(draft);
      state.pages = await fakeWikiApi.fetchPages();
      state.currentPageId = draft.id;
      setMode("view");
      renderApp();
    });

    elements.copyCodeButton.addEventListener("click", async () => {
      const draft = buildPageFromEditor();
      const serialized = serializePageForSeedData(draft);
      const copied = await copyText(serialized);

      elements.copyFeedback.textContent = copied
        ? "복사되었습니다. data/wikiData.js의 pages 배열 안에 그대로 붙여넣으면 됩니다."
        : "자동 복사에 실패했습니다. 아래 브라우저 권한을 확인해 주세요.";
    });

    elements.cancelButton.addEventListener("click", () => {
      fillEditor(getCurrentPage());
      elements.copyFeedback.textContent = "";
      setMode("view");
    });

    elements.resetStorageButton.addEventListener("click", async () => {
      const confirmed = window.confirm(
        "브라우저에 저장된 로컬 편집 내용을 초기화할까요? data/wikiData.js 원본은 그대로 남아 있습니다."
      );

      if (!confirmed) {
        return;
      }

      await fakeWikiApi.clearLocalEdits();
      state.pages = await fakeWikiApi.fetchPages();
      state.currentPageId = resolveInitialPageId();
      elements.copyFeedback.textContent = "";
      setMode("view");
      renderApp();
    });

    elements.macroButtons.forEach((button) => {
      button.addEventListener("click", () => insertMacro(button.dataset.macro));
    });
  }

  function renderApp() {
    renderPageList();
    renderRecentChanges();
    renderSearchSuggestions();
    renderCurrentPage();
    syncModeButtons();
  }

  function renderPageList() {
    const pages = state.pages;
    elements.pageCountBadge.textContent = `${pages.length}개`;
    elements.pageList.innerHTML = "";

    if (!pages.length) {
      elements.pageList.innerHTML = '<div class="empty-state">검색 결과가 없습니다.</div>';
      return;
    }

    pages.forEach((page) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = page.id === state.currentPageId ? "is-active" : "";
      button.innerHTML = `<strong>${escapeHtml(page.title)}</strong><div class="meta-row">${escapeHtml(
        page.category || "분류 없음"
      )}</div>`;
      button.addEventListener("click", () => {
        state.currentPageId = page.id;
        setMode("view");
        renderApp();
      });
      elements.pageList.appendChild(button);
    });
  }

  function renderThemeSelector() {
    elements.themeSelector.innerHTML = "";

    THEMES.forEach((theme) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `theme-chip${theme.id === state.themeId ? " is-active" : ""}`;
      button.innerHTML = `
        <span class="theme-swatch" aria-hidden="true">
          <span style="background:${theme.accent}"></span>
          <span style="background:${theme.secondary}"></span>
        </span>
        <span>
          <strong>${escapeHtml(theme.label)}</strong>
          <small>학생회 테마 팔레트 적용</small>
        </span>
        <span class="theme-chip-code">${escapeHtml(
        `${theme.accent.replace("#", "")} / ${theme.secondary.replace("#", "")}`
      )}</span>
      `;
      button.addEventListener("click", () => {
        state.themeId = theme.id;
        localStorage.setItem(THEME_STORAGE_KEY, theme.id);
        applyTheme(theme.id);
        renderThemeSelector();
      });
      elements.themeSelector.appendChild(button);
    });
  }

  function renderSearchSuggestions() {
    const suggestions = getSearchSuggestions();
    elements.searchSuggestions.innerHTML = "";

    if (!state.showSuggestions || !suggestions.length) {
      elements.searchSuggestions.hidden = true;
      return;
    }

    suggestions.forEach((page) => {
      const button = document.createElement("button");
      button.type = "button";
      button.innerHTML = `
        <strong>${escapeHtml(page.title)}</strong>
        <small>${escapeHtml(page.category || "문서")} · ${escapeHtml(page.summary || "")}</small>
      `;
      button.addEventListener("click", () => {
        state.currentPageId = page.id;
        state.showSuggestions = false;
        elements.searchInput.value = page.title;
        state.searchTerm = page.title.toLowerCase();
        setMode("view");
        renderApp();
      });
      elements.searchSuggestions.appendChild(button);
    });

    elements.searchSuggestions.hidden = false;
  }

  function renderRecentChanges() {
    const pages = [...state.pages]
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
      .slice(0, 5);

    elements.recentChanges.innerHTML = pages
      .map(
        (page) => `
          <li>
            <strong>${escapeHtml(page.title)}</strong>
            <span>${escapeHtml(page.updatedAt || "-")} · ${escapeHtml(page.summary || "")}</span>
          </li>
        `
      )
      .join("");
  }

  function renderCurrentPage() {
    const page = getCurrentPage();

    if (!page) {
      elements.articleView.innerHTML = '<div class="empty-state">문서를 찾을 수 없습니다.</div>';
      elements.articleView.hidden = false;
      elements.editorPanel.hidden = true;
      elements.tocList.innerHTML = "";
      return;
    }

    elements.heroPageName.textContent = page.title;
    elements.heroUpdatedAt.textContent = page.updatedAt || "-";
    elements.heroTitle.textContent = page.title;
    elements.heroDescription.textContent = page.summary || "문서 설명이 아직 없습니다.";
    elements.articlePath.textContent = `${page.category || "문서"} / ${page.title}`;

    fillEditor(page);

    if (state.mode === "view") {
      elements.articleView.hidden = false;
      elements.editorPanel.hidden = true;
      elements.copyFeedback.textContent = "";
      renderArticle(page);
      return;
    }

    if (state.mode === "edit") {
      elements.articleView.hidden = true;
      elements.editorPanel.hidden = false;
      renderToc([]);
      return;
    }

    elements.articleView.hidden = false;
    elements.editorPanel.hidden = false;
    renderPreview();
  }

  function renderArticle(page) {
    const parsed = parseWikiMarkup(page.content || "", state.pages);
    elements.articleView.innerHTML = `
      <h1>${escapeHtml(page.title)}</h1>
      <div class="meta-box">
        <div><span class="meta-row">분류</span><br /><strong>${escapeHtml(page.category || "문서")}</strong></div>
        <div><span class="meta-row">요약</span><br /><strong>${escapeHtml(page.summary || "-")}</strong></div>
        <div><span class="meta-row">수정일</span><br /><strong>${escapeHtml(page.updatedAt || "-")}</strong></div>
      </div>
      ${parsed.html}
    `;

    bindArticleLinks();
    renderToc(parsed.headings);
  }

  function renderPreview() {
    const previewPage = buildPageFromEditor();
    const parsed = parseWikiMarkup(previewPage.content || "", state.pages);

    elements.articleView.innerHTML = `
      <h1>${escapeHtml(previewPage.title || "새 문서")}</h1>
      <div class="meta-box">
        <div><span class="meta-row">분류</span><br /><strong>${escapeHtml(previewPage.category || "문서")}</strong></div>
        <div><span class="meta-row">요약</span><br /><strong>${escapeHtml(previewPage.summary || "-")}</strong></div>
        <div><span class="meta-row">미리보기</span><br /><strong>저장 전 상태</strong></div>
      </div>
      ${parsed.html}
    `;

    bindArticleLinks();
    renderToc(parsed.headings);
  }

  function renderToc(headings) {
    elements.tocList.innerHTML = "";

    if (!headings.length) {
      elements.tocList.innerHTML = '<div class="empty-state">제목을 넣으면 목차가 자동 생성됩니다.</div>';
      return;
    }

    headings.forEach((heading) => {
      const link = document.createElement("a");
      link.href = `#${heading.id}`;
      link.textContent = `${heading.level === 3 ? "ㆍ" : ""}${heading.text}`;
      elements.tocList.appendChild(link);
    });
  }

  function bindArticleLinks() {
    elements.articleView.querySelectorAll("[data-page-id]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const pageId = event.currentTarget.dataset.pageId;
        state.currentPageId = pageId;
        setMode("view");
        renderApp();
      });
    });
  }

  function fillEditor(page) {
    if (!page) {
      return;
    }

    elements.editorTitle.value = page.title || "";
    elements.editorSummary.value = page.summary || "";
    elements.editorTextarea.value = page.content || "";
  }

  function buildPageFromEditor() {
    const existing = getCurrentPage();
    const title = elements.editorTitle.value.trim() || "새 문서";
    const summary = elements.editorSummary.value.trim();

    return {
      id: existing && existing.id ? existing.id : slugify(title),
      title,
      summary,
      category: existing?.category || "문서",
      updatedAt: formatDate(new Date()),
      content: elements.editorTextarea.value,
    };
  }

  function setMode(mode) {
    state.mode = mode;
    renderCurrentPage();
    syncModeButtons();
  }

  function syncModeButtons() {
    [
      [elements.viewModeButton, "view"],
      [elements.editModeButton, "edit"],
      [elements.previewModeButton, "preview"],
    ].forEach(([button, mode]) => {
      button.classList.toggle("is-active", state.mode === mode);
    });
  }

  function getCurrentPage() {
    return state.pages.find((page) => page.id === state.currentPageId) || state.pages[0] || null;
  }

  function getSearchSuggestions() {
    if (!state.searchTerm) {
      return [];
    }

    const query = state.searchTerm;

    return [...state.pages]
      .map((page) => {
        const title = page.title.toLowerCase();
        let score = 0;

        if (title === query) {
          score += 100;
        }
        if (title.startsWith(query)) {
          score += 60;
        }
        if (title.includes(query)) {
          score += 30;
        }
        if ((page.summary || "").toLowerCase().includes(query)) {
          score += 10;
        }

        return { page, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title, "ko"))
      .slice(0, 5)
      .map((item) => item.page);
  }

  function resolveInitialPageId() {
    const homepage = window.WIKI_SEED_DATA.homepage;
    return state.pages.some((page) => page.id === homepage)
      ? homepage
      : state.pages[0]?.id || null;
  }

  function createBlankPage() {
    const nextIndex = state.pages.length + 1;
    return {
      id: `new-page-${nextIndex}`,
      title: `새 문서 ${nextIndex}`,
      summary: "새 문서 요약을 입력하세요.",
      category: "문서",
      updatedAt: formatDate(new Date()),
      content: `## 문서 소개\n이 문서는 새로 작성 중입니다.\n`,
    };
  }

  function updateTopbarHeight() {
    const height = elements.topbar ? `${elements.topbar.offsetHeight}px` : "0px";
    document.documentElement.style.setProperty("--topbar-height", height);
  }

  function insertMacro(type) {
    const textarea = elements.editorTextarea;
    const templates = {
      "heading-2": "\n## 새 섹션 제목\n내용을 입력하세요.\n",
      "heading-3": "\n### 새 하위 제목\n내용을 입력하세요.\n",
      bold: "**강조할 내용**",
      link: "[[연결할 문서명|보여줄 글자]]",
      list: "\n- 항목 1\n- 항목 2\n",
      footnote: "((여기에 주석 설명을 적으세요))",
      image: '\n{{image:./assets/example.jpg|이미지 설명}}\n',
    };

    const insertText = templates[type] || "";
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    textarea.value = `${currentValue.slice(0, start)}${insertText}${currentValue.slice(end)}`;
    textarea.focus();
    const cursor = start + insertText.length;
    textarea.setSelectionRange(cursor, cursor);
  }

  function applyTheme(themeId) {
    const theme = THEMES.find((item) => item.id === themeId) || THEMES[0];
    const root = document.documentElement;

    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-soft", hexToRgba(theme.accent, 0.12));
    root.style.setProperty("--text", theme.text);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--bg-gradient-start", theme.bgStart);
    root.style.setProperty("--bg-gradient-mid", theme.bgMid);
    root.style.setProperty("--bg-gradient-end", theme.bgEnd);
    root.style.setProperty("--bg-orb-left", theme.orbLeft);
    root.style.setProperty("--bg-orb-right", theme.orbRight);
    root.style.setProperty("--panel", hexToRgba(theme.secondary, 0.62));
    root.style.setProperty("--panel-strong", hexToRgba(theme.secondary, 0.88));
    root.style.setProperty("--line", hexToRgba(theme.accent, 0.16));
    root.style.setProperty("--line-strong", hexToRgba(theme.accent, 0.3));
  }

  function serializePageForSeedData(page) {
    const safePage = {
      id: page.id,
      title: page.title,
      summary: page.summary,
      category: page.category || "문서",
      updatedAt: page.updatedAt,
      content: page.content || "",
    };

    return `{
  id: ${toSingleQuotedJsString(safePage.id)},
  title: ${toSingleQuotedJsString(safePage.title)},
  summary: ${toSingleQuotedJsString(safePage.summary)},
  category: ${toSingleQuotedJsString(safePage.category)},
  updatedAt: ${toSingleQuotedJsString(safePage.updatedAt)},
  content: ${toTemplateLiteralString(safePage.content)}
},`;
  }

  function parseWikiMarkup(content, pages) {
    const lines = content.replace(/\r\n/g, "\n").split("\n");
    const headings = [];
    const footnotes = [];
    let html = "";
    let inList = false;
    let inOrderedList = false;
    let inBlockquote = false;

    const closeAll = () => {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (inBlockquote) {
        html += "</blockquote>";
        inBlockquote = false;
      }
    };

    lines.forEach((rawLine) => {
      const line = rawLine.trimEnd();
      const trimmed = line.trim();

      if (!trimmed) {
        closeAll();
        return;
      }

      if (trimmed === "---") {
        closeAll();
        html += "<hr />";
        return;
      }

      const headingMatch = trimmed.match(/^(##|###)\s+(.+)$/);
      if (headingMatch) {
        closeAll();
        const level = headingMatch[1] === "##" ? 2 : 3;
        const text = headingMatch[2].trim();
        const id = slugify(text);
        headings.push({ level, text, id });
        html += `<h${level} id="${id}">${renderInline(text, pages, footnotes)}</h${level}>`;
        return;
      }

      const unorderedMatch = trimmed.match(/^- (.+)$/);
      if (unorderedMatch) {
        if (inOrderedList) {
          html += "</ol>";
          inOrderedList = false;
        }
        if (!inList) {
          html += "<ul>";
          inList = true;
        }
        html += `<li>${renderInline(unorderedMatch[1], pages, footnotes)}</li>`;
        return;
      }

      const orderedMatch = trimmed.match(/^\d+\. (.+)$/);
      if (orderedMatch) {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
        if (!inOrderedList) {
          html += "<ol>";
          inOrderedList = true;
        }
        html += `<li>${renderInline(orderedMatch[1], pages, footnotes)}</li>`;
        return;
      }

      const quoteMatch = trimmed.match(/^>\s?(.+)$/);
      if (quoteMatch) {
        if (!inBlockquote) {
          closeAll();
          html += "<blockquote>";
          inBlockquote = true;
        }
        html += `<p>${renderInline(quoteMatch[1], pages, footnotes)}</p>`;
        return;
      }

      const imageMatch = trimmed.match(/^\{\{image:(.+?)\|(.+?)\}\}$/);
      if (imageMatch) {
        closeAll();
        const src = escapeAttribute(imageMatch[1].trim());
        const alt = escapeAttribute(imageMatch[2].trim());
        html += `<figure><img src="${src}" alt="${alt}" /><figcaption>${alt}</figcaption></figure>`;
        return;
      }

      closeAll();
      html += `<p>${renderInline(trimmed, pages, footnotes)}</p>`;
    });

    closeAll();

    if (footnotes.length) {
      html += `<section class="footnotes"><h2>주석</h2><ol>${footnotes
        .map(
          (note, index) =>
            `<li id="footnote-${index + 1}">${note} <a href="#footnote-ref-${index + 1}">↩</a></li>`
        )
        .join("")}</ol></section>`;
    }

    return { html, headings };
  }

  function renderInline(text, pages, footnotes) {
    let result = escapeHtml(text);

    result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    result = result.replace(/\(\((.+?)\)\)/g, function (_, noteText) {
      footnotes.push(escapeHtml(noteText));
      const index = footnotes.length;
      return `<sup id="footnote-ref-${index}"><a href="#footnote-${index}">[${index}]</a></sup>`;
    });

    result = result.replace(/\[\[(.+?)(?:\|(.+?))?\]\]/g, function (_, rawTarget, rawLabel) {
      const label = rawLabel || rawTarget;
      const page = findPageByTitleOrId(rawTarget, pages);

      if (!page) {
        return `<a href="#" class="missing-link">${escapeHtml(label)}</a>`;
      }

      return `<a href="#" data-page-id="${escapeAttribute(page.id)}">${escapeHtml(label)}</a>`;
    });

    result = result.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (_, label, url) {
      return `<a href="${escapeAttribute(url)}" target="_blank" rel="noreferrer">${escapeHtml(
        label
      )}</a>`;
    });

    return result;
  }

  function findPageByTitleOrId(target, pages) {
    const normalized = target.trim().toLowerCase();
    return pages.find(
      (page) => page.id.toLowerCase() === normalized || page.title.trim().toLowerCase() === normalized
    );
  }

  function mergePages(seedPages, localPages) {
    const merged = [...seedPages];

    localPages.forEach((localPage) => {
      const index = merged.findIndex((seedPage) => seedPage.id === localPage.id);
      if (index >= 0) {
        merged[index] = localPage;
      } else {
        merged.push(localPage);
      }
    });

    return merged;
  }

  function loadLocalPages() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (error) {
      console.warn("로컬 위키 데이터를 읽지 못했습니다.", error);
      return [];
    }
  }

  function loadThemeId() {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.some((theme) => theme.id === stored) ? stored : THEMES[0].id;
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    let copied = false;

    try {
      copied = document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }

    return copied;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function formatDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function slugify(text) {
    return String(text)
      .trim()
      .toLowerCase()
      .replace(/[^\w가-힣\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  function hexToRgba(hex, alpha) {
    const normalized = hex.replace("#", "");
    const safe = normalized.length === 3
      ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
      : normalized;
    const bigint = Number.parseInt(safe, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function toSingleQuotedJsString(value) {
    return `'${String(value)
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\r/g, "\\r")
      .replace(/\n/g, "\\n")}'`;
  }

  function toTemplateLiteralString(value) {
    return `\`${String(value)
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${")}\``;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "");
  }
})();
