(() => {
  const data = window.ACNH_TOUR_TIPS;
  if (!data) return;

  const els = {
    root: document.querySelector("#tourTipsRoot"),
    modal: document.querySelector("#tourInfoModal"),
    modalTitle: document.querySelector("#tourModalTitle"),
    modalBody: document.querySelector("#tourModalBody"),
    modalCloseButton: document.querySelector("#tourModalCloseButton"),
  };

  if (!els.root) return;


  const fallbackImages = {
    "normal-1": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%200%20NH.jpg",
    "normal-2": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%201%20NH.jpg",
    spiral: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%202%20NH.jpg",
    "fidget-spinner": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%204%20NH.jpg",
    mountain: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%206%20NH.jpg",
    "money-rock-1": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%207%20NH.jpg",
    bamboo: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%208%20NH.jpg",
    fruit: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2010%20NH.jpg",
    flower: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2011%20NH.jpg",
    "money-rock-2": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2012%20NH.jpg",
    tarantula: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2013%20NH.jpg",
    "tree-1": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2014%20NH.jpg",
    "big-fish-1": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2016%20NH.jpg",
    "tree-2": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2017%20NH.jpg",
    "curly-river": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2018%20NH.jpg",
    "big-fish-2": "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2019%20NH.jpg",
    trash: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2020%20NH.jpg",
    fins: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2021%20NH.jpg",
    falls: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2023%20NH.jpg",
    gold: "https://nookipedia.com/wiki/Special:Redirect/file/Mystery%20Island%2024%20NH.jpg",
  };
  const labels = {
    chance: "확률",
    trees: "나무",
    rocks: "바위",
    bugs: "곤충",
    fish: "물고기",
    dailyLimit: "일일제한 여부",
    requires: "요구사항 여부",
  };

  function createButton(className, text) {
    const button = document.createElement("button");
    button.className = className;
    button.type = "button";
    button.textContent = text;
    return button;
  }

  function openInfoModal(tour) {
    els.modalTitle.textContent = tour.title;
    els.modalBody.replaceChildren();

    if (tour.info.length) {
      const list = document.createElement("ul");
      list.className = "tour-modal-list";
      tour.info.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.append(li);
      });
      els.modalBody.append(list);
    } else {
      const empty = document.createElement("p");
      empty.className = "tour-empty-text";
      empty.textContent = "아직 정리 중입니다.";
      els.modalBody.append(empty);
    }

    els.modal.hidden = false;
  }

  function closeModal() {
    els.modal.hidden = true;
  }

  function createInfoHeading(tour) {
    const heading = document.createElement("div");
    heading.className = "tour-list-heading";

    const title = document.createElement("h3");
    title.textContent = tour.title;

    const button = createButton("info-icon-button", "i");
    button.setAttribute("aria-label", `${tour.title} 설명 보기`);
    button.addEventListener("click", () => openInfoModal(tour));

    heading.append(title, button);
    return heading;
  }

  function createSourceLinks(tour) {
    const links = document.createElement("div");
    links.className = "source-links";
    tour.sourceLinks.forEach((source) => {
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = source.label;
      links.append(link);
    });
    return links;
  }

  function getDisplayName(island) {
    return island.koreanName || island.name;
  }


  function applyImageFallback(image, island) {
    const fallback = fallbackImages[island.id];
    if (!fallback) return;
    image.addEventListener("error", () => {
      if (image.src !== fallback) image.src = fallback;
    }, { once: true });
  }
  function createIslandCard(island, tour, panel) {
    const card = createButton("island-type-card", "");
    card.setAttribute("aria-label", `${getDisplayName(island)} 상세 보기`);

    const image = document.createElement("img");
    image.src = island.image;
    image.alt = `${getDisplayName(island)} 지도`;
    image.loading = "lazy";
    applyImageFallback(image, island);

    const title = document.createElement("h3");
    title.textContent = getDisplayName(island);

    card.append(image, title);
    card.addEventListener("click", () => renderDetail(panel, tour, island));
    return card;
  }

  function createDetailList(island) {
    const list = document.createElement("dl");
    list.className = "tour-detail-list";

    Object.entries(labels).forEach(([key, label]) => {
      const row = document.createElement("div");
      const dt = document.createElement("dt");
      const dd = document.createElement("dd");
      dt.textContent = label;
      dd.textContent = island.detail?.[key] || "-";
      row.append(dt, dd);
      list.append(row);
    });

    return list;
  }

  function renderDetail(panel, tour, island) {
    panel.replaceChildren();

    const detail = document.createElement("article");
    detail.className = "tour-detail-view";

    const backButton = createButton("tour-back-button", "← 목록");
    backButton.addEventListener("click", () => renderList(panel, tour));

    const title = document.createElement("h3");
    title.textContent = getDisplayName(island);

    const subtitle = document.createElement("p");
    subtitle.className = "tour-detail-subtitle";
    subtitle.textContent = island.name;

    const image = document.createElement("img");
    image.className = "tour-detail-image";
    image.src = island.image;
    image.alt = `${getDisplayName(island)} 지도`;
    applyImageFallback(image, island);

    detail.append(backButton, title, subtitle, image, createDetailList(island), createSourceLinks(tour));
    panel.append(detail);
  }

  function renderList(panel, tour) {
    panel.replaceChildren();
    panel.append(createInfoHeading(tour));

    if (tour.islands.length) {
      const grid = document.createElement("div");
      grid.className = "island-card-grid";
      tour.islands.forEach((island) => grid.append(createIslandCard(island, tour, panel)));
      panel.append(grid);
    } else {
      const empty = document.createElement("p");
      empty.className = "tour-empty-text";
      empty.textContent = "갑돌섬 정보는 다음 단계에서 위키 기준으로 정리할 예정입니다.";
      panel.append(empty);
    }

    panel.append(createSourceLinks(tour));
  }

  function createPanel(key, tour, active) {
    const panel = document.createElement("div");
    panel.className = `tip-tab-panel${active ? " is-active" : ""}`;
    panel.dataset.tipPanel = key;
    panel.hidden = !active;
    renderList(panel, tour);
    return panel;
  }

  function setTab(tab) {
    els.root.querySelectorAll(".tip-tab").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tipTab === tab);
    });
    els.root.querySelectorAll(".tip-tab-panel").forEach((panel) => {
      const active = panel.dataset.tipPanel === tab;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
  }

  function render() {
    const tabs = document.createElement("div");
    tabs.className = "tip-tabs";
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "섬 투어 종류");

    Object.entries(data).forEach(([key, tour], index) => {
      const button = createButton(`tip-tab${index === 0 ? " is-active" : ""}`, tour.label);
      button.dataset.tipTab = key;
      button.addEventListener("click", () => setTab(key));
      tabs.append(button);
    });

    const fragment = document.createDocumentFragment();
    fragment.append(tabs);
    Object.entries(data).forEach(([key, tour], index) => {
      fragment.append(createPanel(key, tour, index === 0));
    });

    els.root.replaceChildren(fragment);
  }

  els.modalCloseButton?.addEventListener("click", closeModal);
  els.modal?.addEventListener("click", (event) => {
    if (event.target === els.modal) closeModal();
  });

  render();
})();


