
(function () {
  "use strict";

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkcEcw1y0bM3GCZtlK8Hq4HnvGR_mYyQ5dkFhTj2avYz1bzmc0nYvrGe0OfhkbgGA4woVsXWZnWRKy/pub?gid=1594493235&single=true&output=csv";

  const CACHE_KEY = "ahsen_hadis_cache_v1";
  const CACHE_TIME = 24 * 60 * 60 * 1000;

  function csvParse(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i++;
        row.push(cell);
        if (row.some(value => value.trim() !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    row.push(cell);
    if (row.some(value => value.trim() !== "")) rows.push(row);

    return rows;
  }

  function parseHadisler(csv) {
    const rows = csvParse(csv.replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new Error("Hadis verisi bulunamadı.");

    const headers = rows[0].map(h => h.trim().toLowerCase());

    const siraIndex = headers.indexOf("sıra");
    const metinIndex = headers.indexOf("metin");
    const kaynakIndex = headers.indexOf("kaynak");

    if (siraIndex < 0 || metinIndex < 0 || kaynakIndex < 0) {
      throw new Error("Hadis CSV sütunları eksik.");
    }

    return rows.slice(1)
      .map(row => ({
        sira: Number(row[siraIndex]),
        metin: (row[metinIndex] || "").trim(),
        kaynak: (row[kaynakIndex] || "").trim()
      }))
      .filter(item => item.metin && item.kaynak)
      .sort((a, b) => a.sira - b.sira);
  }

  function getCache() {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const data = JSON.parse(cached);

      if (
        !data.time ||
        !Array.isArray(data.hadisler) ||
        !data.hadisler.length
      ) return null;

      return data;
    } catch (error) {
      return null;
    }
  }

  function saveCache(hadisler) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        hadisler: hadisler
      }));
    } catch (error) {
      // Önbellek kaydedilemese de uygulama çalışmaya devam eder.
    }
  }

  async function getHadisler() {
    const cached = getCache();
    const cacheValid =
      cached && Date.now() - cached.time < CACHE_TIME;

    if (cacheValid) return cached.hadisler;

    try {
      const response = await fetch(CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Hadis verisi alınamadı.");

      const buffer = await response.arrayBuffer();
      const csv = new TextDecoder("utf-8").decode(buffer);
      const hadisler = parseHadisler(csv);

      if (!hadisler.length) throw new Error("Hadis listesi boş.");

      saveCache(hadisler);
      return hadisler;

    } catch (error) {
      if (cached && cached.hadisler.length) return cached.hadisler;
      throw error;
    }
  }

  function gununHadisiniGoster(hadisler) {
    const textElement = document.getElementById("ignielHadisText");
    const refElement = document.getElementById("ignielHadisRef");

    if (!textElement || !refElement || !hadisler.length) return;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayNo = Math.floor((now - start) / 86400000);
    const index = (dayNo - 1) % hadisler.length;

    const secilenHadis = hadisler[index];

    textElement.textContent = secilenHadis.metin;
    refElement.textContent = secilenHadis.kaynak;
  }

  async function init() {
    try {
      const hadisler = await getHadisler();
      gununHadisiniGoster(hadisler);
    } catch (error) {
      console.error("Günün Hadisi yüklenemedi:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
