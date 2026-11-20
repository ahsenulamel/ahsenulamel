
(function () {

    function baslat() {

        /* AYARLAR */

        var hadisURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSkcEcw1y0bM3GCZtlK8Hq4HnvGR_mYyQ5dkFhTj2avYz1bzmc0nYvrGe0OfhkbgGA4woVsXWZnWRKy/pub?gid=1594493235&single=true&output=csv";


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


        /* HADİSLERİ OLUŞTUR */

        function hadisleriOlustur(metin) {

            var satirlar = csvOku(metin);

            if (!satirlar.length) {
                throw new Error("Hadis verisi boş.");
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
                throw new Error("Hadis sütunları bulunamadı.");
            }

            var hadisler = [];

            for (var i = 1; i < satirlar.length; i++) {

                var sira = (satirlar[i][siraIndex] || "").trim();
                var hadisMetni = (satirlar[i][metinIndex] || "").trim();
                var kaynak = (satirlar[i][kaynakIndex] || "").trim();

                if (hadisMetni && kaynak) {

                    hadisler.push({
                        sira: Number(sira),
                        metin: hadisMetni,
                        kaynak: kaynak
                    });

                }
            }

            hadisler.sort(function (a, b) {
                return a.sira - b.sira;
            });

            if (!hadisler.length) {
                throw new Error("Gösterilecek hadis bulunamadı.");
            }

            return hadisler;
        }


        /* GÜNÜN HADİSİNİ SEÇ */

        function gununHadisiniSec(hadisler) {

            var bugun = new Date();

            var yilBasi = new Date(bugun.getFullYear(), 0, 0);

            var gunNo = Math.floor(
                (bugun - yilBasi) / 86400000
            );

            var index = (gunNo - 1) % hadisler.length;

            return hadisler[index];
        }


        /* VERİYİ YÜKLE */

        fetch(hadisURL)
            .then(function (response) {

                if (!response.ok) {
                    throw new Error("Hadis verisi indirilemedi.");
                }

                return response.arrayBuffer();

            })
            .then(function (buffer) {

                var metin = new TextDecoder("utf-8").decode(buffer);

                var hadisler = hadisleriOlustur(metin);

                var secilenHadis = gununHadisiniSec(hadisler);

                var metinAlani = document.getElementById("ignielHadisText");
                var kaynakAlani = document.getElementById("ignielHadisRef");

                if (!metinAlani || !kaynakAlani) {
                    return;
                }

                metinAlani.textContent = secilenHadis.metin;
                kaynakAlani.textContent = secilenHadis.kaynak;

            })
            .catch(function (hata) {

                console.error("Günün hadisi yükleme hatası:", hata);

            });

    }


    /* BAŞLAT */

    if (document.readyState === "loading") {

        document.addEventListener("DOMContentLoaded", function () {
            try {
                baslat();
            } catch (hata) {
                console.error("Günün hadisi başlatma hatası:", hata);
            }
        });

    } else {

        try {
            baslat();
        } catch (hata) {
            console.error("Günün hadisi başlatma hatası:", hata);
        }

    }

})();
