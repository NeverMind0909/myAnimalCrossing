const BASE_DATA_API_URL = "https://raw.githubusercontent.com/alexislours/ACNHAPI/master/villagers.json";
const NOOKIPEDIA_API_URL = "https://nookipedia.com/w/api.php";
const OWNED_KEY = "acnh-owned-villagers-by-island-v1";
const WISHLIST_KEY = "acnh-wishlist-by-island-v1";
const LEGACY_OWNED_KEY = "acnh-owned-villagers-v2";
const AUTH_KEY = "acnh-login-id-v1";
const DATA_CACHE_KEY = "acnh-villagers-api-cache-v7";
const DATA_CACHE_TIME_KEY = "acnh-villagers-api-cache-time-v7";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const DETAIL_CACHE_KEY = "acnh-villager-detail-cache-v4";
const SONG_CACHE_KEY = "acnh-song-ko-cache-v1";
const ACCOUNT_ISLANDS = {
  "0726": "kongboki",
  "250726": "kongsolki",
};
const ALLOWED_LOGIN_IDS = Object.keys(ACCOUNT_ISLANDS);
const ISLAND_LABELS = {
  kongboki: "콩보키섬 주민",
  kongsolki: "콩솔키섬 주민",
};
const SYNC_CONFIG = window.ACNH_SYNC_CONFIG || {};
const SOOPOLLEAF_DETAILS = window.SOOPOLLEAF_VILLAGER_DETAILS || {};

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


const speciesKo = {
  Alligator: "악어",
  Anteater: "개미핥기",
  Bear: "곰",
  Bird: "새",
  Bull: "황소",
  Cat: "고양이",
  Chicken: "닭",
  Cow: "소",
  Cub: "아기곰",
  Deer: "사슴",
  Dog: "개",
  Duck: "오리",
  Eagle: "독수리",
  Elephant: "코끼리",
  Frog: "개구리",
  Goat: "염소",
  Gorilla: "고릴라",
  Hamster: "햄스터",
  Hippo: "하마",
  Horse: "말",
  Kangaroo: "캥거루",
  Koala: "코알라",
  Lion: "사자",
  Monkey: "원숭이",
  Mouse: "쥐",
  Octopus: "문어",
  Ostrich: "타조",
  Penguin: "펭귄",
  Pig: "돼지",
  Rabbit: "토끼",
  Rhino: "코뿔소",
  Sheep: "양",
  Squirrel: "다람쥐",
  Tiger: "호랑이",
  Wolf: "늑대",
};

const hobbyKo = {
  Education: "교육",
  Fashion: "패션",
  Fitness: "운동",
  Music: "음악",
  Nature: "자연",
  Play: "놀이",
};

const styleKo = {
  Active: "활동적",
  Cool: "쿨",
  Cute: "큐트",
  Elegant: "엘레강트",
  Gorgeous: "화려함",
  Simple: "심플",
};


const pointKo = {
  High: "높음",
  Low: "낮음",
  Medium: "보통",
};
const colorKo = {
  Beige: "베이지",
  Black: "검정",
  Blue: "파랑",
  Brown: "갈색",
  Colorful: "컬러풀",
  Gray: "회색",
  Green: "초록",
  Orange: "주황",
  Pink: "분홍",
  Purple: "보라",
  Red: "빨강",
  White: "하양",
  Yellow: "노랑",
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
  wishlistByIsland: {
    kongboki: new Set(),
    kongsolki: new Set(),
  },
  query: "",
  filters: {
    personality: "",
    species: "",
    gender: "",
    amiiboSeries: "",
  },
  currentView: "search",
  currentIsland: "kongboki",
  loginId: "",
  menuOpen: false,
  previousView: "search",
  selectedVillagerId: "",
  detailCache: readJson(DETAIL_CACHE_KEY, {}),
  songCache: readJson(SONG_CACHE_KEY, {}),
};

