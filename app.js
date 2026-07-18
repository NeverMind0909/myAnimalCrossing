const BASE_DATA_API_URL = "https://raw.githubusercontent.com/alexislours/ACNHAPI/master/villagers.json";
const NOOKIPEDIA_API_URL = "https://nookipedia.com/w/api.php";
const OWNED_KEY = "acnh-owned-villagers-by-island-v1";
const LEGACY_OWNED_KEY = "acnh-owned-villagers-v2";
const AUTH_KEY = "acnh-login-id-v1";
const DATA_CACHE_KEY = "acnh-villagers-api-cache-v5";
const DATA_CACHE_TIME_KEY = "acnh-villagers-api-cache-time-v5";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const ACCOUNT_ISLANDS = {
  "0726": "kongboki",
  "250726": "kongsolki",
};
const ALLOWED_LOGIN_IDS = Object.keys(ACCOUNT_ISLANDS);
const ISLAND_LABELS = {
  kongboki: "콩보키섬 주민",
  kongsolki: "콩솔키섬 주민",
};

const EXTRA_VILLAGER_TITLES = [
  "Ace",
  "Azalea",
  "Cephalobot",
  "Chabwick",
  "Faith",
  "Frett",
  "Ione",
  "Marlo",
  "Petri",
  "Quinn",
  "Rio",
  "Roswell",
  "Sasha",
  "Shino",
  "Tiansheng",
  "Zoe",
  "Rilla",
  "Marty",
  "Étoile",
  "Chai",
  "Chelsea",
  "Toby",
];

const personalityKo = {
  Cranky: "무뚝뚝",
  Jock: "운동광",
  Lazy: "먹보",
  Normal: "친절함",
  Peppy: "아이돌",
  Sisterly: "단순활발",
  Uchi: "단순활발",
  "Big sister": "단순활발",
  Smug: "느끼함",
  Snooty: "성숙함",
};

const genderKo = {
  Male: "남성",
  Female: "여성",
};

const fallbackVillagers = [
  {
    id: "fallback-raymond",
    name: "잭슨",
    englishName: "Raymond",
    image: "https://raw.githubusercontent.com/alexislours/ACNHAPI/master/images/villagers/cat23.png",
    gender: "남성",
    personality: "느끼함",
    catchphrase: "크르릉",
    birthday: "10월 1일",
  },
  {
    id: "fallback-marshal",
    name: "쭈니",
    englishName: "Marshal",
    image: "https://raw.githubusercontent.com/alexislours/ACNHAPI/master/images/villagers/squ17.png",
    gender: "남성",
    personality: "느끼함",
    catchphrase: "어차피",
    birthday: "9월 29일",
  },
  {
    id: "fallback-sasha",
    name: "미첼",
    englishName: "Sasha",
    image: "https://nookipedia.com/wiki/Special:Redirect/file/Sasha%20amiibo.png",
    gender: "남성",
    personality: "먹보",
    catchphrase: "동글",
    birthday: "5월 19일",
  },
];

