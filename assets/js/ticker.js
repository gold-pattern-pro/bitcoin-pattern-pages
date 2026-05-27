(function () {
  const SYMBOLS = ["BTC", "ETH", "BNB", "SOL", "XRP", "DOGE", "ADA", "TRX", "AVAX", "LINK"];

  function readEmbeddedSnapshot() {
    const el = document.getElementById("quote-snapshot");
    if (!el || !el.textContent) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (_) {
      return null;
    }
  }

  function snapshotToMaps(snapshot) {
    const okx = {};
    const binance = {};
    const quotes = snapshot && snapshot.quotes ? snapshot.quotes : {};
    for (const sym of SYMBOLS) {
      const q = quotes[sym];
      if (!q) continue;
      const row = { price: q.price, change: q.change_pct };
      okx[sym] = row;
      binance[sym] = row;
    }
    return { okx, binance };
  }

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
    let price = o?.price ?? b?.price;
    let change = o?.change ?? b?.change;
    if (o?.price && b?.price) {
      price = (parseFloat(o.price) + parseFloat(b.price)) / 2;
    }
    if (o?.change != null && b?.change != null) {
      change = (o.change + b.change) / 2;
    }
    return { price, change };
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
      if (price == null) return null;
      return buildTickerItem(sym, price, change);
    }).filter(Boolean);

    if (!items.length) return;

    track.replaceChildren();
    items.forEach((el) => track.appendChild(el.cloneNode(true)));
    items.forEach((el) => track.appendChild(el.cloneNode(true)));
  }

  function renderCoinGrid(okx, binance) {
    document.querySelectorAll(".coin-card").forEach((card) => {
      const sym = card.dataset.symbol;
      if (!sym) return;
      const { price, change } = blendQuote(sym, okx, binance);
      if (price == null) return;
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

  function refreshFromSnapshot() {
    const snapshot = readEmbeddedSnapshot();
    if (!snapshot || !snapshot.quotes) return false;
    const { okx, binance } = snapshotToMaps(snapshot);
    renderTicker(okx, binance);
    renderCoinGrid(okx, binance);
    return true;
  }

  if (
    document.getElementById("ticker-track") ||
    document.getElementById("coin-grid") ||
    document.getElementById("sidebar-coin-grid")
  ) {
    refreshFromSnapshot();
  }
})();
