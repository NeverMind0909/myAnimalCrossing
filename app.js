const OWNED_KEY = "acnh-owned-villagers-v2";

const state = {
  villagers: Array.isArray(window.ACNH_VILLAGERS) ? window.ACNH_VILLAGERS : [],
  ownedIds: new Set(),
  query: "",
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  ownedCount: document.querySelector("#ownedCount"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  ownedVillagers: document.querySelector("#ownedVillagers"),
  template: document.querySelector("#villagerCardTemplate"),
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

function loadOwned() {
  const owned = readJson(OWNED_KEY, []);
  state.ownedIds = new Set(owned.map(String));
}

function saveOwned() {
  writeJson(OWNED_KEY, [...state.ownedIds]);
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

function createVillagerCard(villager) {
  const fragment = els.template.content.cloneNode(true);
  const card = fragment.querySelector(".villager-card");
  const image = fragment.querySelector(".villager-image");
  const title = fragment.querySelector("h3");
  const button = fragment.querySelector(".add-button");

  image.src = villager.image;
  image.alt = `${villager.name} 이미지`;
  image.addEventListener("error", () => {
    image.src = fallbackImage;
  });
  title.textContent = villager.englishName
    ? `${villager.name} (${villager.englishName})`
    : villager.name;

  fragment.querySelector('[data-field="gender"]').textContent = villager.gender;
  fragment.querySelector('[data-field="personality"]').textContent =
    villager.personality;
  fragment.querySelector('[data-field="catchphrase"]').textContent =
    villager.catchphrase;
  fragment.querySelector('[data-field="birthday"]').textContent =
    villager.birthday;

  const isOwned = state.ownedIds.has(villager.id);
  button.textContent = isOwned ? "보유 중" : "추가";
  button.disabled = isOwned;
  button.addEventListener("click", () => {
    state.ownedIds.add(villager.id);
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
    empty.textContent = "주민 데이터 파일을 읽지 못했습니다.";
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
  const ownedVillagers = [...state.ownedIds]
    .map((id) => state.villagers.find((villager) => villager.id === id))
    .filter(Boolean);

  els.ownedCount.textContent = `${ownedVillagers.length}명`;
  els.ownedVillagers.replaceChildren();

  if (!ownedVillagers.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "검색 결과에서 주민을 추가해 보세요.";
    els.ownedVillagers.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  ownedVillagers.forEach((villager) => {
    const item = document.createElement("article");
    item.className = "owned-item";

    const image = document.createElement("img");
    image.src = villager.image;
    image.alt = `${villager.name} 이미지`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      image.src = fallbackImage;
    });

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
    remove.textContent = "삭제";
    remove.addEventListener("click", () => {
      state.ownedIds.delete(villager.id);
      saveOwned();
      render();
    });

    item.append(image, meta, remove);
    fragment.append(item);
  });

  els.ownedVillagers.append(fragment);
}

function render() {
  els.dataStatus.textContent = `${state.villagers.length}명 로컬`;
  renderSearchResults();
  renderOwned();
}

els.searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderSearchResults();
});

loadOwned();
render();
