// Disclosures tab (TA_0014, TA_0021, TA_0032, TA_0052) and the in-app document
// viewer. Classic script, attaches window.productDisclosures. Requires
// productShared, chipsModule, searchFieldModule, stateViewModule, bottomSheetModule,
// buttonModule, toastModule, motion and i18n.
//
// A PDF opens inside the app (a bottom sheet with the document and a download
// button). Any other format (docx, xls, xlsx, zip, html) cannot be shown
// in the app, so the row is a link that opens it in the browser (NYK_003
// proposal), marked with the link icon.

window.productDisclosures = (function () {
  const t = window.i18n.t;
  const shared = window.productShared;
  const el = shared.el;
  const MIN_QUERY = 2;

  // Mock page of a PDF: heading and text lines in place of the real file.
  function renderDocumentPage(doc) {
    const page = el("div", "product-doc-page");
    page.append(el("p", "product-doc-page-title", doc.title), el("p", "product-doc-page-meta", `${doc.ticker} · ${shared.formatDate(doc.date)}`));
    for (let i = 0; i < 3; i++) page.appendChild(el("p", "product-doc-page-text", t("disclosures.sample_text")));
    return page;
  }

  function openDocument(doc) {
    const content = el("div");
    content.append(
      renderDocumentPage(doc),
      window.buttonModule.renderButton({
        label: t("disclosures.download"),
        variant: "outline",
        onClick: () => window.toastModule.showToast({ message: t("disclosures.download_started"), icon: "check" }),
      }),
    );
    window.bottomSheetModule.showBottomSheet({ title: doc.title, content });
  }

  function renderRow(doc) {
    const isPdf = doc.format === "pdf";
    const row = el(isPdf ? "button" : "a", "product-doc-row");
    if (isPdf) {
      row.type = "button";
      row.addEventListener("click", () => openDocument(doc));
    } else {
      row.href = "https://bet.hu";
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    }
    const text = el("span", "product-doc-text");
    text.append(el("span", "product-doc-title", doc.title), el("span", "product-doc-meta", `${doc.category} · ${shared.formatDate(doc.date)}`));
    const format = el("span", "product-doc-format", doc.format.toUpperCase());
    if (!isPdf) format.appendChild(window.iconModule.renderIcon("link"));
    row.append(text, format);
    const item = el("li");
    item.appendChild(row);
    return item;
  }

  function renderList(docs, onReset) {
    if (!docs.length) {
      return window.stateViewModule.renderStateView({
        title: t("disclosures.empty_title"),
        message: t("disclosures.empty_message"),
        actionLabel: t("market.reset"),
        onAction: onReset,
      });
    }
    const list = el("ul", "product-doc-list");
    docs.forEach((doc) => list.appendChild(renderRow(doc)));
    window.motion.stagger(list);
    return list;
  }

  function buildPanel(ticker, restart) {
    const all = window.storage.getProductDisclosures(ticker);
    const categories = Array.from(new Set(all.map((doc) => doc.category)));
    const state = { query: "", active: [] };
    const results = el("div");

    function filtered() {
      const query = state.query.toLowerCase();
      return all.filter((doc) => {
        const inCategory = !state.active.length || state.active.indexOf(doc.category) !== -1;
        return inCategory && (!query || doc.title.toLowerCase().indexOf(query) !== -1);
      });
    }

    function paint() {
      results.replaceChildren(renderList(filtered(), restart));
    }

    const fragment = document.createDocumentFragment();
    fragment.append(
      window.searchFieldModule.renderSearchField({
        id: "disclosure-search",
        label: t("disclosures.search_label"),
        placeholder: t("disclosures.search_placeholder"),
        minChars: MIN_QUERY,
        onSearch: (query) => {
          state.query = query;
          paint();
        },
      }),
      window.chipsModule.renderChips({
        items: categories.map((id) => ({ id, label: id })),
        variant: "bubble",
        multi: true,
        activeIds: [],
        ariaLabel: t("disclosures.categories"),
        onChange: (ids) => {
          state.active = ids;
          paint();
        },
      }),
      results,
    );
    paint();
    return fragment;
  }

  // Wrapper so the empty state's reset button can rebuild the filters too.
  function disclosuresPanel(ticker) {
    const wrapper = el("div", "product-doc-panel");
    const restart = () => wrapper.replaceChildren(buildPanel(ticker, restart));
    restart();
    return wrapper;
  }

  return { disclosuresPanel, openDocument };
})();
