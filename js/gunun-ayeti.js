
(function () {

    function baslat() {

        /* AYARLAR */

        var ayetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkcEcw1y0bM3GCZtlK8Hq4HnvGR_mYyQ5dkFhTj2avYz1bzmc0nYvrGe0OfhkbgGA4woVsXWZnWRKy/pub?gid=1274198704&single=true&output=csv";


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


        /* AYETLERİ OLUŞTUR */

        function ayetleriOlustur(metin) {

            var satirlar = csvOku(metin);

            if (!satirlar.length) {
                throw new Error("Ayet verisi boş.");
            }

            var basliklar = satirlar[0].map(function (baslik) {
                return baslik.trim().toLocaleLowerCase("tr-TR");
            });

            var siraIndex = basliklar.indexOf("sıra");
            var metinIndex = basliklar.indexOf("metin");
            var kaynakIndex = basliklar.indexOf("kaynak");

            if (
                siraIndex === -1 ||
                metinIndex === -1 ||
                kaynakIndex === -1
            ) {
                throw new Error("Ayet sütunları bulunamadı.");
            }

            var ayetler = [];

            for (var i = 1; i < satirlar.length; i++) {

                var sira = (satirlar[i][siraIndex] || "").trim();
                var ayetMetni = (satirlar[i][metinIndex] || "").trim();
                var kaynak = (satirlar[i][kaynakIndex] || "").trim();

                if (ayetMetni && kaynak) {

                    ayetler.push({
                        sira: Number(sira),
                        metin: ayetMetni,
                        kaynak: kaynak
                    });

                }
            }

            ayetler.sort(function (a, b) {
                return a.sira - b.sira;
            });

            if (!ayetler.length) {
                throw new Error("Gösterilecek ayet bulunamadı.");
            }

            return ayetler;
        }


        /* GÜNÜN AYETİNİ SEÇ */

        function gununAyetiniSec(ayetler) {

            var bugun = new Date();

            var yilBasi = new Date(bugun.getFullYear(), 0, 0);

            var gunNo = Math.floor(
                (bugun - yilBasi) / 86400000
            );

            var index = (gunNo - 1) % ayetler.length;

            return ayetler[index];
        }


        /* VERİYİ YÜKLE */

        fetch(ayetURL)
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Ayet verisi indirilemedi.");
                }

                return response.arrayBuffer();

            })
            .then(function (buffer) {

                var metin = new TextDecoder("utf-8").decode(buffer);

                var ayetler = ayetleriOlustur(metin);

                var secilenAyet = gununAyetiniSec(ayetler);

                var metinAlani = document.getElementById("ignielAyetText");
                var kaynakAlani = document.getElementById("ignielAyetRef");

                if (!metinAlani || !kaynakAlani) {
                    return;
                }

                metinAlani.textContent = secilenAyet.metin;
                kaynakAlani.textContent = secilenAyet.kaynak;

            })
            .catch(function (hata) {

                console.error("Günün ayeti yükleme hatası:", hata);

            });

    }


    /* BAŞLAT */

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", function () {
            try {
                baslat();
            } catch (hata) {
                console.error("Günün ayeti başlatma hatası:", hata);
            }
        });

    } else {

        try {
            baslat();
        } catch (hata) {
            console.error("Günün ayeti başlatma hatası:", hata);
        }

    }

})();
