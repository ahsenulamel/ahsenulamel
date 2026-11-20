(function () {

  function initPrint() {

    document.querySelectorAll(".text-size").forEach(function (textSize) {

      textSize.innerHTML = `
        <label aria-label="Yazdır" class="size-label round-l pointer f post-print" style="cursor:pointer;" title="Yazdır">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M7 2h10v5H7V2zm13 6H4a2 2 0 0 0-2 2v8h5v4h10v-4h5v-8a2 2 0 0 0-2-2zm-5 12H9v-5h6v5zm4-8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        </label>
      `;

      textSize.querySelector(".post-print").addEventListener("click", function () {
        window.print();
      });

    });

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPrint);
  } else {
    initPrint();
  }

})();
