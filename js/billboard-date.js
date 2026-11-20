(function () {

  function initBillboardDate() {

    document.querySelectorAll("[data-billboard-date]").forEach(function (target) {

      const today = new Date();

      // Miladi tarih
      const miladi = today.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      // Hicri tarih
      const hijriFormatter = new Intl.DateTimeFormat(
        "ar-SA-u-ca-islamic-umalqura-nu-latn",
        {
          day: "numeric",
          month: "numeric",
          year: "numeric"
        }
      );

      const parts = hijriFormatter.formatToParts(today);

      const hDay = parts.find(p => p.type === "day")?.value;
      const hMonth = Number(parts.find(p => p.type === "month")?.value);
      const hYear = parts.find(p => p.type === "year")?.value;

      const hicriMonths = [
        "Muharrem", "Safer", "Rebiülevvel", "Rebiülahir",
        "Cemaziyelevvel", "Cemaziyelahir", "Receb", "Şaban",
        "Ramazan", "Şevval", "Zilkade", "Zilhicce"
      ];

      if (hDay && hMonth >= 1 && hMonth <= 12 && hYear) {
        target.textContent =
          miladi + " / " + hDay + " " +
          hicriMonths[hMonth - 1] + " " + hYear;
      } else {
        target.textContent = miladi;
      }

    });

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBillboardDate);
  } else {
    initBillboardDate();
  }

})();
