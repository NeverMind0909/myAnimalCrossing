(() => {
  const root = document.querySelector("#turnipRoot");
  if (!root) return;

  const STORAGE_KEY = "acnh-turnip-predictor-v1";
  const priceSlots = [
    ["mon-am", "월 오전", 2, 1, "am"],
    ["mon-pm", "월 오후", 3, 1, "pm"],
    ["tue-am", "화 오전", 4, 2, "am"],
    ["tue-pm", "화 오후", 5, 2, "pm"],
    ["wed-am", "수 오전", 6, 3, "am"],
    ["wed-pm", "수 오후", 7, 3, "pm"],
    ["thu-am", "목 오전", 8, 4, "am"],
    ["thu-pm", "목 오후", 9, 4, "pm"],
    ["fri-am", "금 오전", 10, 5, "am"],
    ["fri-pm", "금 오후", 11, 5, "pm"],
    ["sat-am", "토 오전", 12, 6, "am"],
    ["sat-pm", "토 오후", 13, 6, "pm"],
  ];
  const patternLabels = {
    0: "파도형",
    1: "대박형",
    2: "하락형",
    3: "소폭 상승형",
    4: "전체 범위",
  };

  const state = readState();

  function readState() {
    const fallback = { buyPrice: "", previousPattern: "", firstBuy: false, prices: {} };
    try {
      return { ...fallback, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
    } catch (error) {
      return fallback;
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : NaN;
  }

  function formatPriceRange(price) {
    if (!price) return "-";
    return price.min === price.max ? `${price.min}벨` : `${price.min}~${price.max}벨`;
  }

  function formatPercent(value) {
    return `${Math.round((Number(value) || 0) * 100)}%`;
  }

  function getCurrentSlotKey() {
    const now = new Date();
    const day = now.getDay();
    if (day === 0) return "buy";
    if (day < 1 || day > 6) return "";
    const period = now.getHours() < 12 ? "am" : "pm";
    return priceSlots.find(([, , , slotDay, slotPeriod]) => slotDay === day && slotPeriod === period)?.[0] || "";
  }

  function getInputPrices() {
    const buyPrice = toNumber(state.buyPrice);
    const prices = Array(14).fill(NaN);
    prices[0] = buyPrice;
    prices[1] = buyPrice;
    priceSlots.forEach(([key, , index]) => {
      prices[index] = toNumber(state.prices[key]);
    });
    return prices;
  }

  function analyze() {
    if (!window.TurnipPredictor) return { error: "예측 엔진을 불러오지 못했습니다." };
    const buyPrice = toNumber(state.buyPrice);
    if (!buyPrice) return { error: "일요일 구매가를 입력해 주세요." };
    if (buyPrice < 90 || buyPrice > 110) return { error: "구매가는 보통 90~110벨 범위입니다." };

    try {
      const previousPattern = state.previousPattern === "" ? null : Number(state.previousPattern);
      const predictor = new window.TurnipPredictor(getInputPrices(), Boolean(state.firstBuy), previousPattern);
      const possibilities = predictor.analyze_possibilities();
      if (!possibilities.length) return { error: "입력값과 맞는 패턴을 찾지 못했습니다." };
      return { possibilities };
    } catch (error) {
      console.error("Turnip prediction failed:", error);
      return { error: "예측 중 오류가 발생했습니다." };
    }
  }

  function updateResult() {
    const resultRoot = root.querySelector("#turnipResultRoot");
    if (!resultRoot) return;
    resultRoot.replaceChildren(renderResult(analyze()));
  }

  function createField(label, input, options = {}) {
    const field = document.createElement("label");
    field.className = `turnip-field${options.current ? " is-current-slot" : ""}`;
    const span = document.createElement("span");
    span.textContent = label;
    field.append(span, input);
    return field;
  }

  function createNumberInput(value, onInput, options = {}) {
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.inputMode = "numeric";
    input.value = value || "";
    if (options.focusKey) input.dataset.focusKey = options.focusKey;
    input.addEventListener("input", (event) => {
      onInput(event.target.value);
      saveState();
      updateResult();
    });
    return input;
  }

  function getMostLikelyPattern() {
    const result = analyze();
    if (result.error || !result.possibilities?.length) return null;
    return result.possibilities
      .slice(1)
      .filter((item) => item.pattern_number >= 0 && item.pattern_number <= 3)
      .sort((a, b) => b.category_total_probability - a.category_total_probability || b.probability - a.probability)[0] || null;
  }

  function resetInputs() {
    const likelyPattern = getMostLikelyPattern();
    const shouldCarryPattern = likelyPattern
      ? window.confirm(`현재 예측상 가장 가능성이 높은 패턴은 ${patternLabels[likelyPattern.pattern_number]}입니다.\n초기화하면서 지난주 패턴으로 저장할까요?`)
      : false;

    state.buyPrice = "";
    state.previousPattern = shouldCarryPattern ? String(likelyPattern.pattern_number) : "";
    state.firstBuy = false;
    state.prices = {};
    saveState();
    render();
  }
  function renderHeaderAction() {
    const heading = document.querySelector("#turnip-title")?.parentElement;
    if (!heading || heading.querySelector(".turnip-header-reset-button")) return;
    const resetButton = document.createElement("button");
    resetButton.className = "turnip-header-reset-button";
    resetButton.type = "button";
    resetButton.setAttribute("aria-label", "무값 입력 초기화");
    resetButton.title = "초기화";
    resetButton.textContent = "↻";
    resetButton.addEventListener("click", resetInputs);
    heading.append(resetButton);
  }

  function renderControls() {
    const controls = document.createElement("div");
    controls.className = "turnip-controls";
    const currentSlotKey = getCurrentSlotKey();

    const buyInput = createNumberInput(state.buyPrice, (value) => {
      state.buyPrice = value;
    }, { focusKey: "buy" });
    buyInput.placeholder = "예: 95";
    controls.append(createField("일요일 구매가", buyInput, { current: currentSlotKey === "buy" }));

    const patternSelect = document.createElement("select");
    [["", "모름"], ["0", "지난주 파도형"], ["1", "지난주 대박형"], ["2", "지난주 하락형"], ["3", "지난주 소폭 상승형"]]
      .forEach(([value, label]) => patternSelect.append(new Option(label, value)));
    patternSelect.value = state.previousPattern;
    patternSelect.addEventListener("change", (event) => {
      state.previousPattern = event.target.value;
      saveState();
      updateResult();
    });
    controls.append(createField("지난주 패턴", patternSelect));

    const firstBuy = document.createElement("label");
    firstBuy.className = "turnip-check-field";
    const firstBuyInput = document.createElement("input");
    firstBuyInput.type = "checkbox";
    firstBuyInput.checked = Boolean(state.firstBuy);
    firstBuyInput.addEventListener("change", (event) => {
      state.firstBuy = event.target.checked;
      saveState();
      updateResult();
    });
    const firstBuyText = document.createElement("span");
    firstBuyText.textContent = "이번 주가 첫 무 구매";
    firstBuy.append(firstBuyInput, firstBuyText);
    controls.append(firstBuy);

    return controls;
  }

  function renderPriceInputs() {
    const group = document.createElement("div");
    group.className = "turnip-price-grid";
    const currentSlotKey = getCurrentSlotKey();
    priceSlots.forEach(([key, label]) => {
      const input = createNumberInput(state.prices[key], (value) => {
        state.prices[key] = value;
      }, { focusKey: key });
      group.append(createField(label, input, { current: key === currentSlotKey }));
    });
    return group;
  }

  function getBestSlot(global) {
    const future = priceSlots
      .map(([key, label, index]) => ({ key, label, index, price: global.prices[index] }))
      .filter((slot) => slot.price && slot.price.min !== slot.price.max);
    const target = future.length ? future : priceSlots.map(([key, label, index]) => ({ key, label, index, price: global.prices[index] }));
    return target.sort((a, b) => b.price.max - a.price.max || b.price.min - a.price.min)[0];
  }

  function renderResult(result) {
    const wrap = document.createElement("div");
    wrap.className = "turnip-result";

    if (result.error) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = result.error;
      wrap.append(empty);
      return wrap;
    }

    const [global, ...patterns] = result.possibilities;
    const best = getBestSlot(global);
    const summary = document.createElement("div");
    summary.className = "turnip-summary-card";
    summary.innerHTML = `<span>최고 예상</span><strong>${best.label} ${formatPriceRange(best.price)}</strong><p>이번 주 최고 가능 범위는 ${global.weekMax}벨입니다.</p>`;
    wrap.append(summary);

    const patternGrid = document.createElement("div");
    patternGrid.className = "turnip-pattern-grid";
    [0, 1, 2, 3].forEach((pattern) => {
      const probability = patterns.find((item) => item.pattern_number === pattern)?.category_total_probability || 0;
      const chip = document.createElement("span");
      chip.textContent = `${patternLabels[pattern]} ${formatPercent(probability)}`;
      patternGrid.append(chip);
    });
    wrap.append(patternGrid);

    const table = document.createElement("div");
    table.className = "turnip-result-table";
    priceSlots.forEach(([, label, index]) => {
      const row = document.createElement("div");
      row.className = best.index === index ? "is-best" : "";
      const name = document.createElement("span");
      name.textContent = label;
      const value = document.createElement("strong");
      value.textContent = formatPriceRange(global.prices[index]);
      row.append(name, value);
      table.append(row);
    });
    wrap.append(table);
    return wrap;
  }

  function renderSource() {
    const source = document.createElement("p");
    source.className = "turnip-source-note";
    source.innerHTML = '예측 엔진 출처: <a href="https://github.com/mikebryant/ac-nh-turnip-prices" target="_blank" rel="noopener noreferrer">Turnip Prophet</a> / Apache-2.0';
    return source;
  }

  function focusCurrentSlot() {
    const key = getCurrentSlotKey();
    if (!key) return;
    const input = root.querySelector(`[data-focus-key="${key}"]`);
    if (!input) return;
    setTimeout(() => input.focus({ preventScroll: true }), 0);
  }

  function render() {
    const resultRoot = document.createElement("div");
    resultRoot.id = "turnipResultRoot";
    resultRoot.append(renderResult(analyze()));

    const fragment = document.createDocumentFragment();
    fragment.append(renderControls(), renderPriceInputs(), resultRoot, renderSource());
    root.replaceChildren(fragment);
    focusCurrentSlot();
  }

  window.addEventListener("turnip:view", focusCurrentSlot);

  renderHeaderAction();
  render();
})();