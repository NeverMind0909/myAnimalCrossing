(() => {
  const root = document.querySelector("#critterGuideRoot");
  if (!root) return;

  const API_BASE = "https://raw.githubusercontent.com/alexislours/ACNHAPI/master";
  const CACHE_KEY = "acnh-critter-guide-cache-v2";
  const CACHE_TIME_KEY = "acnh-critter-guide-cache-time-v2";
  const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
  const HEMISPHERE = "northern";

  const groups = {
    fish: { label: "물고기", endpoint: "fish.json", imagePath: "fish", specialLabel: "저스틴", specialKey: "price-cj" },
    bugs: { label: "곤충", endpoint: "bugs.json", imagePath: "bugs", specialLabel: "레온", specialKey: "price-flick" },
    sea: { label: "해산물", endpoint: "sea.json", imagePath: "sea", specialLabel: "특수 판매 없음", specialKey: "" },
  };

  const locationKo = {
    Pier: "부두",
    Pond: "연못",
    River: "강",
    "River (Clifftop)": "강 절벽 위",
    "River (Clifftop) & Pond": "강 절벽 위 / 연못",
    "River (Mouth)": "강 하구",
    Sea: "바다",
    "Sea (when raining or snowing)": "바다, 비나 눈이 올 때",
    Flying: "날아다님",
    "Flying (near water)": "물가 근처 비행",
    "Flying by light": "불빛 주변 비행",
    "Flying near hybrid flowers": "교배꽃 주변 비행",
    "Hitting rocks": "바위를 치면 등장",
    "Near trash": "쓰레기 근처",
    "On beach rocks": "해변 바위 위",
    "On flowers": "꽃 위",
    "On palm trees": "야자수 위",
    "On ponds and rivers": "연못/강 위",
    "On rocks and bush (when raining)": "비 오는 날 바위/덤불 위",
    "On rotten food": "썩은 음식 위",
    "On the beach": "해변 위",
    "On the ground": "땅 위",
    "On tree stumps": "그루터기 위",
    "On trees": "나무 위",
    "On villagers": "주민 주변",
    "On white flowers": "하얀 꽃 위",
    "Shaking trees": "나무를 흔들면 등장",
    "Under trees": "나무 아래",
    Underground: "땅속",
  };

  const rarityKo = { Common: "흔함", Uncommon: "보통", Rare: "희귀", "Ultra-rare": "매우 희귀" };
  const shadowKo = {
    "Smallest (1)": "매우 작음 (1)",
    "Small (2)": "작음 (2)",
    "Medium (3)": "중간 (3)",
    "Medium (4)": "중간 (4)",
    "Medium with fin (4)": "중간 + 지느러미 (4)",
    "Large (5)": "큼 (5)",
    "Largest (6)": "매우 큼 (6)",
    "Largest with fin (6)": "매우 큼 + 지느러미 (6)",
    Narrow: "가늘다",
    Smallest: "매우 작음",
    Small: "작음",
    Medium: "중간",
    Large: "큼",
    Largest: "매우 큼",
    "X-Large": "매우 큼",
  };
  const speedKo = { Stationary: "움직이지 않음", "Very slow": "매우 느림", Slow: "느림", Medium: "보통", Fast: "빠름", "Very fast": "매우 빠름" };

  const state = {
    activeGroup: "fish",
    query: "",
    sort: "price-desc",
    onlyAvailableNow: false,
    detailId: "",
    critters: { fish: [], bugs: [], sea: [] },
    loading: true,
    error: "",
  };

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn("Critter cache failed:", error);
    }
  }

  function formatBells(value) {
    return `${(Number(value) || 0).toLocaleString("ko-KR")}벨`;
  }

  function translate(map, value) {
    return map[value] || value || "-";
  }

  function formatMonths(availability) {
    if (availability?.isAllYear) return "연중";
    const raw = availability?.[`month-${HEMISPHERE}`] || "-";
    return raw.replace(/(\d+)/g, "$1월").replace(/-/g, "~").replace(/ & /g, ", ");
  }

  function formatTime(availability) {
    if (availability?.isAllDay) return "하루 종일";
    return String(availability?.time || "-")
      .replace(/(\d+)am/g, "오전 $1시")
      .replace(/(\d+)pm/g, "오후 $1시")
      .replace(/ - /g, " ~ ");
  }

  function getNow() {
    const now = new Date();
    return { month: now.getMonth() + 1, hour: now.getHours() };
  }

  function isAvailableNow(availability) {
    const { month, hour } = getNow();
    const months = availability?.[`month-array-${HEMISPHERE}`] || availability?.monthArray || [];
    const hours = availability?.["time-array"] || availability?.timeArray || [];
    const monthOk = availability?.isAllYear || months.includes(month);
    const hourOk = availability?.isAllDay || hours.includes(hour);
    return Boolean(monthOk && hourOk);
  }

  function refreshAvailabilityFlags() {
    Object.values(state.critters).flat().forEach((item) => {
      item.availableNow = isAvailableNow(item);
    });
  }

  function getSpecialPrice(groupKey, raw, price) {
    const group = groups[groupKey];
    if (!group.specialKey) return 0;
    return Number(raw[group.specialKey]) || Math.round(price * 1.5);
  }

  function toRawAssetUrl(kind, groupKey, fileName) {
    if (!fileName) return "";
    return `${API_BASE}/${kind}/${groups[groupKey].imagePath}/${fileName}.png`;
  }

  function getKoreanGuidePhrase(item) {
    if (item.groupKey === "fish") return `${item.name}은(는) ${item.location}에서 잡을 수 있는 ${item.groupLabel}입니다.`;
    if (item.groupKey === "bugs") return `${item.name}은(는) ${item.location}에서 발견할 수 있는 ${item.groupLabel}입니다.`;
    return `${item.name}은(는) 잠수해서 채집할 수 있는 ${item.groupLabel}입니다.`;
  }

  function normalizeCritter(groupKey, key, raw) {
    const price = Number(raw.price) || 0;
    const availability = raw.availability || {};
    const fileName = raw["file-name"] || key;
    const item = {
      id: `${groupKey}-${raw.id || key}`,
      key,
      groupKey,
      groupLabel: groups[groupKey].label,
      name: raw.name?.["name-KRko"] || raw.name?.["name-USen"] || key,
      englishName: raw.name?.["name-USen"] || key,
      image: toRawAssetUrl("images", groupKey, fileName) || raw.image_uri || "",
      icon: toRawAssetUrl("icons", groupKey, fileName) || raw.icon_uri || "",
      price,
      specialPrice: getSpecialPrice(groupKey, raw, price),
      specialLabel: groups[groupKey].specialLabel,
      location: groupKey === "sea" ? "바다, 잠수" : translate(locationKo, availability.location),
      rarity: translate(rarityKo, availability.rarity),
      months: formatMonths(availability),
      time: formatTime(availability),
      shadow: translate(shadowKo, raw.shadow),
      speed: translate(speedKo, raw.speed),
      monthArray: availability[`month-array-${HEMISPHERE}`] || [],
      timeArray: availability["time-array"] || [],
      isAllYear: Boolean(availability.isAllYear),
      isAllDay: Boolean(availability.isAllDay),
      availableNow: isAvailableNow(availability),
      catchPhrase: raw["catch-phrase"] || "-",
      museumPhrase: raw["museum-phrase"] || "-",
    };
    item.koreanGuidePhrase = getKoreanGuidePhrase(item);
    return item;
  }

  function normalizeGroup(groupKey, data) {
    return Object.entries(data || {}).map(([key, raw]) => normalizeCritter(groupKey, key, raw));
  }

  async function fetchGroup(groupKey) {
    const response = await fetch(`${API_BASE}/${groups[groupKey].endpoint}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`${groups[groupKey].label} 데이터를 불러오지 못했습니다.`);
    return normalizeGroup(groupKey, await response.json());
  }

  function loadCachedCritters() {
    const cached = readJson(CACHE_KEY, null);
    const cachedAt = Number(localStorage.getItem(CACHE_TIME_KEY)) || 0;
    if (!cached || !Object.keys(groups).every((key) => Array.isArray(cached[key]))) return false;
    state.critters = cached;
    refreshAvailabilityFlags();
    state.loading = false;
    render();
    return Date.now() - cachedAt < CACHE_TTL_MS;
  }

  async function loadCritters() {
    if (loadCachedCritters()) return;
    state.loading = true;
    state.error = "";
    render();

    try {
      const entries = await Promise.all(Object.keys(groups).map(async (key) => [key, await fetchGroup(key)]));
      state.critters = Object.fromEntries(entries);
      writeJson(CACHE_KEY, state.critters);
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      state.loading = false;
    } catch (error) {
      console.error("Critter load failed:", error);
      state.loading = false;
      state.error = error.message || "생물 데이터를 불러오지 못했습니다.";
    }

    render();
  }

  function getCurrentList() {
    refreshAvailabilityFlags();
    const query = state.query.trim().toLocaleLowerCase();
    const list = state.critters[state.activeGroup] || [];
    const filtered = list.filter((item) => {
      const matchesQuery = !query || [item.name, item.englishName].some((value) => value.toLocaleLowerCase().includes(query));
      const matchesAvailability = !state.onlyAvailableNow || item.availableNow;
      return matchesQuery && matchesAvailability;
    });

    filtered.sort((a, b) => {
      if (state.sort === "name-asc") return a.name.localeCompare(b.name, "ko", { numeric: true });
      if (state.sort === "price-asc") return a.price - b.price || a.name.localeCompare(b.name, "ko");
      if (state.sort === "special-desc") return b.specialPrice - a.specialPrice || b.price - a.price;
      return b.price - a.price || a.name.localeCompare(b.name, "ko");
    });

    return filtered;
  }

  function createButton(className, text) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    return button;
  }

  function createTabs() {
    const tabs = document.createElement("div");
    tabs.className = "critter-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "생물 종류");

    Object.entries(groups).forEach(([key, group]) => {
      const button = createButton(`critter-tab${state.activeGroup === key ? " is-active" : ""}`, group.label);
      button.dataset.critterTab = key;
      button.addEventListener("click", () => {
        state.activeGroup = key;
        state.detailId = "";
        render();
      });
      tabs.append(button);
    });

    return tabs;
  }

  function createControls() {
    const controls = document.createElement("div");
    controls.className = "critter-controls";

    const searchLabel = document.createElement("label");
    searchLabel.className = "critter-search";
    const searchText = document.createElement("span");
    searchText.textContent = "검색";
    const searchInput = document.createElement("input");
    searchInput.type = "search";
    searchInput.placeholder = "이름 검색";
    searchInput.value = state.query;
    searchInput.addEventListener("input", (event) => {
      state.query = event.target.value;
      renderList();
    });
    searchLabel.append(searchText, searchInput);

    const sortLabel = document.createElement("label");
    sortLabel.className = "critter-sort";
    const sortText = document.createElement("span");
    sortText.textContent = "정렬";
    const sortSelect = document.createElement("select");
    [["price-desc", "가격 높은순"], ["price-asc", "가격 낮은순"], ["name-asc", "이름순"], ["special-desc", "저스틴/레온 높은순"]]
      .forEach(([value, label]) => sortSelect.append(new Option(label, value)));
    sortSelect.value = state.sort;
    sortSelect.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderList();
    });
    sortLabel.append(sortText, sortSelect);

    const availabilityLabel = document.createElement("label");
    availabilityLabel.className = "critter-now-filter";
    const availabilityInput = document.createElement("input");
    availabilityInput.type = "checkbox";
    availabilityInput.checked = state.onlyAvailableNow;
    availabilityInput.addEventListener("change", (event) => {
      state.onlyAvailableNow = event.target.checked;
      renderList();
    });
    const availabilityText = document.createElement("span");
    availabilityText.textContent = "지금 잡을 수 있는 것만";
    availabilityLabel.append(availabilityInput, availabilityText);

    controls.append(searchLabel, sortLabel, availabilityLabel);
    return controls;
  }

  function createAvailabilityBadge(item) {
    const badge = document.createElement("span");
    badge.className = `critter-availability${item.availableNow ? " is-now" : " is-later"}`;
    badge.textContent = item.availableNow ? "지금 가능" : "지금 불가";
    return badge;
  }

  function createPriceBlock(item) {
    const prices = document.createElement("div");
    prices.className = "critter-prices";

    const nook = document.createElement("span");
    nook.innerHTML = `<b>너굴</b>${formatBells(item.price)}`;
    prices.append(nook);

    if (item.specialPrice) {
      const special = document.createElement("span");
      special.innerHTML = `<b>${item.specialLabel}</b>${formatBells(item.specialPrice)}`;
      prices.append(special);
    }

    return prices;
  }

  function createCard(item) {
    const card = createButton(`critter-card${item.availableNow ? " is-available" : " is-unavailable"}`, "");
    card.setAttribute("aria-label", `${item.name} 상세 보기`);

    const image = document.createElement("img");
    image.src = item.icon;
    image.alt = item.name;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      if (image.src !== item.image) image.src = item.image;
    }, { once: true });

    const name = document.createElement("strong");
    name.textContent = item.name;

    const meta = document.createElement("p");
    meta.textContent = `${item.location} · ${item.time}`;

    card.append(createAvailabilityBadge(item), image, name, createPriceBlock(item), meta);
    card.addEventListener("click", () => {
      state.detailId = item.id;
      render();
    });
    return card;
  }

  function createDetailRow(label, value) {
    const row = document.createElement("div");
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value || "-";
    row.append(dt, dd);
    return row;
  }

  function createSourceLinks() {
    const links = document.createElement("div");
    links.className = "source-links";
    const link = document.createElement("a");
    link.className = "source-link";
    link.href = "https://github.com/alexislours/ACNHAPI";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "ACNHAPI";
    links.append(link);
    return links;
  }

  function renderDetail(item) {
    const article = document.createElement("article");
    article.className = "critter-detail";

    const backButton = createButton("tour-back-button", "← 목록");
    backButton.addEventListener("click", () => {
      state.detailId = "";
      render();
    });

    const hero = document.createElement("div");
    hero.className = `critter-detail-hero${item.availableNow ? " is-available" : " is-unavailable"}`;
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;
    const titleWrap = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = item.name;
    const subtitle = document.createElement("p");
    subtitle.textContent = `${item.groupLabel} · ${item.englishName}`;
    titleWrap.append(createAvailabilityBadge(item), title, subtitle, createPriceBlock(item));
    hero.append(image, titleWrap);

    const detailList = document.createElement("dl");
    detailList.className = "critter-detail-list";
    [["너굴상점", formatBells(item.price)], [item.specialPrice ? item.specialLabel : "특수 판매", item.specialPrice ? formatBells(item.specialPrice) : "해산물은 특수 매입 대상 아님"], ["현재 출현", item.availableNow ? "지금 잡을 수 있음" : "현재 시간에는 잡을 수 없음"], ["출현 월", item.months], ["출현 시간", item.time], ["장소", item.location], ["희귀도", item.rarity], [state.activeGroup === "sea" ? "그림자/속도" : "그림자", state.activeGroup === "sea" ? `${item.shadow} / ${item.speed}` : item.shadow], ["도감 문구", item.koreanGuidePhrase]]
      .forEach(([label, value]) => detailList.append(createDetailRow(label, value)));

    article.append(backButton, hero, detailList);
    root.replaceChildren(createTabs(), article, createSourceLinks());
  }

  function renderList() {
    const list = getCurrentList();
    const listRoot = root.querySelector("#critterListRoot");
    const count = root.querySelector("#critterResultCount");
    if (!listRoot || !count) return;

    count.textContent = `${list.length}개`;
    listRoot.replaceChildren();

    if (!list.length) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "조건에 맞는 생물이 없습니다.";
      listRoot.append(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "critter-grid";
    list.forEach((item) => grid.append(createCard(item)));
    listRoot.append(grid);
  }

  function render() {
    refreshAvailabilityFlags();
    const selected = Object.values(state.critters).flat().find((item) => item.id === state.detailId);
    if (selected) {
      renderDetail(selected);
      return;
    }

    const shell = document.createDocumentFragment();
    shell.append(createTabs());

    if (state.loading) {
      const loading = document.createElement("p");
      loading.className = "empty-state";
      loading.textContent = "생물 데이터를 불러오는 중입니다.";
      shell.append(loading);
      root.replaceChildren(shell);
      return;
    }

    if (state.error) {
      const error = document.createElement("p");
      error.className = "empty-state";
      error.textContent = state.error;
      shell.append(error);
      root.replaceChildren(shell);
      return;
    }

    const summary = document.createElement("div");
    summary.className = "critter-summary";
    const title = document.createElement("h3");
    title.textContent = `${groups[state.activeGroup].label} 도감`;
    const count = document.createElement("span");
    count.id = "critterResultCount";
    summary.append(title, count);

    const listRoot = document.createElement("div");
    listRoot.id = "critterListRoot";

    shell.append(createControls(), summary, listRoot, createSourceLinks());
    root.replaceChildren(shell);
    renderList();
  }

  loadCritters();
})();