const els = {
  dataStatus: document.querySelector("#dataStatus"),
  ownedCount: document.querySelector("#ownedCount"),
  searchInput: document.querySelector("#searchInput"),
  searchResults: document.querySelector("#searchResults"),
  personalityFilter: document.querySelector("#personalityFilter"),
  speciesFilter: document.querySelector("#speciesFilter"),
  genderFilter: document.querySelector("#genderFilter"),
  amiiboSeriesFilter: document.querySelector("#amiiboSeriesFilter"),
  ownedVillagers: document.querySelector("#ownedVillagers"),
  ownedTitle: document.querySelector("#owned-title"),
  template: document.querySelector("#villagerCardTemplate"),
  searchView: document.querySelector("#searchView"),
  ownedView: document.querySelector("#ownedView"),
  tipsMysteryView: document.querySelector("#tipsMysteryView"),
  tipsCritterView: document.querySelector("#tipsCritterView"),
  appInfoView: document.querySelector("#appInfoView"),
  villagerDetailView: document.querySelector("#villagerDetailView"),
  villagerDetailRoot: document.querySelector("#villagerDetailRoot"),
  sidebar: document.querySelector("#sidebar"),
  sidebarBackdrop: document.querySelector("#sidebarBackdrop"),
  menuOpenButton: document.querySelector("#menuOpenButton"),
  menuCloseButton: document.querySelector("#menuCloseButton"),
  tipsToggleButton: document.querySelector("#tipsToggleButton"),
  tipsSubmenu: document.querySelector("#tipsSubmenu"),
  loginButton: document.querySelector("#loginButton"),
  loginModal: document.querySelector("#loginModal"),
  loginForm: document.querySelector("#loginForm"),
  loginInput: document.querySelector("#loginInput"),
  loginError: document.querySelector("#loginError"),
  loginCancelButton: document.querySelector("#loginCancelButton"),
  houseImageModal: document.querySelector("#houseImageModal"),
  houseModalTitle: document.querySelector("#houseModalTitle"),
  houseModalImage: document.querySelector("#houseModalImage"),
  houseModalCloseButton: document.querySelector("#houseModalCloseButton"),
  sidebarLinks: document.querySelectorAll(".sidebar-link[data-view]"),
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
  if (raw.name && raw.englishName && raw.image) {
    return {
      species: "정보 없음",
      subtype: "정보 없음",
      hobby: "정보 없음",
      saying: "정보 없음",
      clothing: raw.clothing || "정보 없음",
      clothingImage: raw.clothingImage || "",
      umbrella: raw.umbrella || "정보 없음",
      umbrellaImage: raw.umbrellaImage || "",
      favoriteSong: "정보 없음",
      style: "정보 없음",
      color: "정보 없음",
      rawSpecies: raw.rawSpecies || "",
      rawGender: raw.rawGender || "",
      rawPersonality: raw.rawPersonality || "",
      amiiboSeriesKey: raw.amiiboSeriesKey || "",
      sociality: raw.sociality || "정보 없음",
      amiiboNumber: raw.amiiboNumber || "정보 없음",
      amiiboSeries: raw.amiiboSeries || "정보 없음",
      houseExterior: "",
      houseInterior: "",
      ...raw,
    };
  }

  const fileName = raw["file-name"] || raw.id;
  return {
    id: String(fileName || raw.id),
    name: getLocalizedName(raw.name),
    englishName: raw.name?.["name-USen"] || "",
    image: fileName
      ? `https://raw.githubusercontent.com/alexislours/ACNHAPI/master/images/villagers/${fileName}.png`
      : raw.image_uri || raw.icon_uri || "",
    rawGender: raw.gender || "",
    gender: genderKo[raw.gender] || raw.gender || "알 수 없음",
    rawPersonality: raw.personality || "",
    personality: personalityKo[raw.personality] || raw.personality || "알 수 없음",
    rawSpecies: raw.species || "",
    species: translateValue(speciesKo, raw.species),
    subtype: raw.subtype || "정보 없음",
    hobby: translateValue(hobbyKo, raw.hobby),
    sociality: "정보 없음",
    catchphrase:
      raw["catch-translations"]?.["catch-KRko"] || raw["catch-phrase"] || "알 수 없음",
    birthday: toKoreanBirthday(raw.birthday) || raw["birthday-string"] || "알 수 없음",
    saying: translateSaying(raw.saying),
    clothing: "정보 없음",
    clothingImage: "",
    umbrella: "정보 없음",
    umbrellaImage: "",
    favoriteSong: "정보 없음",
    style: "정보 없음",
    color: "정보 없음",
    amiiboNumber: "정보 없음",
    amiiboSeries: "정보 없음",
    amiiboSeriesKey: "",
    houseExterior: "",
    houseInterior: "",
  };
}