const state = {
  villagers: [],
  dataSource: "API 준비 중",
  ownedByIsland: {
    kongboki: new Set(),
    kongsolki: new Set(),
  },
  query: "",
  currentView: "search",
  currentIsland: "kongboki",
  loginId: "",
  menuOpen: false,
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  ownedCount: document.querySelector("#ownedCount"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  ownedVillagers: document.querySelector("#ownedVillagers"),
  ownedTitle: document.querySelector("#owned-title"),
  template: document.querySelector("#villagerCardTemplate"),
  searchView: document.querySelector("#searchView"),
  ownedView: document.querySelector("#ownedView"),
  sidebar: document.querySelector("#sidebar"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  menuOpenButton: document.querySelector("#menuOpenButton"),
  menuCloseButton: document.querySelector("#menuCloseButton"),
  loginButton: document.querySelector("#loginButton"),
  loginModal: document.querySelector("#loginModal"),
  loginForm: document.querySelector("#loginForm"),
  loginInput: document.querySelector("#loginInput"),
  loginError: document.querySelector("#loginError"),
  loginCancelButton: document.querySelector("#loginCancelButton"),
  sidebarLinks: document.querySelectorAll(".sidebar-link"),
};

const fallbackImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
      <rect width="120" height="120" rx="12" fill="#edf7f0"/>
      <circle cx="60" cy="46" r="24" fill="#8fc7a3"/>
      <rect x="32" y="72" width="56" height="20" rx="10" fill="#2f7d57"/>
    </svg>
  `);

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getLocalizedName(nameObject) {
  return nameObject?.["name-KRko"] || nameObject?.["name-USen"] || "이름 없음";
}

function toKoreanBirthday(rawBirthday) {
  if (!rawBirthday) return "알 수 없음";
  const parts = String(rawBirthday).split("/");
  if (parts.length !== 2) return rawBirthday;

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  return day && month ? `${month}월 ${day}일` : rawBirthday;
}

function normalizeBaseVillager(raw) {
  if (raw.name && raw.englishName && raw.image) return raw;

  const fileName = raw["file-name"] || raw.id;
  return {
    id: String(fileName || raw.id),
    name: getLocalizedName(raw.name),
    englishName: raw.name?.["name-USen"] || "",
    image: fileName
      ? `https://raw.githubusercontent.com/alexislours/ACNHAPI/master/images/villagers/${fileName}.png`
      : raw.image_uri || raw.icon_uri || "",
    gender: genderKo[raw.gender] || raw.gender || "알 수 없음",
    personality: personalityKo[raw.personality] || raw.personality || "알 수 없음",
    catchphrase:
      raw["catch-translations"]?.["catch-KRko"] || raw["catch-phrase"] || "알 수 없음",
    birthday: toKoreanBirthday(raw.birthday) || raw["birthday-string"] || "알 수 없음",
  };
}

function normalizeBaseVillagers(apiData) {
  const values = Array.isArray(apiData) ? apiData : Object.values(apiData);
  return values
    .map(normalizeBaseVillager)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function getWikiField(content, fieldName) {
  const pattern = new RegExp(`^\\|\\s*${fieldName}\\s*=\\s*(.+?)\\s*$`, "im");
  return content.match(pattern)?.[1]?.trim() || "";
}

function toWikiImageUrl(fileName) {
  return `https://nookipedia.com/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;
}

function toKoreanBirthdayFromWiki(monthName, dayValue) {
  const months = {
    January: 1,
    February: 2,
    March: 3,
    April: 4,
    May: 5,
    June: 6,
    July: 7,
    August: 8,
    September: 9,
    October: 10,
    November: 11,
    December: 12,
  };
  const month = months[monthName];
  const day = Number(dayValue);
  return month && day ? `${month}월 ${day}일` : "알 수 없음";
}

function normalizeNookipediaVillager(title, content) {
  const englishName = getWikiField(content, "name") || title;
  const imageFile = getWikiField(content, "image");
  return {
    id: `nookipedia-${englishName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: getWikiField(content, "ko-name") || englishName,
    englishName,
    image: imageFile ? toWikiImageUrl(imageFile) : "",
    gender: genderKo[getWikiField(content, "gender")] || getWikiField(content, "gender") || "알 수 없음",
    personality:
      personalityKo[getWikiField(content, "personality")] ||
      getWikiField(content, "personality") ||
      "알 수 없음",
    catchphrase: getWikiField(content, "ko-phrase") || getWikiField(content, "phrase") || "알 수 없음",
    birthday: toKoreanBirthdayFromWiki(
      getWikiField(content, "birthdaymonth"),
      getWikiField(content, "birthday"),
    ),
  };
}

async function fetchNookipediaVillager(title) {
  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: title,
    rvprop: "content",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const response = await fetch(`${NOOKIPEDIA_API_URL}?${params}`);
  if (!response.ok) throw new Error(`Nookipedia API failed: ${response.status}`);

  const data = await response.json();
  const page = data.query?.pages?.[0];
  const content = page?.revisions?.[0]?.content;
  if (!content || page.missing) throw new Error(`Nookipedia page missing: ${title}`);
  return normalizeNookipediaVillager(title, content);
}

async function fetchExtraVillagers() {
  const results = await Promise.allSettled(EXTRA_VILLAGER_TITLES.map(fetchNookipediaVillager));
  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);
}

function mergeVillagers(baseVillagers, extraVillagers) {
  const byEnglishName = new Map();
  [...baseVillagers, ...extraVillagers].forEach((villager) => {
    byEnglishName.set(villager.englishName.toLocaleLowerCase(), villager);
  });
  return [...byEnglishName.values()].sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function normalizeIdList(value) {
  return Array.isArray(value) ? [...new Set(value.map(String))] : [];
}

function areSameIds(left, right) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right);
  return left.every((id) => rightIds.has(id));
}

