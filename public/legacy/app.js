(function () {
  const THEME_STORAGE_KEY = "kmu-vcd-wiki-theme";
  // 정식 출시 시 이 키와 intro modal 관련 로직을 함께 제거하면 됩니다.
  const INTRO_MODAL_STORAGE_KEY = "kmu-vcd-wiki-intro-seen";
  const GUIDELINE_MODAL_STORAGE_KEY = "kmu-vcd-wiki-guideline-seen";
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
    isPageBrowserOpen: false,
    isThemeModalOpen: false,
    isIntroModalOpen: false,
    isGuidelineModalOpen: false,
    pendingEditAction: null,
    expandedGuidelineCards: {
      fact: false,
      info: false,
      privacy: false,
    },
    trackedGuidelineCards: {
      fact: false,
      info: false,
      privacy: false,
    },
    pageFilter: "전체",
    viewer: {
      isLoggedIn: false,
      canEdit: false,
      isAdmin: false,
      email: null,
    },
    revisions: [],
    selectedRevisionId: null,
    isRevisionsModalOpen: false,
    isAllRecentChangesModalOpen: false,
    allRecentChangesPage: 1,
  };

  const elements = {
    pageList: document.getElementById("page-list"),
    pageCountBadge: document.getElementById("page-count-badge"),
    recentChanges: document.getElementById("recent-changes"),
    allRecentChangesButton: document.getElementById("all-recent-changes-button"),
    allRecentChangesModal: document.getElementById("all-recent-changes-modal"),
    allRecentChangesBackdrop: document.getElementById("all-recent-changes-backdrop"),
    closeAllRecentChangesButton: document.getElementById("close-all-recent-changes-button"),
    allRecentChangesList: document.getElementById("all-recent-changes-list"),
    allRecentChangesPagination: document.getElementById("all-recent-changes-pagination"),
    articleView: document.getElementById("article-view"),
    editorPanel: document.getElementById("editor-panel"),
    editorTitle: document.getElementById("editor-title"),
    editorSummary: document.getElementById("editor-summary"),
    editorCategory: document.getElementById("editor-category"),
    editorTextarea: document.getElementById("editor-textarea"),
    searchInput: document.getElementById("search-input"),
    searchSuggestions: document.getElementById("search-suggestions"),
    tocList: document.getElementById("toc-list"),
    heroPageName: document.getElementById("hero-page-name"),
    heroUpdatedAt: document.getElementById("hero-updated-at"),
    heroTitle: document.getElementById("hero-title"),
    heroDescription: document.getElementById("hero-description"),
    articlePath: document.getElementById("article-path"),
    revisionsButton: document.getElementById("revisions-button"),
    lockButton: document.getElementById("lock-button"),
    viewModeButton: document.getElementById("view-mode-button"),
    editModeButton: document.getElementById("edit-mode-button"),
    previewModeButton: document.getElementById("preview-mode-button"),
    browsePagesButton: document.getElementById("browse-pages-button"),
    themeModalButton: document.getElementById("theme-modal-button"),
    closePageBrowserButton: document.getElementById("close-page-browser-button"),
    pageBrowserModal: document.getElementById("page-browser-modal"),
    pageBrowserBackdrop: document.getElementById("page-browser-backdrop"),
    revisionsModal: document.getElementById("revisions-modal"),
    revisionsBackdrop: document.getElementById("revisions-backdrop"),
    closeRevisionsModalButton: document.getElementById("close-revisions-modal-button"),
    revisionsList: document.getElementById("revisions-list"),
    revisionPreview: document.getElementById("revision-preview"),
    revisionsCopy: document.getElementById("revisions-copy"),
    introModal: document.getElementById("intro-modal"),
    introBackdrop: document.getElementById("intro-backdrop"),
    closeIntroModalButton: document.getElementById("close-intro-modal-button"),
    guidelineModal: document.getElementById("guideline-modal"),
    guidelineBackdrop: document.getElementById("guideline-backdrop"),
    closeGuidelineModalButton: document.getElementById("close-guideline-modal-button"),
    guidelineContinueButton: document.getElementById("guideline-continue-button"),
    guidelineFullRulesButton: document.getElementById("guideline-full-rules-button"),
    guidelineCardButtons: {
      fact: document.getElementById("guideline-card-fact-button"),
      info: document.getElementById("guideline-card-info-button"),
      privacy: document.getElementById("guideline-card-privacy-button"),
    },
    themeModal: document.getElementById("theme-modal"),
    themeBackdrop: document.getElementById("theme-backdrop"),
    closeThemeModalButton: document.getElementById("close-theme-modal-button"),
    pageFilterList: document.getElementById("page-filter-list"),
    pageFilterLabel: document.getElementById("page-filter-label"),
    authButton: document.getElementById("auth-button"),
    createPageButton: document.getElementById("create-page-button"),
    saveButton: document.getElementById("save-button"),
    copyCodeButton: document.getElementById("copy-code-button"),
    cancelButton: document.getElementById("cancel-button"),
    copyFeedback: document.getElementById("copy-feedback"),
    themeSelector: document.getElementById("theme-selector"),
    macroButtons: Array.from(document.querySelectorAll(".macro-button")),
    topbar: document.querySelector(".topbar"),
    topbarLogo: document.getElementById("topbar-logo"),
  };

  const wikiApi = {
    async fetchPages() {
      try {
        const response = await fetch("/api/wiki/pages", {
          credentials: "include",
          cache: "no-store",
        });
        const payload = await response.json();

        if (!response.ok || !Array.isArray(payload.pages)) {
          throw new Error(payload.error || "문서를 불러오지 못했습니다.");
        }

        return payload.pages;
      } catch (error) {
        console.warn("서버 문서를 불러오지 못해 seed 데이터로 표시합니다.", error);
        return deepClone(window.WIKI_SEED_DATA.pages || []);
      }
    },

    async savePage(page) {
      const response = await fetch("/api/wiki/pages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(page),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "문서 저장에 실패했습니다.");
      }

      return payload.page;
    },

    async fetchViewer() {
      try {
        const response = await fetch("/api/wiki/session", {
          credentials: "include",
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "로그인 정보를 불러오지 못했습니다.");
        }

        return payload;
      } catch (error) {
        console.warn("로그인 정보를 불러오지 못했습니다.", error);
        return {
          isLoggedIn: false,
          canEdit: false,
          isAdmin: false,
          email: null,
        };
      }
    },

    async fetchRevisions(pageId) {
      const response = await fetch(`/api/wiki/pages/${encodeURIComponent(pageId)}/revisions`, {
        credentials: "include",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "수정 기록을 불러오지 못했습니다.");
      }

      return payload;
    },

    async updateLock(pageId, locked) {
      const response = await fetch(`/api/wiki/pages/${encodeURIComponent(pageId)}/lock`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ locked }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "문서 잠금 상태를 바꾸지 못했습니다.");
      }

      return payload;
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
    state.isIntroModalOpen = shouldShowIntroModal();

    state.viewer = await wikiApi.fetchViewer();
    updateEditorActionLabels();
    state.pages = await wikiApi.fetchPages();
    state.currentPageId = resolveInitialPageId();
    renderApp();
    // 정적 배포용 URL 동기화입니다. 추후 동적 사이트 전환 시 router push로 교체하면 됩니다.
    syncUrlWithCurrentPage();
  }

  function bindEvents() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) {
        return;
      }

      if (button.dataset.analyticsSkip === "true") {
        return;
      }

      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: "custom_click",
        button_name: button.innerText.trim(),
        page_path: window.location.pathname,
      });
    });

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

    // 정적 배포용 hash 라우팅입니다. 추후 동적 사이트 전환 시 라우터 이벤트로 교체하면 됩니다.
    window.addEventListener("hashchange", () => {
      const pageId = getPageIdFromHash();
      if (!pageId || pageId === state.currentPageId || !hasPage(pageId)) {
        return;
      }

      state.currentPageId = pageId;
      setMode("view");
      renderApp();
      scrollToTop();
    });

    elements.viewModeButton.addEventListener("click", () => setMode("view"));
    elements.editModeButton.addEventListener("click", () => startEditFlow("edit"));
    elements.previewModeButton.addEventListener("click", () => setMode("preview"));
    elements.browsePagesButton.addEventListener("click", openPageBrowser);
    elements.themeModalButton.addEventListener("click", openThemeModal);
    elements.closePageBrowserButton.addEventListener("click", closePageBrowser);
    elements.pageBrowserBackdrop.addEventListener("click", closePageBrowser);
    elements.revisionsButton.addEventListener("click", openRevisionsModal);
    elements.closeRevisionsModalButton.addEventListener("click", closeRevisionsModal);
    elements.revisionsBackdrop.addEventListener("click", closeRevisionsModal);
    elements.allRecentChangesButton.addEventListener("click", openAllRecentChangesModal);
    elements.closeAllRecentChangesButton.addEventListener("click", closeAllRecentChangesModal);
    elements.allRecentChangesBackdrop.addEventListener("click", closeAllRecentChangesModal);
    elements.closeIntroModalButton.addEventListener("click", closeIntroModal);
    elements.introBackdrop.addEventListener("click", closeIntroModal);
    elements.closeGuidelineModalButton.addEventListener("click", closeGuidelineModal);
    elements.guidelineBackdrop.addEventListener("click", closeGuidelineModal);
    elements.guidelineContinueButton.addEventListener("click", continueFromGuidelineModal);
    elements.guidelineFullRulesButton.addEventListener("click", openFullGuidelinesPage);
    elements.closeThemeModalButton.addEventListener("click", closeThemeModal);
    elements.themeBackdrop.addEventListener("click", closeThemeModal);
    elements.authButton.addEventListener("click", handleAuthButtonClick);
    elements.lockButton.addEventListener("click", toggleCurrentPageLock);
    elements.topbarLogo.addEventListener("click", goToHomepage);
    elements.topbarLogo.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        goToHomepage();
      }
    });

    elements.createPageButton.addEventListener("click", () => startEditFlow("create"));

    elements.saveButton.addEventListener("click", async () => {
      const draft = buildPageFromEditor();
      elements.copyFeedback.textContent = "";

      try {
        const savedPage = await wikiApi.savePage(draft);
        state.pages = await wikiApi.fetchPages();
        state.currentPageId = savedPage.id;
        elements.copyFeedback.textContent = "문서가 서버에 저장되었습니다.";
        setMode("view");
        renderApp();
      } catch (error) {
        elements.copyFeedback.textContent = error.message || "문서 저장에 실패했습니다.";
      }
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

    elements.macroButtons.forEach((button) => {
      button.addEventListener("click", () => insertMacro(button.dataset.macro));
    });

    Object.entries(elements.guidelineCardButtons).forEach(([cardKey, button]) => {
      button.addEventListener("click", () => toggleGuidelineCard(cardKey));
    });
  }

  function renderApp() {
    renderPageFilters();
    renderPageList();
    renderRecentChanges();
    renderSearchSuggestions();
    renderGuidelineCards();
    renderCurrentPage();
    syncPageBrowser();
    syncIntroModal();
    syncGuidelineModal();
    syncThemeModal();
    syncModeButtons();
    syncEditorPermissions();
    syncAuthButton();
    syncAllRecentChangesButton();
    syncAllRecentChangesModal();
    syncRevisionsModal();
    syncLockButton();
  }

  function renderPageList() {
    const pages = getFilteredBrowsePages();
    elements.pageCountBadge.textContent = `${pages.length}개`;
    elements.pageList.innerHTML = "";
    elements.pageFilterLabel.textContent =
      state.pageFilter === "전체" ? "모든 타입의 문서를 둘러보는 중" : `${state.pageFilter} 문서만 보는 중`;

    if (!pages.length) {
      elements.pageList.innerHTML = '<div class="empty-state">이 타입에는 아직 문서가 없습니다.</div>';
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
        state.searchTerm = "";
        elements.searchInput.value = "";
        closePageBrowser();
        setMode("view");
        renderApp();
        syncUrlWithCurrentPage();
        scrollToTop();
      });
      elements.pageList.appendChild(button);
    });
  }

  function renderPageFilters() {
    const filters = ["전체", ...new Set(state.pages.map((page) => page.category || "문서"))];
    elements.pageFilterList.innerHTML = "";

    filters.forEach((filter) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `filter-chip${filter === state.pageFilter ? " is-active" : ""}`;
      button.textContent = filter;
      button.addEventListener("click", () => {
        state.pageFilter = filter;
        renderPageFilters();
        renderPageList();
      });
      elements.pageFilterList.appendChild(button);
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
        closeThemeModal();
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
        syncUrlWithCurrentPage();
        scrollToTop();
      });
      elements.searchSuggestions.appendChild(button);
    });

    elements.searchSuggestions.hidden = false;
  }

  function renderRecentChanges() {
    const pages = getSortedRecentPages().slice(0, 5);

    elements.recentChanges.innerHTML = "";

    pages.forEach((page) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-change-button";
      button.innerHTML = `
        <strong>${escapeHtml(page.title)}</strong>
        <span>${escapeHtml(page.updatedAt || "-")} · ${escapeHtml(page.summary || "")}</span>
      `;
      button.addEventListener("click", () => {
        state.currentPageId = page.id;
        setMode("view");
        renderApp();
        syncUrlWithCurrentPage();
        scrollToTop();
      });
      item.appendChild(button);
      elements.recentChanges.appendChild(item);
    });
  }

  function getSortedRecentPages() {
    return [...state.pages].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }

  function syncAllRecentChangesButton() {
    elements.allRecentChangesButton.hidden = !state.viewer.isAdmin;
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

    const displayPage = state.mode === "preview" ? buildPageFromEditor() : page;

    elements.heroPageName.textContent = displayPage.title;
    elements.heroUpdatedAt.textContent = displayPage.updatedAt || "-";
    elements.heroTitle.textContent = displayPage.title;
    elements.heroDescription.textContent =
      displayPage.summary || "문서 설명이 아직 없습니다.";
    elements.articlePath.textContent = `${displayPage.category || "문서"} / ${displayPage.title}`;
    elements.revisionsCopy.textContent = `${page.title} 문서의 수정 버전과 편집 기록을 볼 수 있습니다.`;

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
        <div><span class="meta-row">편집 상태</span><br /><strong>${page.isLocked ? "잠금됨" : "열림"}</strong></div>
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
        syncUrlWithCurrentPage();
        scrollToTop();
      });
    });
  }

  function fillEditor(page) {
    if (!page) {
      return;
    }

    elements.editorTitle.value = page.title || "";
    elements.editorSummary.value = page.summary || "";
    elements.editorCategory.value = page.category || "문서";
    elements.editorTextarea.value = page.content || "";
  }

  function buildPageFromEditor() {
    const existing = getCurrentPage();
    const title = elements.editorTitle.value.trim() || "새 문서";
    const summary = elements.editorSummary.value.trim();
    const category = elements.editorCategory.value.trim() || "문서";
    const isTemporaryPage = existing?.id && /^new-page-\d+$/.test(existing.id);

    return {
      id: existing && existing.id && !isTemporaryPage ? existing.id : slugify(title),
      title,
      summary,
      category,
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

  function getFilteredBrowsePages() {
    if (state.pageFilter === "전체") {
      return state.pages;
    }

    return state.pages.filter((page) => (page.category || "문서") === state.pageFilter);
  }

  function resolveInitialPageId() {
    // 정적 배포용 hash 기반 초기 진입 처리입니다. 추후 동적 사이트 전환 시 path/slug 파싱으로 교체하면 됩니다.
    const hashPageId = getPageIdFromHash();
    if (hashPageId && hasPage(hashPageId)) {
      return hashPageId;
    }

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
      isLocked: false,
      lockedAt: null,
      lockedByAlias: null,
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

  function openPageBrowser() {
    state.isPageBrowserOpen = true;
    state.isRevisionsModalOpen = false;
    state.isThemeModalOpen = false;
    syncPageBrowser();
    syncRevisionsModal();
    syncThemeModal();
  }

  function closePageBrowser() {
    state.isPageBrowserOpen = false;
    syncPageBrowser();
  }

  function syncPageBrowser() {
    elements.pageBrowserModal.hidden = !state.isPageBrowserOpen;
    document.body.style.overflow = shouldLockBodyScroll() ? "hidden" : "";
  }

  function openThemeModal() {
    state.isThemeModalOpen = true;
    state.isPageBrowserOpen = false;
    state.isRevisionsModalOpen = false;
    state.isAllRecentChangesModalOpen = false;
    syncThemeModal();
    syncPageBrowser();
    syncRevisionsModal();
    syncAllRecentChangesModal();
  }

  function closeThemeModal() {
    state.isThemeModalOpen = false;
    syncThemeModal();
  }

  function syncThemeModal() {
    elements.themeModal.hidden = !state.isThemeModalOpen;
    document.body.style.overflow = shouldLockBodyScroll() ? "hidden" : "";
  }

  async function openRevisionsModal() {
    const currentPage = getCurrentPage();
    if (!currentPage) {
      return;
    }

    if (!state.viewer.isLoggedIn) {
      const shouldMove = window.confirm("수정 기록은 로그인 후 확인할 수 있습니다. 로그인 페이지로 이동할까요?");
      if (shouldMove && window.top) {
        window.top.location.href = "/auth";
      }
      return;
    }

    state.isPageBrowserOpen = false;
    state.isThemeModalOpen = false;
    state.isAllRecentChangesModalOpen = false;
    state.isRevisionsModalOpen = true;
    state.revisions = [];
    state.selectedRevisionId = null;
    syncPageBrowser();
    syncThemeModal();
    syncAllRecentChangesModal();
    syncRevisionsModal();

    elements.revisionsList.innerHTML = '<div class="empty-state">수정 기록을 불러오는 중입니다.</div>';
    elements.revisionPreview.innerHTML = '<div class="empty-state">버전 내용을 불러오는 중입니다.</div>';

    try {
      const payload = await wikiApi.fetchRevisions(currentPage.id);
      state.revisions = payload.revisions || [];
      state.selectedRevisionId = state.revisions[0]?.id || null;
      renderRevisions();
    } catch (error) {
      elements.revisionsList.innerHTML = `<div class="empty-state">${escapeHtml(
        error.message || "수정 기록을 불러오지 못했습니다."
      )}</div>`;
      elements.revisionPreview.innerHTML = '<div class="empty-state">버전을 불러오지 못했습니다.</div>';
    }
  }

  function closeRevisionsModal() {
    state.isRevisionsModalOpen = false;
    syncRevisionsModal();
  }

  function syncRevisionsModal() {
    elements.revisionsModal.hidden = !state.isRevisionsModalOpen;
    document.body.style.overflow = shouldLockBodyScroll() ? "hidden" : "";
  }

  function openAllRecentChangesModal() {
    if (!state.viewer.isAdmin) {
      return;
    }

    state.isPageBrowserOpen = false;
    state.isThemeModalOpen = false;
    state.isRevisionsModalOpen = false;
    state.isAllRecentChangesModalOpen = true;
    state.allRecentChangesPage = 1;
    syncPageBrowser();
    syncThemeModal();
    syncRevisionsModal();
    syncAllRecentChangesModal();
    renderAllRecentChanges();
  }

  function closeAllRecentChangesModal() {
    state.isAllRecentChangesModalOpen = false;
    syncAllRecentChangesModal();
  }

  function syncAllRecentChangesModal() {
    elements.allRecentChangesModal.hidden = !state.isAllRecentChangesModalOpen;
    document.body.style.overflow = shouldLockBodyScroll() ? "hidden" : "";
  }

  function renderAllRecentChanges() {
    const pageSize = 12;
    const sortedPages = getSortedRecentPages();
    const totalPages = Math.max(1, Math.ceil(sortedPages.length / pageSize));
    state.allRecentChangesPage = Math.min(Math.max(1, state.allRecentChangesPage), totalPages);

    const startIndex = (state.allRecentChangesPage - 1) * pageSize;
    const pagedItems = sortedPages.slice(startIndex, startIndex + pageSize);

    elements.allRecentChangesList.innerHTML = "";
    elements.allRecentChangesPagination.innerHTML = "";

    if (!pagedItems.length) {
      elements.allRecentChangesList.innerHTML =
        '<div class="empty-state">표시할 최근 수정 문서가 없습니다.</div>';
      return;
    }

    pagedItems.forEach((page) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "recent-archive-item";
      button.innerHTML = `
        <strong>${escapeHtml(page.title)}</strong>
        <small>${escapeHtml(page.category || "문서")} · ${escapeHtml(page.updatedAt || "-")}</small>
        <span>${escapeHtml(page.summary || "요약이 아직 없습니다.")}</span>
      `;
      button.addEventListener("click", () => {
        state.currentPageId = page.id;
        closeAllRecentChangesModal();
        setMode("view");
        renderApp();
        syncUrlWithCurrentPage();
        scrollToTop();
      });
      elements.allRecentChangesList.appendChild(button);
    });

    const prevButton = document.createElement("button");
    prevButton.type = "button";
    prevButton.className = "pagination-button";
    prevButton.textContent = "이전";
    prevButton.disabled = state.allRecentChangesPage === 1;
    prevButton.addEventListener("click", () => {
      state.allRecentChangesPage -= 1;
      renderAllRecentChanges();
    });
    elements.allRecentChangesPagination.appendChild(prevButton);

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `pagination-button${pageNumber === state.allRecentChangesPage ? " is-active" : ""}`;
      button.textContent = String(pageNumber);
      button.addEventListener("click", () => {
        state.allRecentChangesPage = pageNumber;
        renderAllRecentChanges();
      });
      elements.allRecentChangesPagination.appendChild(button);
    }

    const nextButton = document.createElement("button");
    nextButton.type = "button";
    nextButton.className = "pagination-button";
    nextButton.textContent = "다음";
    nextButton.disabled = state.allRecentChangesPage === totalPages;
    nextButton.addEventListener("click", () => {
      state.allRecentChangesPage += 1;
      renderAllRecentChanges();
    });
    elements.allRecentChangesPagination.appendChild(nextButton);
  }

  function closeIntroModal() {
    state.isIntroModalOpen = false;
    sessionStorage.setItem(INTRO_MODAL_STORAGE_KEY, "true");
    syncIntroModal();
  }

  function syncIntroModal() {
    elements.introModal.hidden = !state.isIntroModalOpen;
    document.body.style.overflow = shouldLockBodyScroll() ? "hidden" : "";
  }

  function openGuidelineModal(actionType) {
    state.pendingEditAction = actionType;
    state.isGuidelineModalOpen = true;
    state.isPageBrowserOpen = false;
    state.isThemeModalOpen = false;
    trackAnalyticsEvent("guideline_modal_view", { entry_point: actionType });
    syncGuidelineModal();
    syncPageBrowser();
    syncThemeModal();
  }

  function closeGuidelineModal() {
    state.isGuidelineModalOpen = false;
    state.pendingEditAction = null;
    trackAnalyticsEvent("guideline_modal_close");
    syncGuidelineModal();
  }

  function continueFromGuidelineModal() {
    trackAnalyticsEvent("guideline_modal_continue");
    localStorage.setItem(GUIDELINE_MODAL_STORAGE_KEY, "true");
    state.isGuidelineModalOpen = false;
    const actionType = state.pendingEditAction;
    state.pendingEditAction = null;
    syncGuidelineModal();

    if (actionType === "create") {
      createNewPageAndEnterEdit();
      return;
    }

    fillEditor(getCurrentPage());
    setMode("edit");
  }

  function syncGuidelineModal() {
    elements.guidelineModal.hidden = !state.isGuidelineModalOpen;
    document.body.style.overflow = shouldLockBodyScroll() ? "hidden" : "";
  }

  function shouldShowIntroModal() {
    return sessionStorage.getItem(INTRO_MODAL_STORAGE_KEY) !== "true";
  }

  function shouldLockBodyScroll() {
    return (
      state.isPageBrowserOpen ||
      state.isRevisionsModalOpen ||
      state.isAllRecentChangesModalOpen ||
      state.isThemeModalOpen ||
      state.isIntroModalOpen ||
      state.isGuidelineModalOpen
    );
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToHomepage() {
    const homepage = window.WIKI_SEED_DATA.homepage;
    if (!homepage) {
      return;
    }

    state.currentPageId = homepage;
    state.showSuggestions = false;
    state.searchTerm = "";
    elements.searchInput.value = "";
    elements.searchSuggestions.hidden = true;
    setMode("view");
    renderApp();
    syncUrlWithCurrentPage();
    scrollToTop();
  }

  function getPageIdFromHash() {
    // 정적 배포용 해시 라우팅 유틸입니다. 추후 동적 사이트 전환 시 URL path 기반으로 교체하면 됩니다.
    return decodeURIComponent(window.location.hash.replace(/^#/, "").trim());
  }

  function syncUrlWithCurrentPage() {
    // 정적 배포용 URL 반영입니다. 추후 동적 사이트 전환 시 history/router navigation으로 교체하면 됩니다.
    if (!state.currentPageId) {
      return;
    }

    const nextHash = `#${encodeURIComponent(state.currentPageId)}`;
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, "", nextHash);
    }
  }

  function hasPage(pageId) {
    return state.pages.some((page) => page.id === pageId);
  }

  function startEditFlow(actionType) {
    if (!state.viewer.canEdit) {
      promptLoginForEditing();
      return;
    }

    if (actionType !== "create" && getCurrentPage()?.isLocked && !state.viewer.isAdmin) {
      elements.copyFeedback.textContent = "이 문서는 관리자에 의해 잠겨 있어 현재 수정할 수 없습니다.";
      window.alert("이 문서는 관리자에 의해 잠겨 있어 현재 수정할 수 없습니다.");
      return;
    }

    if (shouldShowGuidelineModal()) {
      openGuidelineModal(actionType);
      return;
    }

    if (actionType === "create") {
      createNewPageAndEnterEdit();
      return;
    }

    fillEditor(getCurrentPage());
    setMode("edit");
  }

  function shouldShowGuidelineModal() {
    return localStorage.getItem(GUIDELINE_MODAL_STORAGE_KEY) !== "true";
  }

  function createNewPageAndEnterEdit() {
    const newPage = createBlankPage();
    state.pages = [newPage, ...state.pages];
    state.currentPageId = newPage.id;
    fillEditor(newPage);
    setMode("edit");
    renderApp();
    syncUrlWithCurrentPage();
  }

  function toggleGuidelineCard(cardKey) {
    const expanded = !state.expandedGuidelineCards[cardKey];
    state.expandedGuidelineCards[cardKey] = expanded;

    if (expanded && !state.trackedGuidelineCards[cardKey]) {
      const eventMap = {
        fact: "guideline_card_fact_expand",
        info: "guideline_card_info_expand",
        privacy: "guideline_card_privacy_expand",
      };
      trackAnalyticsEvent(eventMap[cardKey]);
      state.trackedGuidelineCards[cardKey] = true;
    }

    renderGuidelineCards();
  }

  function renderGuidelineCards() {
    Object.entries(elements.guidelineCardButtons).forEach(([cardKey, button]) => {
      const card = button.closest(".guideline-card");
      const body = card.querySelector(".guideline-card-body");
      const icon = card.querySelector(".guideline-card-icon");
      const expanded = state.expandedGuidelineCards[cardKey];

      button.setAttribute("aria-expanded", String(expanded));
      card.classList.toggle("is-expanded", expanded);
      body.hidden = !expanded;
      icon.textContent = expanded ? "-" : "+";
    });
  }

  function openFullGuidelinesPage() {
    trackAnalyticsEvent("guideline_full_rules_click");
    state.currentPageId = "community-guidelines";
    state.isGuidelineModalOpen = false;
    state.pendingEditAction = null;
    setMode("view");
    renderApp();
    syncUrlWithCurrentPage();
    scrollToTop();
  }

  function trackAnalyticsEvent(eventName, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      event_name: eventName,
      page_path: `${window.location.pathname}${window.location.hash}`,
      ...params,
    });
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

  function promptLoginForEditing() {
    if (!state.viewer.isLoggedIn) {
      elements.copyFeedback.textContent = "문서를 작성하려면 먼저 학교 메일로 로그인해 주세요.";
      const shouldMove = window.confirm("문서를 편집하려면 로그인이 필요합니다. 로그인 페이지로 이동할까요?");
      if (shouldMove && window.top) {
        window.top.location.href = "/auth";
      }
      return;
    }

    elements.copyFeedback.textContent = "학교 메일 계정 사용자만 문서를 저장할 수 있습니다.";
    window.alert("학교 메일 계정 사용자만 문서를 저장할 수 있습니다.");
  }

  function updateEditorActionLabels() {
    elements.saveButton.textContent = "문서 저장";
  }

  function syncEditorPermissions() {
    const currentPage = getCurrentPage();
    const canEdit = state.viewer.canEdit;
    const isLocked = Boolean(currentPage?.isLocked);
    const shouldDisableEdit = isLocked;

    elements.saveButton.disabled = !canEdit;
    elements.saveButton.title = canEdit ? "현재 문서를 서버에 저장합니다." : "학교 메일 로그인 후 저장할 수 있습니다.";
    elements.editModeButton.disabled = shouldDisableEdit;
    elements.editModeButton.classList.toggle("is-disabled", shouldDisableEdit);
    elements.editModeButton.title = shouldDisableEdit
      ? "이 문서는 잠겨 있어 현재 편집할 수 없습니다."
      : "현재 문서를 편집합니다.";

    if (!canEdit && state.mode === "edit") {
      elements.copyFeedback.textContent = state.viewer.isLoggedIn
        ? "학교 메일 계정만 문서를 저장할 수 있습니다."
        : "로그인 후 문서를 저장할 수 있습니다.";
    }

    if (shouldDisableEdit && state.mode === "edit") {
      setMode("view");
      elements.copyFeedback.textContent = "이 문서는 현재 잠겨 있어 편집할 수 없습니다.";
    }
  }

  function syncAuthButton() {
    elements.authButton.textContent = state.viewer.isLoggedIn ? "로그아웃" : "로그인";
    elements.authButton.title = state.viewer.isLoggedIn
      ? "현재 계정에서 로그아웃합니다."
      : "학교 메일 계정으로 로그인합니다.";
  }

  function syncLockButton() {
    const currentPage = getCurrentPage();
    const shouldShow = Boolean(currentPage) && state.viewer.isAdmin;

    elements.lockButton.hidden = !shouldShow;

    if (!shouldShow) {
      return;
    }

    elements.lockButton.textContent = currentPage.isLocked ? "잠금 해제" : "문서 잠금";
    elements.lockButton.title = currentPage.isLocked
      ? "이 문서의 잠금을 해제합니다."
      : "이 문서를 잠가 일반 편집을 막습니다.";
  }

  function renderRevisions() {
    elements.revisionsList.innerHTML = "";

    if (!state.revisions.length) {
      elements.revisionsList.innerHTML = '<div class="empty-state">아직 저장된 수정 기록이 없습니다.</div>';
      elements.revisionPreview.innerHTML = '<div class="empty-state">표시할 버전이 없습니다.</div>';
      return;
    }

    state.revisions.forEach((revision) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `revision-item${revision.id === state.selectedRevisionId ? " is-active" : ""}`;
      button.innerHTML = `
        <strong>${escapeHtml(revision.revisionNote || "문서 저장")}</strong>
        <small>${escapeHtml(formatRelativeRevisionMeta(revision))}</small>
      `;
      button.addEventListener("click", () => {
        state.selectedRevisionId = revision.id;
        renderRevisions();
      });
      elements.revisionsList.appendChild(button);
    });

    const selectedRevision =
      state.revisions.find((revision) => revision.id === state.selectedRevisionId) || state.revisions[0];
    const parsed = parseWikiMarkup(selectedRevision.content || "", state.pages);
    elements.revisionPreview.innerHTML = `
      <div class="revision-preview-meta">
        <strong>${escapeHtml(selectedRevision.title || "버전")}</strong>
        <span>${escapeHtml(formatRelativeRevisionMeta(selectedRevision))}</span>
      </div>
      <div class="meta-box revision-meta-box">
        <div><span class="meta-row">요약</span><br /><strong>${escapeHtml(selectedRevision.summary || "-")}</strong></div>
        <div><span class="meta-row">분류</span><br /><strong>${escapeHtml(selectedRevision.category || "문서")}</strong></div>
      </div>
      ${parsed.html}
    `;
  }

  async function toggleCurrentPageLock() {
    const currentPage = getCurrentPage();
    if (!currentPage || !state.viewer.isAdmin) {
      return;
    }

    try {
      const payload = await wikiApi.updateLock(currentPage.id, !currentPage.isLocked);
      state.pages = state.pages.map((page) =>
        page.id === currentPage.id
          ? {
              ...page,
              isLocked: payload.isLocked,
              lockedAt: payload.lockedAt,
              lockedByAlias: payload.lockedBy ? formatAlias(payload.lockedBy) : null,
            }
          : page
      );
      renderApp();
      elements.copyFeedback.textContent = payload.isLocked
        ? "문서가 잠겨 일반 사용자는 편집할 수 없게 되었습니다."
        : "문서 잠금이 해제되었습니다.";
    } catch (error) {
      elements.copyFeedback.textContent = error.message || "문서 잠금 상태를 바꾸지 못했습니다.";
    }
  }

  function handleAuthButtonClick() {
    if (state.viewer.isLoggedIn) {
      if (window.top) {
        window.top.location.href = "/auth/logout";
      }
      return;
    }

    if (window.top) {
      window.top.location.href = "/auth";
    }
  }

  function formatRelativeRevisionMeta(revision) {
    const parts = [formatRevisionDate(revision.createdAt), revision.editorAlias || "익명 고래"];

    if (state.viewer.isAdmin && revision.editorEmail) {
      parts.push(revision.editorEmail);
    }

    return parts.join(" · ");
  }

  function formatRevisionDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  }

  function formatAlias(id) {
    const colors = ["파란", "붉은", "초록", "노란", "보라", "은빛", "분홍", "주황", "하얀", "검은", "민트", "청록"];
    const animals = ["고래", "여우", "수달", "참새", "고양이", "토끼", "사슴", "다람쥐", "독수리", "두루미", "펭귄", "바다표범"];
    let hash = 0;

    String(id || "").split("").forEach((char) => {
      hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    });

    return `${colors[hash % colors.length]} ${animals[Math.floor(hash / colors.length) % animals.length]}`;
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
