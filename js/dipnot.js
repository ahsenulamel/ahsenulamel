
(function () {

    function baslat() {

    /* AYARLAR */

    var dipnotURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkcEcw1y0bM3GCZtlK8Hq4HnvGR_mYyQ5dkFhTj2avYz1bzmc0nYvrGe0OfhkbgGA4woVsXWZnWRKy/pub?gid=263142270&single=true&output=csv";

    var cacheKey = "ahsen_dipnot_cache_v2";
    var cacheSuresi = 24 * 60 * 60 * 1000;

    var dipnotlar = {};
    var yukleme = null;


    /* CSV OKUYUCU */

    function csvOku(metin) {

        var satirlar = [];
        var satir = [];
        var hucre = "";
        var tirnak = false;

        if (metin.charCodeAt(0) === 65279) {
            metin = metin.substring(1);
        }

        for (var i = 0; i < metin.length; i++) {

            var karakter = metin[i];
            var sonraki = metin[i + 1];

            if (karakter === '"') {

                if (tirnak && sonraki === '"') {
                    hucre += '"';
                    i++;
                } else {
                    tirnak = !tirnak;
                }

            } else if (karakter === "," && !tirnak) {

                satir.push(hucre);
                hucre = "";

            } else if (
                (karakter === "\n" || karakter === "\r") &&
                !tirnak
            ) {

                if (karakter === "\r" && sonraki === "\n") {
                    i++;
                }

                satir.push(hucre);
                satirlar.push(satir);

                satir = [];
                hucre = "";

            } else {

                hucre += karakter;

            }
        }

        if (hucre !== "" || satir.length > 0) {
            satir.push(hucre);
            satirlar.push(satir);
        }

        return satirlar;
    }


    /* BAŞLIK NORMALİZASYONU */

    function baslikDuzelt(metin) {

        return metin.trim()
            .toLocaleLowerCase("tr-TR")
            .replace(/[ç]/g, "c")
            .replace(/[ğ]/g, "g")
            .replace(/[ı]/g, "i")
            .replace(/[ö]/g, "o")
            .replace(/[ş]/g, "s")
            .replace(/[ü]/g, "u");
    }


    /* DİPNOTLARI OLUŞTUR */

    function dipnotOlustur(metin) {

        var satirlar = csvOku(metin);
        var sonuc = {};

        if (!satirlar.length) {
            throw new Error("Dipnot verisi boş.");
        }

        var basliklar = satirlar[0].map(baslikDuzelt);

        var numaraIndex = basliklar.indexOf("numara");
        var aciklamaIndex = basliklar.indexOf("aciklama");
        var atifIndex = basliklar.indexOf("atif");
        var kategoriIndex = basliklar.indexOf("kategori");
        var linkAciklamaIndex = basliklar.indexOf("link_aciklamasi");
        var linkIndex = basliklar.indexOf("link");

        if (
            numaraIndex === -1 ||
            aciklamaIndex === -1 ||
            atifIndex === -1
        ) {
            throw new Error("Dipnot sütunları bulunamadı.");
        }

        for (var i = 1; i < satirlar.length; i++) {

            var numara = (satirlar[i][numaraIndex] || "").trim();
            var aciklama = (satirlar[i][aciklamaIndex] || "").trim();
            var atif = (satirlar[i][atifIndex] || "").trim();

            var kategori = kategoriIndex !== -1
                ? (satirlar[i][kategoriIndex] || "").trim()
                : "";

            var linkAciklamasi = linkAciklamaIndex !== -1
                ? (satirlar[i][linkAciklamaIndex] || "").trim()
                : "";

            var link = linkIndex !== -1
                ? (satirlar[i][linkIndex] || "").trim()
                : "";

            if (numara && aciklama) {

                sonuc[numara] = {
                    aciklama: aciklama,
                    atif: atif,
                    kategori: kategori,
                    linkAciklamasi: linkAciklamasi,
                    link: link
                };

            }
        }

        return sonuc;
    }


    /* ÖNBELLEK OKU */

    function cacheOku() {

        try {

            var kayit = localStorage.getItem(cacheKey);

            if (!kayit) return null;

            var veri = JSON.parse(kayit);

            if (!veri.zaman || !veri.dipnotlar) {
                return null;
            }

            return veri;

        } catch (e) {

            return null;

        }
    }


    /* ÖNBELLEK YAZ */

    function cacheYaz(veri) {

        try {

            localStorage.setItem(cacheKey, JSON.stringify({
                zaman: Date.now(),
                dipnotlar: veri
            }));

        } catch (e) {

            console.warn("Dipnot önbelleğe alınamadı.");

        }
    }


    /* VERİYİ YÜKLE */

    function dipnotYukle() {

        var kayit = cacheOku();

        if (kayit && kayit.dipnotlar) {

            dipnotlar = kayit.dipnotlar;

            if (Date.now() - kayit.zaman < cacheSuresi) {
                return Promise.resolve(dipnotlar);
            }
        }

        if (yukleme) return yukleme;

        yukleme = fetch(dipnotURL)
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Dipnot verisi indirilemedi.");
                }

                return response.arrayBuffer();

            })
            .then(function (buffer) {

                var metin = new TextDecoder("utf-8").decode(buffer);

                var yeniDipnotlar = dipnotOlustur(metin);

                dipnotlar = yeniDipnotlar;

                cacheYaz(yeniDipnotlar);

                return dipnotlar;

            })
            .catch(function (hata) {

                console.warn("Dipnot yükleme hatası:", hata);

                return dipnotlar;

            })
            .then(function (sonuc) {

                yukleme = null;

                return sonuc;

            });

        return yukleme;
    }


    /* DİPNOT KUTUSU */

    var kutu = document.createElement("div");

    kutu.id = "dipnot-popup";

    kutu.style.cssText = [
        "display:none",
        "position:absolute",
        "box-sizing:border-box",
        "width:360px",
        "max-width:calc(100vw - 24px)",
        "padding:16px",
        "background:#fff",
        "color:#333",
        "border:1px solid #ddd",
        "border-radius:8px",
        "box-shadow:0 4px 18px rgba(0,0,0,.16)",
        "font-size:14px",
        "line-height:1.65",
        "z-index:999",
        "overflow-wrap:break-word"
    ].join(";");

    document.body.appendChild(kutu);


    /* KUTU İÇERİĞİ */

    function kutuOlustur(numara, veri) {

        kutu.innerHTML = "";

        var ust = document.createElement("div");

        ust.style.cssText =
            "display:flex;justify-content:space-between;" +
            "align-items:center;margin-bottom:10px;";

        var baslik = document.createElement("strong");

        baslik.textContent = "Dipnot [" + numara + "]";

        var kapat = document.createElement("button");

        kapat.type = "button";
        kapat.textContent = "×";

        kapat.setAttribute("aria-label", "Dipnotu kapat");

        kapat.style.cssText =
            "border:0;background:transparent;color:#777;" +
            "font-size:23px;line-height:1;cursor:pointer;" +
            "padding:0 2px;";

        kapat.addEventListener("click", function () {
            kutu.style.display = "none";
        });

        ust.appendChild(baslik);
        ust.appendChild(kapat);

        var aciklama = document.createElement("div");

        aciklama.textContent = veri.aciklama;

        kutu.appendChild(ust);
        kutu.appendChild(aciklama);


        /* ATIF */

        if (veri.atif) {

            var cizgi = document.createElement("div");

            cizgi.style.cssText =
                "border-top:1px solid #e5e5e5;margin:12px 0 8px;";

            var atif = document.createElement("div");

            atif.textContent = veri.atif;

            atif.style.cssText =
                "font-size:12px;color:#777;";

            kutu.appendChild(cizgi);
            kutu.appendChild(atif);

        }


        /* DİPNOT BAĞLANTISI */

        if (veri.linkAciklamasi && veri.link) {

            try {

                var url = new URL(veri.link);

                if (
                    url.protocol === "https:" ||
                    url.protocol === "http:"
                ) {

                    var baglanti = document.createElement("a");

                    baglanti.href = url.href;
                    baglanti.textContent = veri.linkAciklamasi;
                    baglanti.target = "_blank";
                    baglanti.rel = "noopener noreferrer";

                    baglanti.style.cssText =
                        "display:inline-block;margin-top:10px;" +
                        "color:#d00000;font-weight:bold;" +
                        "text-decoration:underline;";

                    kutu.appendChild(baglanti);

                }

            } catch (e) {

                console.warn("Geçersiz dipnot bağlantısı:", veri.link);

            }

        }
    }


    /* KUTUYU NUMARANIN ÜZERİNE YERLEŞTİR */

    function kutuKonumlandir(hedef) {

        var rect = hedef.getBoundingClientRect();

        kutu.style.display = "block";

        var genislik = kutu.offsetWidth;
        var yukseklik = kutu.offsetHeight;

        var sol = rect.left + window.scrollX;

        if (rect.left + genislik > window.innerWidth - 12) {
            sol = window.scrollX + window.innerWidth - genislik - 12;
        }

        if (sol < window.scrollX + 12) {
            sol = window.scrollX + 12;
        }

        var ust = rect.top + window.scrollY - yukseklik - 10;

        kutu.style.left = sol + "px";
        kutu.style.top = ust + "px";
    }


    /* DİPNOT NUMARASINA TIKLAMA */

    document.addEventListener("click", function (event) {

        var hedef = event.target.closest("dip");

        if (!hedef) return;

        event.preventDefault();

        var metin = hedef.textContent.trim();

        var eslesme = metin.match(/^\[(\d+)\]$/);

        if (!eslesme) return;

        var numara = eslesme[1];

        dipnotYukle().then(function () {

            var veri = dipnotlar[numara];

            if (!veri) {

                console.warn(
                    "Dipnot bulunamadı: [" + numara + "]"
                );

                kutu.style.display = "none";

                return;
            }

            kutuOlustur(numara, veri);

            kutuKonumlandir(hedef);

        });

    });


    /* BAŞLAT */

    }

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", function () {

            try {
                baslat();
            } catch (hata) {
                console.error("Dipnot başlatma hatası:", hata);
            }

        });

    } else {

        try {
            baslat();
        } catch (hata) {
            console.error("Dipnot başlatma hatası:", hata);
        }

    }

})();