function loadOwned() {
  const owned = readJson(OWNED_KEY, null);
  const legacyOwned = normalizeIdList(readJson(LEGACY_OWNED_KEY, []));
  let shouldSave = false;

  state.ownedByIsland = {
    kongboki: new Set(),
    kongsolki: new Set(),
  };

  if (owned && typeof owned === "object" && !Array.isArray(owned)) {
    const kongbokiIds = normalizeIdList(owned.kongboki);
    const kongsolkiIds = normalizeIdList(owned.kongsolki);

    state.ownedByIsland.kongboki = new Set(kongbokiIds);
    state.ownedByIsland.kongsolki = new Set(kongsolkiIds);

    if (kongbokiIds.length && areSameIds(kongbokiIds, kongsolkiIds)) {
      state.ownedByIsland.kongsolki = new Set();
      shouldSave = true;
    }

    if (shouldSave) saveOwned();
    return;
  }

  if (Array.isArray(owned)) {
    state.ownedByIsland.kongboki = new Set(normalizeIdList(owned));
    shouldSave = true;
  } else if (legacyOwned.length) {
    state.ownedByIsland.kongboki = new Set(legacyOwned);
    shouldSave = true;
  }

  if (shouldSave) saveOwned();
}

function saveOwned() {
  writeJson(OWNED_KEY, {
    kongboki: [...state.ownedByIsland.kongboki],
    kongsolki: [...state.ownedByIsland.kongsolki],
  });
}

function getLoginIsland() {
  return ACCOUNT_ISLANDS[String(state.loginId).trim()] || "";
}

function canEditIsland(island = state.currentIsland) {
  return Boolean(island) && getLoginIsland() === island;
}

function getIslandOwnedIds(island = state.currentIsland) {
  return state.ownedByIsland[island] || new Set();
}

function getVillagerIslands(villagerId) {
  return Object.keys(ISLAND_LABELS).filter((island) => getIslandOwnedIds(island).has(villagerId));
}
function loadLogin() {
  const savedId = String(readJson(AUTH_KEY, "")).trim();
  state.loginId = ALLOWED_LOGIN_IDS.includes(savedId) ? savedId : "";
  updateLoginButton();
}

function saveLogin(id) {
  state.loginId = String(id).trim();
  writeJson(AUTH_KEY, state.loginId);
  updateLoginButton();
}

function updateLoginButton() {
  if (!els.loginButton) return;
  els.loginButton.textContent = state.loginId ? `${state.loginId} 로그인 중` : "로그인";
}

function openLoginModal() {
  if (!els.loginModal) return;
  els.loginModal.hidden = false;
  els.loginError.textContent = "";
  els.loginInput.value = state.loginId;
  setTimeout(() => els.loginInput.focus(), 0);
}

function closeLoginModal() {
  if (!els.loginModal) return;
  els.loginModal.hidden = true;
}

function normalizeText(value) {
  return String(value || "").trim().toLocaleLowerCase();
}

function matchesQuery(villager) {
  const query = normalizeText(state.query);
  if (!query) return true;

  return [villager.name, villager.englishName]
    .filter(Boolean)
    .some((value) => normalizeText(value).includes(query));
}

function getSearchResults() {
  return state.villagers.filter(matchesQuery).slice(0, 36);
}

function createOwnershipMarks(villagerId) {
  const marks = document.createElement("div");
  marks.className = "owner-marks";

  getVillagerIslands(villagerId).forEach((island) => {
    const mark = document.createElement("span");
    mark.className = `owner-mark owner-mark-${island}`;
    mark.textContent = island === "kongboki" ? "콩보키" : "콩솔키";
    mark.title = `${ISLAND_LABELS[island]} 찜`;
    marks.append(mark);
  });

  return marks;
}

function createPortrait(image, villagerId, className = "villager-portrait") {
  const portrait = document.createElement("div");
  portrait.className = className;
  image.replaceWith(portrait);
  portrait.append(image, createOwnershipMarks(villagerId));
}

