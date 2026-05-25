(function () {
  const SYMBOLS = ["BTC", "ETH", "XRP", "BNB", "SOL"];
  const OKX_IDS = {
    BTC: "BTC-USDT",
    ETH: "ETH-USDT",
    XRP: "XRP-USDT",
    BNB: "BNB-USDT",
    SOL: "SOL-USDT",
  };
  const BINANCE_IDS = {
    BTC: "BTCUSDT",
    ETH: "ETHUSDT",
    XRP: "XRPUSDT",
    BNB: "BNBUSDT",
    SOL: "SOLUSDT",
  };

  function formatPrice(symbol, value) {
    const n = parseFloat(value);
    if (Number.isNaN(n)) return "—";
    if (symbol === "XRP") return "$" + n.toFixed(4);
    if (n >= 1000) return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
    return "$" + n.toFixed(2);
  }

  function formatChange(pct) {
    const n = parseFloat(pct);
    if (Number.isNaN(n)) return { text: "—", cls: "" };
    const sign = n >= 0 ? "+" : "";
    return { text: sign + n.toFixed(2) + "%", cls: n >= 0 ? "up" : "down" };
  }

  async function fetchOkx() {
    const ids = Object.values(OKX_IDS).join(",");
    const res = await fetch(
      "https://www.okx.com/api/v5/market/tickers?instType=SPOT&instId=" + ids
    );
    const json = await res.json();
    const map = {};
    if (json.data) {
      json.data.forEach((t) => {
        const sym = t.instId.replace("-USDT", "");
        map[sym] = {
          price: t.last,
          change: (parseFloat(t.last) - parseFloat(t.open24h)) / parseFloat(t.open24h) * 100,
        };
      });
    }
    return map;
  }

  async function fetchBinance() {
    const map = {};
    await Promise.all(
      SYMBOLS.map(async (sym) => {
        try {
          const res = await fetch(
            "https://data-api.binance.vision/api/v3/ticker/24hr?symbol=" + BINANCE_IDS[sym]
          );
          const t = await res.json();
          map[sym] = {
            price: t.lastPrice,
            change: parseFloat(t.priceChangePercent),
          };
        } catch (_) {}
      })
    );
    return map;
  }

  async function refresh() {
    try {
      const [okx, binance] = await Promise.all([fetchOkx(), fetchBinance()]);
      document.querySelectorAll(".coin-card").forEach((card) => {
        const sym = card.dataset.symbol;
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
        const priceEl = card.querySelector(".coin-price");
        const changeEl = card.querySelector(".coin-change");
        if (priceEl) priceEl.textContent = formatPrice(sym, price);
        if (changeEl) {
          const ch = formatChange(change);
          changeEl.textContent = ch.text + " 24h";
          changeEl.className = "coin-change " + ch.cls;
        }
      });
    } catch (_) {}
  }

  if (document.getElementById("coin-grid")) {
    refresh();
    setInterval(refresh, 60000);
  }
})();
