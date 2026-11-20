(function () {

  function initBillboard() {

    const textEl = document.getElementById("billboard-text");
    if (!textEl) return;

    const texts = [
      "Hâlıkınız bir...",
      "Mâlikiniz bir....",
      "Peygamberiniz bir...",
      "Dininiz bir...",
      "Kitabınız bir...",
      "Kıbleniz bir...",
      "Mü'minler ancak kardeştir!"
    ];

    let index = 0;

    function showNext() {

      textEl.classList.remove("show");

      setTimeout(function () {

        textEl.textContent = texts[index];
        textEl.classList.add("show");

        const delay =
          texts[index] === "Mü'minler ancak kardeştir!"
            ? 4000
            : 2000;

        index = (index + 1) % texts.length;

        setTimeout(showNext, delay);

      }, 1000);
    }

    showNext();

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBillboard);
  } else {
    initBillboard();
  }

})();
