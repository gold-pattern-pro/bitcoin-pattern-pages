(function () {
  // Top-10 crypto by market cap (USDT spot pairs on OKX / Binance)
  const SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX", "AVAX", "LINK"];
  const ARTICLE_SYMBOLS = ["BTC", "ETH", "XRP", "BNB", "SOL"];

  const OKX_IDS = {
    BTC: "BTC-USDT",
    ETH: "ETH-USDT",
    BNB: "BNB-USDT",
    SOL: "SOL-USDT",
    XRP: "XRP-USDT",
    DOGE: "DOGE-USDT",
    ADA: "ADA-USDT",
    TRX: "TRX-USDT",
    AVAX: "AVAX-USDT",
    LINK: "LINK-USDT",
  };
  const BINANCE_IDS = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    BNB: "BNBUSDT",
    SOL: "SOLUSDT",
    XRP: "XRPUSDT",
    DOGE: "DOGEUSDT",
    ADA: "ADAUSDT",
    TRX: "TRXUSDT",
    AVAX: "AVAXUSDT",
    LINK: "LINKUSDT",
  };
  const BINANCE_BASES = [
    "https://data-api.binance.vision",
    "https://api1.binance.com",
    "https://api2.binance.com",
  ];

  function formatPrice(symbol, value) {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return "—";
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
    if (n >= 1) return "$" + n.toFixed(2);
    if (n >= 0.01) return "$" + n.toFixed(4);
    return "$" + n.toFixed(6);
  }

  function formatChange(pct) {
    const n = parseFloat(pct);
    if (Number.isNaN(n)) return { text: "—", cls: "" };
    const sign = n >= 0 ? "+" : "";
    return { text: sign + n.toFixed(2) + "%", cls: n >= 0 ? "up" : "down" };
  }

  function blendQuote(sym, okx, binance) {
    const o = okx[sym];
    const b = binance[sym];
    let price = o?.price || b?.price;
    let change = o?.change ?? b?.change;
    if (o?.price && b?.price) {
      price = ((parseFloat(o.price) + parseFloat(b.price)) / 2).toString();
    }
    if (o?.change != null && b?.change != null) {
      change = (o.change + b.change) / 2;
    }
    return { price, change };
  }

  async function fetchOkxSymbol(sym) {
    try {
      const res = await fetch(
        "https://www.okx.com/api/v5/market/ticker?instId=" + OKX_IDS[sym]
      );
      const json = await res.json();
      const t = json.data?.[0];
      if (!t) return null;
      const open24 = parseFloat(t.open24h) || parseFloat(t.last);
      return {
        price: t.last,
        change: ((parseFloat(t.last) - open24) / open24) * 100,
      };
    } catch (_) {
      return null;
    }
  }

  async function fetchOkx() {
    const map = {};
    await Promise.all(
      SYMBOLS.map(async (sym) => {
        const q = await fetchOkxSymbol(sym);
        if (q) map[sym] = q;
      })
    );
    return map;
  }

  async function fetchBinanceSymbol(sym) {
    for (const base of BINANCE_BASES) {
      try {
        const res = await fetch(base + "/api/v3/ticker/24hr?symbol=" + BINANCE_IDS[sym]);
        if (!res.ok) continue;
        const t = await res.json();
        return {
          price: t.lastPrice,
          change: parseFloat(t.priceChangePercent),
        };
      } catch (_) {}
    }
    return null;
  }

  async function fetchBinance() {
    const map = {};
    await Promise.all(
      SYMBOLS.map(async (sym) => {
        const q = await fetchBinanceSymbol(sym);
        if (q) map[sym] = q;
      })
    );
    return map;
  }

  function buildTickerItem(sym, price, change) {
    const ch = formatChange(change);
    const span = document.createElement("span");
    span.className = "ticker-item";
    span.innerHTML =
      '<strong class="ticker-sym">' +
      sym +
      "</strong> " +
      '<span class="ticker-price">' +
      formatPrice(sym, price) +
      "</span> " +
      '<span class="ticker-chg ' +
      ch.cls +
      '">' +
      ch.text +
      "</span>";
    return span;
  }

  function renderTicker(okx, binance) {
    const track = document.getElementById("ticker-track");
    if (!track) return;

    const items = SYMBOLS.map((sym) => {
      const { price, change } = blendQuote(sym, okx, binance);
      return buildTickerItem(sym, price, change);
    }).filter(Boolean);

    if (!items.length) return;

    track.replaceChildren();
    // Two identical sets for seamless -50% loop
    items.forEach((el) => track.appendChild(el.cloneNode(true)));
    items.forEach((el) => track.appendChild(el.cloneNode(true)));
  }

  function renderCoinGrid(okx, binance) {
    document.querySelectorAll(".coin-card").forEach((card) => {
      const sym = card.dataset.symbol;
      if (!ARTICLE_SYMBOLS.includes(sym)) return;
      const { price, change } = blendQuote(sym, okx, binance);
      const priceEl = card.querySelector(".coin-price");
      const changeEl = card.querySelector(".coin-change");
      if (priceEl) priceEl.textContent = formatPrice(sym, price);
      if (changeEl) {
        const ch = formatChange(change);
        changeEl.textContent = ch.text + " 24h";
        changeEl.className = "coin-change " + ch.cls;
      }
    });
  }

  async function refresh() {
    try {
      const [okx, binance] = await Promise.all([fetchOkx(), fetchBinance()]);
      renderTicker(okx, binance);
      renderCoinGrid(okx, binance);
    } catch (_) {
      const track = document.getElementById("ticker-track");
      if (track && track.querySelector(".ticker-loading")) {
        track.innerHTML = '<span class="ticker-item ticker-loading">Quotes unavailable</span>';
      }
    }
  }

  if (document.getElementById("ticker-track") || document.getElementById("coin-grid")) {
    refresh();
    setInterval(refresh, 30000);
  }
})();
