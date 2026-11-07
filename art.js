(() => {
  const root = document.querySelector("#artView");
  if (!root || !Array.isArray(window.ACNH_ART_DATA)) return;

  const STORAGE_KEY = "acnh-art-collected-v2";
  const AUTH_KEY = "acnh-login-id-v1";
  const SYNC_CONFIG = window.ACNH_SYNC_CONFIG || {};
  const state = {
    filter: "all",
    query: "",
    detailKey: "",
    returnKey: "",
    returnScrollY: 0,
    loginId: "",
    collected: new Set(),
  };
  let zoomScale = 1;
  let syncQueue = Promise.resolve();

  const els = {
    listView: root.querySelector("#artListView"),
    grid: root.querySelector("#artGrid"),
    detailView: root.querySelector("#artDetailView"),
    count: root.querySelector("#artCount"),
    filters: root.querySelectorAll("[data-art-filter]"),
    searchInput: root.querySelector("#artSearchInput"),
    imageModal: document.querySelector("#artImageModal"),
    modalImage: document.querySelector("#artModalImage"),
    modalClose: document.querySelector("#artImageModalClose"),
    zoomControls: document.querySelectorAll("[data-art-zoom]"),
  };

  function getLoginId() {
    try {
      const value = JSON.parse(localStorage.getItem(AUTH_KEY) || "\"\"");
      return value === "0726" || value === "250726" ? value : "";
    } catch (error) {
      return "";
    }
  }

  function getConfig() {
    return {
      projectUrl: String(SYNC_CONFIG.projectUrl || "").replace(/\/+$/, ""),
      anonKey: String(SYNC_CONFIG.anonKey || ""),
      table: String(SYNC_CONFIG.table || "acnh_shared_state"),
      rowId: String(SYNC_CONFIG.rowId || "main"),
    };
  }

  function getHeaders(extra) {
    const config = getConfig();
    return Object.assign({
      apikey: config.anonKey,
      Authorization: "Bearer " + config.anonKey,
      "Content-Type": "application/json",
    }, extra || {});
  }

  function hasSyncConfig() {
    const config = getConfig();
    return Boolean(config.projectUrl && config.anonKey && config.table && config.rowId);
  }

  function getTableUrl() {
    const config = getConfig();
    return config.projectUrl + "/rest/v1/" + encodeURIComponent(config.table);
  }

  function getLocalKey() {
    return STORAGE_KEY + "-" + (state.loginId || "guest");
  }

  function readLocalCollected() {
    try {
      const parsed = JSON.parse(localStorage.getItem(getLocalKey()) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      return new Set();
    }
  }

  function saveLocalCollected() {
    localStorage.setItem(getLocalKey(), JSON.stringify([...state.collected]));
  }

  async function fetchSharedData() {
    if (!hasSyncConfig()) return null;
    const config = getConfig();
    const url = getTableUrl() + "?id=eq." + encodeURIComponent(config.rowId) + "&select=data";
    const response = await fetch(url, { cache: "no-store", headers: getHeaders() });
    if (!response.ok) throw new Error("미술품 수집 데이터 조회 실패: " + response.status);
    const rows = await response.json();
    return rows && rows[0] && rows[0].data ? rows[0].data : {};
  }

  async function loadForLogin() {
    state.loginId = getLoginId();
    state.collected = state.loginId ? readLocalCollected() : new Set();
    renderList();
    if (!state.loginId) return;

    try {
      const data = await fetchSharedData();
      const remoteList = data && data.artCollectedByUser && data.artCollectedByUser[state.loginId];
      if (Array.isArray(remoteList)) {
        state.collected = new Set(remoteList);
        saveLocalCollected();
        renderList();
      }
    } catch (error) {
      console.warn("Art collection sync load failed:", error);
    }
  }

  function queueRemoteSave() {
    if (!state.loginId || !hasSyncConfig()) return;
    syncQueue = syncQueue.catch(() => undefined).then(async () => {
      const current = await fetchSharedData() || {};
      const users = current.artCollectedByUser && typeof current.artCollectedByUser === "object"
        ? current.artCollectedByUser
        : {};
      users[state.loginId] = [...state.collected];
      const config = getConfig();
      const response = await fetch(getTableUrl(), {
        method: "POST",
        headers: getHeaders({ Prefer: "resolution=merge-duplicates" }),
        body: JSON.stringify({
          id: config.rowId,
          data: Object.assign({}, current, { artCollectedByUser: users }),
          updated_at: new Date().toISOString(),
        }),
      });
      if (!response.ok) throw new Error("미술품 수집 데이터 저장 실패: " + response.status);
    }).catch((error) => console.warn("Art collection sync save failed:", error));
  }

  function getArt(key) {
    return window.ACNH_ART_DATA.find((item) => item.key === key);
  }

  function getVisibleArt() {
    const query = state.query.trim().toLocaleLowerCase();
    return window.ACNH_ART_DATA.filter((item) => {
      const matchesQuery = !query || [item.name, item.englishName].some((value) => String(value || "").toLocaleLowerCase().includes(query));
      if (!matchesQuery) return false;
      if (state.filter === "collected") return state.collected.has(item.key);
      if (state.filter === "missing") return !state.collected.has(item.key);
      return true;
    });
  }

  function createImage(src, alt) {
    const image = document.createElement("img");
    image.src = src;
    image.alt = alt;
    image.loading = "lazy";
    image.addEventListener("error", () => { image.hidden = true; });
    return image;
  }

  function renderCount() {
    els.count.textContent = state.collected.size + "/" + window.ACNH_ART_DATA.length;
  }

  function createCollectButton(item) {
    const collected = state.collected.has(item.key);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "art-collect-button";
    button.dataset.artAction = "collect";
    button.dataset.artKey = item.key;
    button.setAttribute("aria-pressed", collected ? "true" : "false");
    button.disabled = !state.loginId;
    button.title = state.loginId ? "" : "로그인 후 수집 여부를 저장할 수 있습니다.";
    button.textContent = collected ? "수집\n완료" : (state.loginId ? "수집\n체크" : "로그인 필요");
    return button;
  }

  function renderList() {
    state.detailKey = "";
    els.detailView.hidden = true;
    els.listView.hidden = false;
    els.grid.replaceChildren();

    const visible = getVisibleArt();
    if (!visible.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = state.filter === "collected"
        ? "수집완료한 미술품이 없습니다."
        : "모든 미술품을 수집했습니다.";
      els.grid.append(empty);
      renderCount();
      return;
    }

    visible.forEach((item) => {
      const collected = state.collected.has(item.key);
      const card = document.createElement("article");
      card.className = "art-card" + (collected ? " is-collected" : "");
      card.dataset.artKey = item.key;

      const imageWrap = document.createElement("div");
      imageWrap.className = "art-card-image-wrap";
      imageWrap.append(createImage(item.image, item.name + " 미술품 이미지"));

      const body = document.createElement("div");
      body.className = "art-card-body";
      const name = document.createElement("h3");
      name.className = "art-card-name";
      name.textContent = item.name;
      const meta = document.createElement("div");
      meta.className = "art-card-meta";
      meta.textContent = item.type + " · " + Number(item.sellPrice).toLocaleString("ko-KR") + "벨";

      const actions = document.createElement("div");
      actions.className = "art-card-actions";
      const detailButton = document.createElement("button");
      detailButton.type = "button";
      detailButton.className = "art-detail-button";
      detailButton.dataset.artAction = "detail";
      detailButton.dataset.artKey = item.key;
      detailButton.textContent = "상세";
      actions.append(detailButton, createCollectButton(item));
      body.append(name, meta, actions);
      card.append(imageWrap, body);
      els.grid.append(card);
    });
    renderCount();
  }

  function renderDetail(key) {
    const item = getArt(key);
    if (!item) { renderList(); return; }

    state.detailKey = key;
    els.listView.hidden = true;
    els.detailView.hidden = false;
    els.detailView.replaceChildren();

    const header = document.createElement("div");
    header.className = "art-detail-header";
    const title = document.createElement("h2");
    title.textContent = item.name;
    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "art-back-button";
    backButton.dataset.artAction = "back";
    backButton.textContent = "목록으로";
    header.append(title, backButton);

    const actions = document.createElement("div");
    actions.className = "art-card-actions";
    actions.append(createCollectButton(item));

    const variants = document.createElement("div");
    variants.className = "art-variants";

    const real = document.createElement("article");
    real.className = "art-variant";
    const realTitle = document.createElement("h3");
    realTitle.textContent = "진품";
    const realImage = createImage(item.image, item.name + " 진품");
    realImage.addEventListener("click", () => openImageModal(item.image, item.name + " 진품"));
    real.append(realTitle, realImage);

    const fake = document.createElement("article");
    fake.className = "art-variant";
    const fakeTitle = document.createElement("h3");
    fakeTitle.textContent = "가품";
    if (item.fakeImage) {
      const fakeImage = createImage(item.fakeImage, item.name + " 가품");
      fakeImage.addEventListener("click", () => openImageModal(item.fakeImage, item.name + " 가품"));
      fake.append(fakeTitle, fakeImage);
    } else {
      fake.append(fakeTitle);
    }
    variants.append(real, fake);

    const copy = document.createElement("p");
    copy.className = "art-detail-copy";
    copy.textContent = item.type + " · 판매가 " + Number(item.sellPrice).toLocaleString("ko-KR") + "벨";
    const guide = document.createElement("p");
    guide.className = "art-detail-copy art-forgery-guide";
    guide.textContent = item.fakeDescription;

    els.detailView.append(header, actions, variants, copy, guide);
  }

  function openImageModal(src, alt) {
    if (!els.imageModal || !els.modalImage) return;
    zoomScale = 1;
    els.modalImage.src = src;
    els.modalImage.alt = alt;
    els.modalImage.style.transform = "scale(1)";
    els.imageModal.hidden = false;
  }

  function closeImageModal() {
    if (!els.imageModal || !els.modalImage) return;
    els.imageModal.hidden = true;
    els.modalImage.removeAttribute("src");
  }

  function updateZoom() {
    if (els.modalImage) els.modalImage.style.transform = "scale(" + zoomScale + ")";
  }

  function restoreListPosition() {
    requestAnimationFrame(() => {
      const card = els.grid.querySelector("[data-art-key=\"" + CSS.escape(state.returnKey) + "\"]");
      if (card) card.scrollIntoView({ block: "center", behavior: "auto" });
      else window.scrollTo({ top: state.returnScrollY, behavior: "auto" });
    });
  }

  function toggleCollected(key) {
    if (!state.loginId) return;
    if (state.collected.has(key)) state.collected.delete(key);
    else state.collected.add(key);
    saveLocalCollected();
    queueRemoteSave();
    if (state.detailKey) renderDetail(state.detailKey);
    else renderList();
  }

  els.searchInput?.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderList();
  });

  els.filters.forEach((button) => button.addEventListener("click", () => {
    state.filter = button.dataset.artFilter;
    els.filters.forEach((item) => item.classList.toggle("is-active", item === button));
    renderList();
  }));

  els.zoomControls.forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.artZoom === "in") zoomScale = Math.min(3, zoomScale + 0.25);
    if (button.dataset.artZoom === "out") zoomScale = Math.max(1, zoomScale - 0.25);
    if (button.dataset.artZoom === "reset") zoomScale = 1;
    updateZoom();
  }));
  els.modalClose?.addEventListener("click", closeImageModal);
  els.imageModal?.addEventListener("click", (event) => {
    if (event.target === els.imageModal) closeImageModal();
  });
  els.modalImage?.addEventListener("click", () => {
    zoomScale = zoomScale >= 3 ? 1 : Math.min(3, zoomScale + 0.5);
    updateZoom();
  });

  root.addEventListener("click", (event) => {
    const action = event.target.closest("[data-art-action]");
    if (!action) return;
    const key = action.dataset.artKey;
    if (action.dataset.artAction === "collect") { toggleCollected(key); return; }
    if (action.dataset.artAction === "detail") {
      state.returnKey = key;
      state.returnScrollY = window.scrollY;
      renderDetail(key);
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    if (action.dataset.artAction === "back") {
      renderList();
      restoreListPosition();
    }
  });

  window.addEventListener("acnh-login-changed", loadForLogin);
  loadForLogin();
})();