function createVillagerCard(villager) {
  const fragment = els.template.content.cloneNode(true);
  const card = fragment.querySelector(".villager-card");
  const image = fragment.querySelector(".villager-image");
  const title = fragment.querySelector("h3");
  const button = fragment.querySelector(".add-button");
  const loginIsland = getLoginIsland();
  const loginIslandOwnedIds = loginIsland ? getIslandOwnedIds(loginIsland) : new Set();
  const isOwnedByLogin = loginIslandOwnedIds.has(villager.id);

  image.src = villager.image;
  image.alt = `${villager.name} 이미지`;
  image.addEventListener("error", () => {
    image.src = fallbackImage;
  });
  createPortrait(image, villager.id);
  title.textContent = villager.englishName
    ? `${villager.name} (${villager.englishName})`
    : villager.name;

  fragment.querySelector('[data-field="gender"]').textContent = villager.gender;
  fragment.querySelector('[data-field="personality"]').textContent = villager.personality;
  fragment.querySelector('[data-field="catchphrase"]').textContent = villager.catchphrase;
  fragment.querySelector('[data-field="birthday"]').textContent = villager.birthday;

  button.textContent = !loginIsland
    ? "로그인 필요"
    : isOwnedByLogin
      ? "찜 완료"
      : `${ISLAND_LABELS[loginIsland].replace(" 주민", "")}에 추가`;
  button.disabled = !loginIsland || isOwnedByLogin;
  button.addEventListener("click", () => {
    if (!loginIsland) {
      openLoginModal();
      return;
    }
    getIslandOwnedIds(loginIsland).add(villager.id);
    saveOwned();
    render();
  });

  card.dataset.id = villager.id;
  return fragment;
}
function renderSearchResults() {
  const results = getSearchResults();
  els.searchResults.replaceChildren();

  if (!state.villagers.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "주민 데이터를 불러오는 중입니다.";
    els.searchResults.append(empty);
    return;
  }

  if (!results.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "검색 결과가 없습니다.";
    els.searchResults.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  results.forEach((villager) => fragment.append(createVillagerCard(villager)));
  els.searchResults.append(fragment);
}

function renderOwned() {
  const island = state.currentIsland;
  const editable = canEditIsland(island);
  const ownedVillagers = [...getIslandOwnedIds(island)]
    .map((id) => state.villagers.find((villager) => villager.id === id))
    .filter(Boolean);

  els.ownedCount.textContent = `${ownedVillagers.length}명`;
  els.ownedVillagers.replaceChildren();

  if (!ownedVillagers.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = editable
      ? "검색 결과에서 주민을 추가해 보세요."
      : "아직 등록된 주민이 없습니다.";
    els.ownedVillagers.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  ownedVillagers.forEach((villager) => {
    const item = document.createElement("article");
    item.className = "owned-item";

    const image = document.createElement("img");
    image.width = 48;
    image.height = 48;
    image.src = villager.image;
    image.alt = `${villager.name} 이미지`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.src = fallbackImage;
    });
    const portrait = document.createElement("div");
    portrait.className = "owned-portrait";
    portrait.append(image, createOwnershipMarks(villager.id));

    const meta = document.createElement("div");
    meta.className = "owned-meta";
    const name = document.createElement("strong");
    name.textContent = villager.name;
    const detail = document.createElement("span");
    detail.textContent = `${villager.personality} · ${villager.birthday}`;
    meta.append(name, detail);

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = editable ? "삭제" : "조회만";
    remove.disabled = !editable;
    remove.addEventListener("click", () => {
      if (!editable) return;
      getIslandOwnedIds(island).delete(villager.id);
      saveOwned();
      render();
    });

    item.append(portrait, meta, remove);
    fragment.append(item);
  });

  els.ownedVillagers.append(fragment);
}
function render() {
  els.dataStatus.textContent = state.dataSource;
  renderSearchResults();
  renderOwned();
}

function setVillagers(villagers, dataSource) {
  state.villagers = villagers;
  state.dataSource = dataSource;
  render();
}

function loadCachedVillagers() {
  const cached = readJson(DATA_CACHE_KEY, []);
  const cachedAt = Number(localStorage.getItem(DATA_CACHE_TIME_KEY) || 0);
  if (!Array.isArray(cached) || !cached.length) return false;

  const isFresh = Date.now() - cachedAt < CACHE_TTL_MS;
  setVillagers(cached, `${cached.length}명 캐시`);
  return isFresh;
}

