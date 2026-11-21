
(function () {

    function baslat() {

    /* AYARLAR */

    var sozlukURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkcEcw1y0bM3GCZtlK8Hq4HnvGR_mYyQ5dkFhTj2avYz1bzmc0nYvrGe0OfhkbgGA4woVsXWZnWRKy/pub?gid=0&single=true&output=csv";

    var cacheKey = "ahsen_sozluk_cache_v2";
    var cacheSuresi = 24 * 60 * 60 * 1000;

    var sozluk = {};


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

            } else if ((karakter === "\n" || karakter === "\r") && !tirnak) {

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


    /* SÖZLÜK OLUŞTUR */

    function sozlukOlustur(metin) {

        var satirlar = csvOku(metin);
        var sonuc = {};

        if (!satirlar.length) {
            throw new Error("Sözlük verisi boş.");
        }

        var basliklar = satirlar[0].map(function (baslik) {
            return baslik.trim().toLocaleLowerCase("tr-TR");
        });

        var kelimeIndex = basliklar.indexOf("kelime");
        var aciklamaIndex = basliklar.indexOf("aciklama");

        if (kelimeIndex === -1 || aciklamaIndex === -1) {
            throw new Error("Sözlük sütunları bulunamadı.");
        }

        for (var i = 1; i < satirlar.length; i++) {

            var kelime = (satirlar[i][kelimeIndex] || "").trim();
            var aciklama = (satirlar[i][aciklamaIndex] || "").trim();

            if (kelime && aciklama) {
                sonuc[kelime.toLocaleLowerCase("tr-TR")] = aciklama;
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

            if (!veri.zaman || !veri.sozluk) return null;

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
                sozluk: veri
            }));

        } catch (e) {

            console.warn("Sözlük önbelleğe alınamadı.");

        }
    }


    /* VERİYİ YÜKLE */

    function sozlukYukle() {

        var kayit = cacheOku();

        if (kayit && kayit.sozluk) {

            sozluk = kayit.sozluk;

            var guncelMi = Date.now() - kayit.zaman < cacheSuresi;

            if (guncelMi) {
                return;
            }
        }

        fetch(sozlukURL)
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Sözlük indirilemedi.");
                }

                return response.arrayBuffer();

            })
            .then(function (buffer) {

                var metin = new TextDecoder("utf-8").decode(buffer);

                var yeniSozluk = sozlukOlustur(metin);

                sozluk = yeniSozluk;

                cacheYaz(yeniSozluk);

            })
            .catch(function (hata) {

                console.warn("Sözlük yükleme hatası:", hata);

            });
    }


    /* AÇIKLAMA KUTUSU */

    var kutu = document.createElement("div");

    kutu.id = "dic-popup";
    document.body.appendChild(kutu);


    /* FARE HAREKETİ */

    document.addEventListener("mouseover", function (event) {

        var hedef = event.target.closest("dic");

        if (!hedef) return;

        var kelime = hedef.textContent.trim().toLocaleLowerCase("tr-TR");

        if (!sozluk[kelime]) return;

        kutu.textContent = sozluk[kelime];
        kutu.style.display = "block";

        var x = event.clientX + 12;
        var y = event.clientY + 15;

        var w = kutu.offsetWidth;
        var h = kutu.offsetHeight;

        if (x + w > window.innerWidth - 10) {
            x = window.innerWidth - w - 10;
        }

        if (y + h > window.innerHeight - 10) {
            y = event.clientY - h - 15;
        }

        kutu.style.left = x + "px";
        kutu.style.top = y + "px";

    });


    /* FARE KELİMEDEN AYRILDI */

    document.addEventListener("mouseout", function (event) {

        var hedef = event.target.closest("dic");

        if (!hedef) return;

        if (hedef.contains(event.relatedTarget)) return;

        kutu.style.display = "none";

    });

        /* SİTE İÇİ ARAMA */

document.addEventListener("click", function (event) {

    var hedef = event.target.closest("dic");

    if (!hedef) return;

    var kelime = hedef.textContent.trim();

    if (!kelime) return;

    window.location.href = "/search?q=" + encodeURIComponent(kelime);

});

    /* BAŞLAT */

    sozlukYukle();

    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () {
            try {
                baslat();
            } catch (hata) {
                console.error("Sözlük başlatma hatası:", hata);
            }
        });
    } else {
        try {
            baslat();
        } catch (hata) {
            console.error("Sözlük başlatma hatası:", hata);
        }
    }

})();
