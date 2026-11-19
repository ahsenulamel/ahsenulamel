
(function () {
    // İzin verilen bağlantı kaynakları
    const allowedHosts = [
        'blogger.com',
        'script.google.com',
        'google.com',
        'googleapis.com',
        'gstatic.com',
        'google-analytics.com',
        'googletagmanager.com',
        'unpkg.com',
        'raw.githubusercontent.com',
        'tile.openstreetmap.org',
        'blogspot.com'
    ];

    // URL'nin izin verilen kaynaklardan olup olmadığını kontrol et
    function isAllowed(url) {
        try {
            const hostname = new URL(url, window.location.href).hostname;
            const isLabelPage = window.location.pathname.startsWith('/search/label/');

            return allowedHosts.some(function (host) {
                if (host === 'blogspot.com' && isLabelPage) {
                    return false;
                }

                return hostname === host || hostname.endsWith('.' + host);
            });
        } catch (e) {
            return false;
        }
    }

    console.info("İzin verilen kaynaklar dışındaki fetch ve XHR istekleri engelleniyor.");

    // Orijinal fonksiyonları sakla
    const originalFetch = window.fetch;
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;

    // Fetch engelleme
    window.fetch = function (resource, options) {
        const url = typeof resource === 'string'
            ? resource
            : resource.url;

        if (isAllowed(url)) {
            return originalFetch.apply(this, arguments);
        }

        return new Promise(function () {});
    };

    // XMLHttpRequest engelleme
    XMLHttpRequest.prototype.open = function (method, url) {
        this._blockedRequest = !isAllowed(url);

        if (this._blockedRequest) {
            return;
        }

        return originalOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        if (this._blockedRequest) {
            return;
        }

        return originalSend.apply(this, arguments);
    };

})();
