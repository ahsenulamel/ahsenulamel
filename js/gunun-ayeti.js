
(function () {
  "use strict";

  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkcEcw1y0bM3GCZtlK8Hq4HnvGR_mYyQ5dkFhTj2avYz1bzmc0nYvrGe0OfhkbgGA4woVsXWZnWRKy/pub?gid=1274198704&single=true&output=csv";

  const CACHE_KEY = "ahsen_ayet_cache_v1";
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

  function parseAyetler(csv) {
    const rows = csvParse(csv.replace(/^\uFEFF/, ""));
    if (rows.length < 2) throw new Error("Ayet verisi bulunamadı.");

    const headers = rows[0].map(h => h.trim().toLowerCase());

    const siraIndex = headers.indexOf("sıra");
    const metinIndex = headers.indexOf("metin");
    const kaynakIndex = headers.indexOf("kaynak");

    if (siraIndex < 0 || metinIndex < 0 || kaynakIndex < 0) {
      throw new Error("Ayet CSV sütunları eksik.");
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
        !Array.isArray(data.ayetler) ||
        !data.ayetler.length
      ) return null;

      return data;
    } catch (error) {
      return null;
    }
  }

  function saveCache(ayetler) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        time: Date.now(),
        ayetler: ayetler
      }));
    } catch (error) {
      // Önbellek kaydedilemese de uygulama çalışmaya devam eder.
    }
  }

  async function getAyetler() {
    const cached = getCache();
    const cacheValid =
      cached && Date.now() - cached.time < CACHE_TIME;

    if (cacheValid) return cached.ayetler;

    try {
      const response = await fetch(CSV_URL, { cache: "no-store" });
      if (!response.ok) throw new Error("Ayet verisi alınamadı.");

      const buffer = await response.arrayBuffer();
      const csv = new TextDecoder("utf-8").decode(buffer);
      const ayetler = parseAyetler(csv);

      if (!ayetler.length) throw new Error("Ayet listesi boş.");

      saveCache(ayetler);
      return ayetler;

    } catch (error) {
      if (cached && cached.ayetler.length) return cached.ayetler;
      throw error;
    }
  }

  function gununAyetiniGoster(ayetler) {
    const textElement = document.getElementById("ignielAyetText");
    const refElement = document.getElementById("ignielAyetRef");

    if (!textElement || !refElement || !ayetler.length) return;

    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayNo = Math.floor((now - start) / 86400000);
    const index = (dayNo - 1) % ayetler.length;

    const secilenAyet = ayetler[index];

    textElement.textContent = secilenAyet.metin;
    refElement.textContent = secilenAyet.kaynak;
  }

  async function init() {
    try {
      const ayetler = await getAyetler();
      gununAyetiniGoster(ayetler);
    } catch (error) {
      console.error("Günün Ayeti yüklenemedi:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
