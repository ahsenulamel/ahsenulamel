(function () {

  function initPrint() {

    document.querySelectorAll(".text-size").forEach(function (textSize) {

      textSize.innerHTML = `
        <label aria-label="Yazdır" class="size-label round-l pointer f post-print" style="cursor:pointer;" title="Yazdır">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M19 8H5c-1.1 0-2 .9-2 2v6h4v4h10v-4h4v-6c0-1.1-.9-2-2-2zm-4 10H9v-5h6v5zm4-11H5V3h14v4zm0 7.5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1z"/>
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