function normalizeBaseVillagers(apiData) {
  const values = Array.isArray(apiData) ? apiData : Object.values(apiData);
  return values
    .map(normalizeBaseVillager)
    .sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

function getWikiField(content, fieldName) {
  const escapedField = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^\\|[^\\S\\r\\n]*${escapedField}[^\\S\\r\\n]*=[^\\S\\r\\n]*(.*)$`, "im");
  return content.match(pattern)?.[1]?.trim() || "";
}

function toWikiImageUrl(fileName) {
  return `https://nookipedia.com/wiki/Special:Redirect/file/${encodeURIComponent(fileName)}`;
}


function translateValue(map, value) {
  const cleaned = cleanWikiText(value);
  const key = normalizeLookupKey(cleaned);
  return map[cleaned] || map[key] || cleaned || "정보 없음";
}

function joinDetailValues(...values) {
  const cleaned = values.map(cleanWikiText).filter(Boolean);
  return cleaned.length ? cleaned.join(" / ") : "정보 없음";
}

function cleanWikiText(value) {
  return String(value || "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\{\{[^{}]*\}\}/g, "")
    .replace(/\[\[[^|\]]+\|([^\]]+)\]\]/g, "$1")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/'''/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function withVariant(name, variant) {
  const cleanName = cleanWikiText(name);
  const cleanVariant = cleanWikiText(variant);
  if (!cleanName && !cleanVariant) return "정보 없음";
  return cleanVariant ? `${cleanName} (${cleanVariant})` : cleanName;
}


function getSoopoolleafDetail(villager) {
  if (!villager?.englishName) return null;
  return SOOPOLLEAF_DETAILS[villager.englishName] || null;
}

function applyKoreanSupplement(villager, detail) {
  const supplement = getSoopoolleafDetail(villager);
  if (!supplement) return detail;
  return {
    ...detail,
    saying: supplement.saying || detail.saying,
    favoriteSong: supplement.favoriteSong || detail.favoriteSong,
    amiiboNumber: supplement.amiiboNumber || detail.amiiboNumber,
    amiiboSeries: supplement.amiiboSeries || detail.amiiboSeries,
    amiiboSeriesKey: supplement.amiiboSeries || detail.amiiboSeriesKey,
  };
}
function applyKoreanSupplements(villagers) {
  return villagers.map((villager) => applyKoreanSupplement(villager, villager));
}

function getAmiiboSeries(cardNumber) {
  const number = Number(cardNumber);
  if (!number) return "정보 없음";
  if (number <= 100) return "1탄";
  if (number <= 200) return "2탄";
  if (number <= 300) return "3탄";
  if (number <= 400) return "4탄";
  if (number <= 448) return "5탄";
  return "정보 없음";
}

function getAmiiboInfo(cardFile) {
  const cleaned = cleanWikiText(cardFile);
  const number = cleaned.match(/^(\d+)/)?.[1] || "";
  if (!number) return { number: "정보 없음", series: "정보 없음" };
  return { number, series: getAmiiboSeries(number) };
}

function normalizeLookupKey(value) {
  const cleaned = cleanWikiText(value);
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase() : "";
}

function getTemplateBlock(content, templateName) {
  const start = content.indexOf(`{{${templateName}`);
  if (start < 0) return "";
  const nextSection = content.indexOf("\n==", start + templateName.length);
  return content.slice(start, nextSection < 0 ? content.length : nextSection);
}

function getTemplateField(content, templateName, fieldName) {
  return getWikiField(getTemplateBlock(content, templateName), fieldName);
}

function toTitleWords(value) {
  return cleanWikiText(value)
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.split(/([-/])/).map((part) => part === "-" || part === "/" ? part : part.charAt(0).toUpperCase() + part.slice(1)).join(""))
    .join(" ");
}

function toItemIconUrl(itemName, variant = "") {
  const name = toTitleWords(itemName);
  if (!name || name === "정보 없음") return "";
  const cleanVariant = toTitleWords(variant);
  const fileName = cleanVariant ? `${name} (${cleanVariant}) NH Icon.png` : `${name} NH Icon.png`;
  return toWikiImageUrl(fileName);
}

function translateSongName(value) {
  const song = cleanWikiText(value);
  if (!song) return "정보 없음";
  return song.replace(/^K\.K\.\s*/, "K.K.");
}

function translateSaying(value) {
  return cleanWikiText(value) || "정보 없음";
}

async function fetchKoreanSongName(songName) {
  const cleaned = cleanWikiText(songName);
  if (!cleaned || cleaned === "정보 없음") return "정보 없음";
  if (state.songCache[cleaned]) return state.songCache[cleaned];

  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: cleaned,
    rvprop: "content",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const response = await fetch(`${NOOKIPEDIA_API_URL}?${params}`);
  if (!response.ok) return cleaned;

  const data = await response.json();
  const content = data.query?.pages?.[0]?.revisions?.[0]?.content || "";
  const koName = cleanWikiText(getWikiField(content, "ko-name") || getWikiField(content, "ko"));
  const result = koName || cleaned;
  state.songCache[cleaned] = result;
  writeJson(SONG_CACHE_KEY, state.songCache);
  return result;
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
  const nhInfo = getTemplateBlock(content, "NHVillagerInfo") || content;
  const nhHouse = getTemplateBlock(content, "NHHouse");
  const englishName = cleanWikiText(getWikiField(nhInfo, "name") || getWikiField(content, "name")) || title;
  const imageFile = getWikiField(nhInfo, "image") || getWikiField(content, "image");
  const cardInfo = getAmiiboInfo(getTemplateField(content, "A-card", "front") || getWikiField(content, "front"));
  const rawGender = cleanWikiText(getWikiField(nhInfo, "gender"));
  const rawPersonality = cleanWikiText(getWikiField(nhInfo, "personality"));
  const rawSpecies = cleanWikiText(getWikiField(nhInfo, "species"));
  const rawHobby = cleanWikiText(getWikiField(nhInfo, "hobby"));
  const style1 = cleanWikiText(getWikiField(nhInfo, "favstyle1"));
  const style2 = cleanWikiText(getWikiField(nhInfo, "favstyle2"));
  const color1 = cleanWikiText(getWikiField(nhInfo, "favcolor1"));
  const color2 = cleanWikiText(getWikiField(nhInfo, "favcolor2"));
  const clothingName = getWikiField(nhInfo, "clothing") || getWikiField(content, "clothes1");
  const clothingVariant = getWikiField(nhInfo, "clothing-var") || getWikiField(content, "clothes-nh-var");
  const umbrellaName = getWikiField(nhInfo, "umbrella") || getWikiField(content, "umbrella1");
  const exteriorFile = getWikiField(nhHouse, "ext");
  const interiorFile = getWikiField(nhHouse, "int");

  return {
    id: `nookipedia-${englishName.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: cleanWikiText(getWikiField(nhInfo, "ko-name")) || englishName,
    englishName,
    image: imageFile ? toWikiImageUrl(imageFile) : "",
    rawGender,
    gender: genderKo[rawGender] || rawGender || "알 수 없음",
    rawPersonality,
    personality: personalityKo[rawPersonality] || rawPersonality || "알 수 없음",
    rawSpecies,
    species: translateValue(speciesKo, rawSpecies),
    subtype: cleanWikiText(getWikiField(nhInfo, "sub-personality")) || "정보 없음",
    hobby: translateValue(hobbyKo, rawHobby),
    sociality: translateValue(pointKo, getWikiField(nhInfo, "life-points")),
    catchphrase: cleanWikiText(getWikiField(nhInfo, "ko-phrase")) || cleanWikiText(getWikiField(nhInfo, "catchphrase")) || "알 수 없음",
    birthday: toKoreanBirthdayFromWiki(
      getWikiField(nhInfo, "birthdaymonth") || getWikiField(nhInfo, "birthday-month"),
      getWikiField(nhInfo, "birthday"),
    ),
    saying: translateSaying(getWikiField(nhInfo, "ko-quote") || getWikiField(nhInfo, "quote")),
    clothing: withVariant(clothingName, clothingVariant),
    clothingImage: toItemIconUrl(clothingName, clothingVariant),
    umbrella: cleanWikiText(umbrellaName) || "정보 없음",
    umbrellaImage: toItemIconUrl(umbrellaName),
    favoriteSong: translateSongName(getWikiField(nhInfo, "ko-song") || getWikiField(nhInfo, "song")),
    style: joinDetailValues(translateValue(styleKo, style1), translateValue(styleKo, style2)).replace("정보 없음 / ", "").replace(" / 정보 없음", ""),
    color: joinDetailValues(translateValue(colorKo, color1), translateValue(colorKo, color2)).replace("정보 없음 / ", "").replace(" / 정보 없음", ""),
    amiiboNumber: cardInfo.number,
    amiiboSeries: cardInfo.series,
    amiiboSeriesKey: cardInfo.series === "정보 없음" ? "" : cardInfo.series,
    houseExterior: exteriorFile ? toWikiImageUrl(exteriorFile) : "",
    houseInterior: interiorFile ? toWikiImageUrl(interiorFile) : "",
  };
}
async function fetchVillagerDetail(villager) {
  if (!villager?.englishName) return villager;
  if (state.detailCache[villager.englishName]) {
    return applyKoreanSupplement(villager, { ...villager, ...state.detailCache[villager.englishName] });
  }

  const params = new URLSearchParams({
    action: "query",
    prop: "revisions",
    titles: villager.englishName,
    rvprop: "content",
    format: "json",
    formatversion: "2",
    origin: "*",
  });
  const response = await fetch(`${NOOKIPEDIA_API_URL}?${params}`);
  if (!response.ok) throw new Error(`Nookipedia detail failed: ${response.status}`);

  const data = await response.json();
  const page = data.query?.pages?.[0];
  const content = page?.revisions?.[0]?.content;
  if (!content || page.missing) return villager;

  let detail = normalizeNookipediaVillager(villager.englishName, content);
  detail = applyKoreanSupplement(villager, detail);
  if (!getSoopoolleafDetail(villager)) {
    detail.favoriteSong = await fetchKoreanSongName(detail.favoriteSong);
  }
  state.detailCache[villager.englishName] = detail;
  writeJson(DETAIL_CACHE_KEY, state.detailCache);
  return { ...villager, ...detail, id: villager.id };
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

function createEmptyIslandSets() {
  return {
    kongboki: new Set(),
    kongsolki: new Set(),
  };
}

function serializeIslandSets(islandSets) {
  return {
    kongboki: [...(islandSets.kongboki || new Set())],
    kongsolki: [...(islandSets.kongsolki || new Set())],
  };
}

function toIslandSets(value) {
  const sets = createEmptyIslandSets();
  if (!value || typeof value !== "object" || Array.isArray(value)) return sets;

  Object.keys(ISLAND_LABELS).forEach((island) => {
    sets[island] = new Set(normalizeIdList(value[island]));
  });
  return sets;
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

function saveLocalSharedState() {
  writeJson(OWNED_KEY, serializeIslandSets(state.ownedByIsland));
  writeJson(WISHLIST_KEY, serializeIslandSets(state.wishlistByIsland));
}

function saveOwned() {
  saveLocalSharedState();
  syncSharedState();
}

function loadWishlist() {
  state.wishlistByIsland = toIslandSets(readJson(WISHLIST_KEY, null));
}

function getSupabaseConfig() {
  const projectUrl = String(SYNC_CONFIG.projectUrl || "").trim().replace(/\/+$/, "");
  const anonKey = String(SYNC_CONFIG.anonKey || "").trim();
  const table = String(SYNC_CONFIG.table || "acnh_shared_state").trim();
  const rowId = String(SYNC_CONFIG.rowId || "main").trim();
  return { projectUrl, anonKey, table, rowId };
}

function hasRemoteSyncConfig() {
  const { projectUrl, anonKey, table, rowId } = getSupabaseConfig();
  return Boolean(projectUrl && anonKey && table && rowId);
}

function getSupabaseTableUrl() {
  const { projectUrl, table } = getSupabaseConfig();
  return `${projectUrl}/rest/v1/${encodeURIComponent(table)}`;
}

function getRemoteHeaders(extraHeaders = {}) {
  const { anonKey } = getSupabaseConfig();
  return Object.assign(
    {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    extraHeaders,
  );
}

function getSharedState() {
  return {
    owned: serializeIslandSets(state.ownedByIsland),
    wishlist: serializeIslandSets(state.wishlistByIsland),
    updatedAt: new Date().toISOString(),
  };
}

function applySharedState(data) {
  if (!data || typeof data !== "object") return;
  state.ownedByIsland = toIslandSets(data.owned || data.ownedByIsland);
  state.wishlistByIsland = toIslandSets(data.wishlist || data.wishlistByIsland);
  saveLocalSharedState();
  render();
}

async function loadRemoteSharedState() {
  if (!hasRemoteSyncConfig()) return;
  const { rowId } = getSupabaseConfig();
  const url = `${getSupabaseTableUrl()}?id=eq.${encodeURIComponent(rowId)}&select=data`;

  try {
    const response = await fetch(url, {
      cache: "no-store",
      headers: getRemoteHeaders(),
    });
    if (!response.ok) throw new Error(`Supabase load failed: ${response.status}`);

    const rows = await response.json();
    applySharedState(rows?.[0]?.data);
  } catch (error) {
    console.warn("Supabase sync load failed:", error);
  }
}

async function syncSharedState() {
  if (!hasRemoteSyncConfig()) return;
  const { rowId } = getSupabaseConfig();

  try {
    const response = await fetch(getSupabaseTableUrl(), {
      method: "POST",
      headers: getRemoteHeaders({ Prefer: "resolution=merge-duplicates" }),
      body: JSON.stringify({
        id: rowId,
        data: getSharedState(),
        updated_at: new Date().toISOString(),
      }),
    });
    if (!response.ok) throw new Error(`Supabase save failed: ${response.status}`);
  } catch (error) {
    console.warn("Supabase sync save failed:", error);
  }
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

function getIslandWishlistIds(island = state.currentIsland) {
  return state.wishlistByIsland[island] || new Set();
}

function getVillagerOwnedIslands(villagerId) {
  return Object.keys(ISLAND_LABELS).filter((island) => getIslandOwnedIds(island).has(villagerId));
}

function getVillagerWishlistIslands(villagerId) {
  return Object.keys(ISLAND_LABELS).filter((island) => getIslandWishlistIds(island).has(villagerId));
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


function getFilterValue(villager, filterName) {
  if (filterName === "personality") return villager.personality || "정보 없음";
  if (filterName === "species") return villager.species || "정보 없음";
  if (filterName === "gender") return villager.gender || "정보 없음";
  if (filterName === "amiiboSeries") return villager.amiiboSeries || "정보 없음";
  return "정보 없음";
}

function matchesFilters(villager) {
  return Object.entries(state.filters).every(([filterName, selected]) => {
    if (!selected) return true;
    return getFilterValue(villager, filterName) === selected;
  });
}

function populateFilterSelect(select, values, currentValue) {
  if (!select) return;
  const options = [new Option("전체", "")];
  values.forEach((value) => options.push(new Option(value, value)));
  select.replaceChildren(...options);
  select.value = values.includes(currentValue) ? currentValue : "";
}

function renderFilters() {
  const filters = [
    [els.personalityFilter, "personality"],
    [els.speciesFilter, "species"],
    [els.genderFilter, "gender"],
    [els.amiiboSeriesFilter, "amiiboSeries"],
  ];

  filters.forEach(([select, filterName]) => {
    const values = filterName === "amiiboSeries"
      ? ["1탄", "2탄", "3탄", "4탄", "5탄", "amiibo+", "산리오"]
      : [...new Set(state.villagers.map((villager) => getFilterValue(villager, filterName)).filter((value) => value && value !== "정보 없음"))]
        .sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));
    populateFilterSelect(select, values, state.filters[filterName]);
  });
}
function getSearchResults() {
  return state.villagers.filter((villager) => matchesQuery(villager) && matchesFilters(villager)).slice(0, 36);
}

function createOwnershipMarks(villagerId) {
  const marks = document.createElement("div");
  marks.className = "owner-marks";

  getVillagerOwnedIslands(villagerId).forEach((island) => {
    const mark = document.createElement("span");
    mark.className = `owner-mark resident-mark owner-mark-${island}`;
    mark.textContent = `${ISLAND_LABELS[island].replace(" 주민", "")} 주민`;
    mark.title = `${ISLAND_LABELS[island]} 등록됨`;
    marks.append(mark);
  });

  getVillagerWishlistIslands(villagerId).forEach((island) => {
    const mark = document.createElement("span");
    mark.className = `owner-mark wishlist-mark owner-mark-${island}`;
    mark.textContent = `${island === "kongboki" ? "콩보키" : "콩솔키"} 찜`;
    mark.title = `${ISLAND_LABELS[island]} 위시리스트`;
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


function getSelectedVillager() {
  return state.villagers.find((villager) => villager.id === state.selectedVillagerId);
}


function formatAmiibo(series, number) {
  if (!series || series === "정보 없음") return "정보 없음";
  return number && number !== "정보 없음" ? `${series} (${number})` : series;
}
function createDetailRow(label, value) {
  const row = document.createElement("div");
  const dt = document.createElement("dt");
  const dd = document.createElement("dd");
  dt.textContent = label;
  dd.textContent = value || "정보 없음";
  row.append(dt, dd);
  return row;
}

function openHouseModal(title, imageUrl) {
  if (!imageUrl || !els.houseImageModal) return;
  els.houseModalTitle.textContent = title;
  els.houseModalImage.src = imageUrl;
  els.houseModalImage.alt = title;
  els.houseImageModal.hidden = false;
}

function closeHouseModal() {
  if (!els.houseImageModal) return;
  els.houseImageModal.hidden = true;
  els.houseModalImage.removeAttribute("src");
}


function createItemImageCard(label, name, imageUrl) {
  const card = document.createElement("div");
  card.className = "villager-item-card";

  const title = document.createElement("strong");
  title.textContent = label;

  if (imageUrl) {
    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = `${name} 이미지`;
    image.loading = "lazy";
    image.addEventListener("error", () => {
      card.classList.add("is-missing");
      image.remove();
    });
    card.append(image);
  } else {
    card.classList.add("is-missing");
  }

  const caption = document.createElement("span");
  caption.textContent = name || "정보 없음";
  card.prepend(title);
  card.append(caption);
  return card;
}
function renderVillagerDetail(villager, loading = false) {
  els.villagerDetailRoot.replaceChildren();

  if (!villager) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "주민 정보를 찾지 못했습니다.";
    els.villagerDetailRoot.append(empty);
    return;
  }

  const article = document.createElement("article");
  article.className = "villager-detail-card";

  const backButton = document.createElement("button");
  backButton.className = "tour-back-button";
  backButton.type = "button";
  backButton.textContent = "← 목록";
  backButton.addEventListener("click", () => setView(state.previousView, state.currentIsland));

  const hero = document.createElement("div");
  hero.className = "villager-detail-hero";

  const imageWrap = document.createElement("div");
  imageWrap.className = "villager-detail-image-wrap";
  const image = document.createElement("img");
  image.className = "villager-detail-photo";
  image.src = villager.image;
  image.alt = `${villager.name} 주민 사진`;
  image.addEventListener("error", () => {
    image.src = fallbackImage;
  });
  imageWrap.append(image, createOwnershipMarks(villager.id));

  const titleBlock = document.createElement("div");
  const title = document.createElement("h2");
  title.id = "villager-detail-title";
  title.textContent = villager.englishName ? `${villager.name} (${villager.englishName})` : villager.name;
  const subtitle = document.createElement("p");
  subtitle.className = "villager-detail-subtitle";
  subtitle.textContent = loading ? "상세 정보를 불러오는 중입니다." : `${villager.personality} · ${villager.species || "정보 없음"}`;
  titleBlock.append(title, subtitle);
  hero.append(imageWrap, titleBlock);

  const summary = document.createElement("dl");
  summary.className = "villager-detail-list";
  [
    ["성격", villager.personality],
    ["성별", villager.gender],
    ["종족", villager.species],
    ["취미", villager.hobby],
    ["말투", villager.catchphrase],
    ["생일", villager.birthday],
    ["사회성", villager.sociality],
    ["좋아하는 노래", villager.favoriteSong],
    ["스타일", villager.style],
    ["색", villager.color],
    ["좌우명", villager.saying],
    ["amiibo 탄", formatAmiibo(villager.amiiboSeries, villager.amiiboNumber)],
  ].forEach(([label, value]) => summary.append(createDetailRow(label, value)));

  const itemImages = document.createElement("div");
  itemImages.className = "villager-item-grid";
  itemImages.append(
    createItemImageCard("기본 복장", villager.clothing, villager.clothingImage),
    createItemImageCard("기본 우산", villager.umbrella, villager.umbrellaImage),
  );

  const houseActions = document.createElement("div");
  houseActions.className = "house-action-row";
  const exteriorButton = document.createElement("button");
  exteriorButton.type = "button";
  exteriorButton.className = "house-image-button";
  exteriorButton.textContent = "집 외관";
  exteriorButton.disabled = !villager.houseExterior;
  exteriorButton.addEventListener("click", () => openHouseModal(`${villager.name} 집 외관`, villager.houseExterior));
  const interiorButton = document.createElement("button");
  interiorButton.type = "button";
  interiorButton.className = "house-image-button";
  interiorButton.textContent = "집 내관";
  interiorButton.disabled = !villager.houseInterior;
  interiorButton.addEventListener("click", () => openHouseModal(`${villager.name} 집 내관`, villager.houseInterior));
  houseActions.append(exteriorButton, interiorButton);

  article.append(backButton, hero, summary, itemImages, houseActions);
  els.villagerDetailRoot.append(article);
}

async function openVillagerDetail(villagerId) {
  const villager = state.villagers.find((item) => item.id === villagerId);
  if (!villager) return;
  state.previousView = state.currentView === "villager-detail" ? state.previousView : state.currentView;
  state.selectedVillagerId = villagerId;
  setView("villager-detail", state.currentIsland);
  renderVillagerDetail(villager, true);

  try {
    const detailedVillager = await fetchVillagerDetail(villager);
    const index = state.villagers.findIndex((item) => item.id === villagerId);
    if (index >= 0) state.villagers[index] = detailedVillager;
    if (state.selectedVillagerId === villagerId) renderVillagerDetail(detailedVillager);
  } catch (error) {
    console.warn("Villager detail load failed:", error);
    if (state.selectedVillagerId === villagerId) renderVillagerDetail(villager);
  }
}
function createVillagerCard(villager) {
  const fragment = els.template.content.cloneNode(true);
  const card = fragment.querySelector(".villager-card");
  const image = fragment.querySelector(".villager-image");
  const title = fragment.querySelector("h3");
  const button = fragment.querySelector(".add-button");
  const favoriteButton = document.createElement("button");
  const loginIsland = getLoginIsland();
  const loginIslandOwnedIds = loginIsland ? getIslandOwnedIds(loginIsland) : new Set();
  const loginWishlistIds = loginIsland ? getIslandWishlistIds(loginIsland) : new Set();
  const isOwnedByLogin = loginIslandOwnedIds.has(villager.id);
  const isWishlistedByLogin = loginWishlistIds.has(villager.id);
  const ownedIslands = getVillagerOwnedIslands(villager.id);

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

  if (ownedIslands.length) {
    card.classList.add("is-resident");
    ownedIslands.forEach((island) => card.classList.add(`is-resident-${island}`));
  }

  button.textContent = !loginIsland
    ? "로그인 필요"
    : isOwnedByLogin
      ? "섬 주민"
      : `${ISLAND_LABELS[loginIsland].replace(" 주민", "")}에 추가`;
  button.disabled = !loginIsland || isOwnedByLogin;

  favoriteButton.className = "favorite-button";
  favoriteButton.type = "button";
  favoriteButton.textContent = !loginIsland ? "찜 로그인" : isWishlistedByLogin ? "찜 해제" : "찜하기";
  favoriteButton.disabled = !loginIsland;
  button.after(favoriteButton);

  button.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!loginIsland) {
      openLoginModal();
      return;
    }
    getIslandOwnedIds(loginIsland).add(villager.id);
    getIslandWishlistIds(loginIsland).delete(villager.id);
    saveOwned();
    render();
  });

  favoriteButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!loginIsland) {
      openLoginModal();
      return;
    }
    const wishlistIds = getIslandWishlistIds(loginIsland);
    if (wishlistIds.has(villager.id)) {
      wishlistIds.delete(villager.id);
    } else {
      wishlistIds.add(villager.id);
    }
    saveOwned();
    render();
  });

  card.dataset.id = villager.id;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `${villager.name} 상세 보기`);
  card.addEventListener("click", () => openVillagerDetail(villager.id));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openVillagerDetail(villager.id);
    }
  });
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
    remove.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!editable) return;
      getIslandOwnedIds(island).delete(villager.id);
      saveOwned();
      render();
    });

    item.tabIndex = 0;
    item.setAttribute("role", "button");
    item.setAttribute("aria-label", `${villager.name} 상세 보기`);
    item.addEventListener("click", () => openVillagerDetail(villager.id));
    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openVillagerDetail(villager.id);
      }
    });

    item.append(portrait, meta, remove);
    fragment.append(item);
  });

  els.ownedVillagers.append(fragment);
}
function render() {
  els.dataStatus.textContent = "";
  els.dataStatus.hidden = true;
  renderFilters();
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
  setVillagers(applyKoreanSupplements(cached), "");
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

function setTipsMenuOpen(open) {
  if (!els.tipsToggleButton || !els.tipsSubmenu) return;
  els.tipsToggleButton.setAttribute("aria-expanded", open ? "true" : "false");
  els.tipsSubmenu.hidden = !open;
}

function isTipsView(view) {
  return view === "tips-mystery" || view === "tips-critter";
}

function setView(view, island = state.currentIsland) {
  if (view === "owned") view = "island";
  if (view !== "search" && view !== "island" && view !== "villager-detail" && view !== "app-info" && !isTipsView(view)) view = "search";

  if (view === "island" && ISLAND_LABELS[island]) {
    state.currentIsland = island;
  }

  state.currentView = view;
  els.searchView.hidden = view !== "search";
  els.ownedView.hidden = view !== "island";
  els.tipsMysteryView.hidden = view !== "tips-mystery";
  els.tipsCritterView.hidden = view !== "tips-critter";
  els.appInfoView.hidden = view !== "app-info";
  els.villagerDetailView.hidden = view !== "villager-detail";
  els.ownedTitle.textContent = ISLAND_LABELS[state.currentIsland];
  setTipsMenuOpen(isTipsView(view));

  els.sidebarLinks.forEach((link) => {
    const isActive = view === "villager-detail"
      ? false
      : view === "search"
      ? link.dataset.view === "search"
      : view === "island"
        ? link.dataset.view === "island" && link.dataset.island === state.currentIsland
        : link.dataset.view === view;
    link.classList.toggle("is-active", isActive);
  });

  const hash = view === "island" ? `#${state.currentIsland}` : view === "villager-detail" ? "#villager-detail" : `#${view}`;
  if (location.hash !== hash) {
    history.replaceState(null, "", hash);
  }

  if (view === "villager-detail") renderVillagerDetail(getSelectedVillager());
  renderOwned();
}

function readViewFromHash() {
  if (location.hash === "#kongsolki") {
    return { view: "island", island: "kongsolki" };
  }
  if (location.hash === "#kongboki" || location.hash === "#owned") {
    return { view: "island", island: "kongboki" };
  }
  if (location.hash === "#tips-mystery") {
    return { view: "tips-mystery", island: state.currentIsland };
  }
  if (location.hash === "#tips-critter") {
    return { view: "tips-critter", island: state.currentIsland };
  }
  if (location.hash === "#app-info") {
    return { view: "app-info", island: state.currentIsland };
  }
  if (location.hash === "#villager-detail" && state.selectedVillagerId) {
    return { view: "villager-detail", island: state.currentIsland };
  }
  return { view: "search", island: state.currentIsland };
}

async function fetchBaseVillagers() {
  const response = await fetch(BASE_DATA_API_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Base API failed: ${response.status}`);
  return applyKoreanSupplements(normalizeBaseVillagers(await response.json()));
}

async function fetchLocalVillagers() {
  const response = await fetch("./villagers.json", { cache: "no-store" });
  if (!response.ok) throw new Error("Local fallback response not ok");
  return applyKoreanSupplements(normalizeBaseVillagers(await response.json()));
}

async function loadVillagers() {
  if (loadCachedVillagers()) return;

  try {
    const baseVillagers = await fetchBaseVillagers();
    setVillagers(baseVillagers, "");

    const extraVillagers = await fetchExtraVillagers();
    const villagers = mergeVillagers(baseVillagers, extraVillagers);
    writeJson(DATA_CACHE_KEY, villagers);
    localStorage.setItem(DATA_CACHE_TIME_KEY, String(Date.now()));

    setVillagers(villagers, "");
  } catch (error) {
    console.error("External API load failed, trying local fallback:", error);
    try {
      const localVillagers = await fetchLocalVillagers();
      setVillagers(localVillagers, "");
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

[
  [els.personalityFilter, "personality"],
  [els.speciesFilter, "species"],
  [els.genderFilter, "gender"],
  [els.amiiboSeriesFilter, "amiiboSeries"],
].forEach(([select, filterName]) => {
  select?.addEventListener("change", (event) => {
    state.filters[filterName] = event.target.value;
    renderSearchResults();
  });
});

els.menuOpenButton.addEventListener("click", () => setMenuOpen(true));
els.menuCloseButton.addEventListener("click", () => setMenuOpen(false));
els.sidebarBackdrop.addEventListener("click", () => setMenuOpen(false));
els.tipsToggleButton?.addEventListener("click", () => {
  setTipsMenuOpen(els.tipsSubmenu.hidden);
});
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
els.houseModalCloseButton?.addEventListener("click", closeHouseModal);
els.houseImageModal?.addEventListener("click", (event) => {
  if (event.target === els.houseImageModal) closeHouseModal();
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
  loadWishlist();
  loadLogin();
  const route = readViewFromHash();
  setView(route.view, route.island);
  render();
  loadVillagers();
  loadRemoteSharedState();
}

init();