function setMenuOpen(open) {
  state.menuOpen = open;
  document.body.classList.toggle("menu-open", open);
  els.sidebar.classList.toggle("is-open", open);
  els.sidebar.setAttribute("aria-hidden", open ? "false" : "true");
  els.menuOpenButton.setAttribute("aria-expanded", open ? "true" : "false");
  els.sidebarBackdrop.classList.toggle("is-visible", open);
}

function setView(view, island = state.currentIsland) {
  if (view === "owned") view = "island";
  if (view !== "search" && view !== "island") view = "search";

  if (view === "island" && ISLAND_LABELS[island]) {
    state.currentIsland = island;
  }

  state.currentView = view;
  els.searchView.hidden = view !== "search";
  els.ownedView.hidden = view !== "island";
  els.ownedTitle.textContent = ISLAND_LABELS[state.currentIsland];

  els.sidebarLinks.forEach((link) => {
    const isActive = view === "search"
      ? link.dataset.view === "search"
      : link.dataset.view === "island" && link.dataset.island === state.currentIsland;
    link.classList.toggle("is-active", isActive);
  });

  const hash = view === "island" ? `#${state.currentIsland}` : "#search";
  if (location.hash !== hash) {
    history.replaceState(null, "", hash);
  }

  renderOwned();
}

function readViewFromHash() {
  if (location.hash === "#kongsolki") {
    return { view: "island", island: "kongsolki" };
  }
  if (location.hash === "#kongboki" || location.hash === "#owned") {
    return { view: "island", island: "kongboki" };
  }
  return { view: "search", island: state.currentIsland };
}

async function fetchBaseVillagers() {
  const response = await fetch(BASE_DATA_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Base API failed: ${response.status}`);
  return normalizeBaseVillagers(await response.json());
}

async function fetchLocalVillagers() {
  const response = await fetch("./villagers.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Local fallback response not ok");
  return normalizeBaseVillagers(await response.json());
}

async function loadVillagers() {
  if (loadCachedVillagers()) return;

  try {
    const baseVillagers = await fetchBaseVillagers();
    setVillagers(baseVillagers, `${baseVillagers.length}명 API`);

    const extraVillagers = await fetchExtraVillagers();
    const villagers = mergeVillagers(baseVillagers, extraVillagers);
    writeJson(DATA_CACHE_KEY, villagers);
    localStorage.setItem(DATA_CACHE_TIME_KEY, String(Date.now()));

    const status = extraVillagers.length === EXTRA_VILLAGER_TITLES.length
      ? `${villagers.length}명 API`
      : `${villagers.length}명 API 일부`;
    setVillagers(villagers, status);
  } catch (error) {
    console.error("External API load failed, trying local fallback:", error);
    try {
      const localVillagers = await fetchLocalVillagers();
      setVillagers(localVillagers, `${localVillagers.length}명 로컬 JSON`);
    } catch (fallbackError) {
      console.error("Fallback load failed:", fallbackError);
      setVillagers(fallbackVillagers, "샘플 데이터");
    }
  }
}

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSearchResults();
});

els.menuOpenButton.addEventListener("click", () => setMenuOpen(true));
els.menuCloseButton.addEventListener("click", () => setMenuOpen(false));
els.sidebarBackdrop.addEventListener("click", () => setMenuOpen(false));

els.sidebarLinks.forEach((link) => {
  link.addEventListener("click", () => {
    setView(link.dataset.view, link.dataset.island);
    setMenuOpen(false);
  });
});

els.loginButton?.addEventListener("click", openLoginModal);
els.loginCancelButton?.addEventListener("click", closeLoginModal);
els.loginModal?.addEventListener("click", (event) => {
  if (event.target === els.loginModal) closeLoginModal();
});
els.loginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const loginId = els.loginInput.value.trim();
  if (!ALLOWED_LOGIN_IDS.includes(loginId)) {
    els.loginError.textContent = "그런 계정 없습니다.";
    return;
  }
  saveLogin(loginId);
  setView("island", getLoginIsland());
  closeLoginModal();
});

window.addEventListener("hashchange", () => {
  const route = readViewFromHash();
  setView(route.view, route.island);
});

function init() {
  loadOwned();
  loadLogin();
  const route = readViewFromHash();
  setView(route.view, route.island);
  render();
  loadVillagers();
}

init();
