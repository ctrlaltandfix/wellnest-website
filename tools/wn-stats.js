// WellNest page statistics (added to every page by tools/build-cloudflare.mjs).
// Sends: the page address (no query string), referrer, utm_source/utm_campaign
// and how long the page was visible. No cookies; nothing about the visitor is
// kept in the browser except a random id for this tab. Skipped when the browser
// asks not to be tracked (Global Privacy Control / Do Not Track).
(function () {
  try {
    var n = navigator;
    if (n.globalPrivacyControl || n.doNotTrack === "1" || window.doNotTrack === "1") return;
    if (!/(^|\.)wellnest\.services$|\.workers\.dev$/.test(location.hostname)) return;
    if (/^\/admin(\/|$)/.test(location.pathname)) return;

    var END = "/api/analytics/collect";
    var rid = function () {
      return (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 12));
    };
    var session;
    try {
      session = sessionStorage.getItem("wn-s") || rid();
      sessionStorage.setItem("wn-s", session);
    } catch (e) { session = rid(); }

    var send = function (data) {
      var body = JSON.stringify(data);
      if (n.sendBeacon && n.sendBeacon(END, new Blob([body], { type: "text/plain" }))) return;
      fetch(END, { method: "POST", body: body, keepalive: true, credentials: "omit" }).catch(function () {});
    };

    var view = null, shown = 0, visibleSince = 0, lastPath = null, firstView = true;
    var visibleTime = function () { return shown + (visibleSince ? Date.now() - visibleSince : 0); };
    var flush = function () {
      if (!view) return;
      var d = Math.round(visibleTime() / 1000);
      if (d > 0) send({ t: "l", id: view, d: d });
    };
    var start = function () {
      if (location.pathname === lastPath) return;
      flush();
      lastPath = location.pathname;
      var q = new URLSearchParams(location.search);
      view = rid();
      shown = 0;
      visibleSince = document.visibilityState === "visible" ? Date.now() : 0;
      send({
        t: "v", id: view, s: session, p: location.pathname,
        r: firstView ? document.referrer : location.origin,
        u: q.get("utm_source") || (q.get("gclid") ? "google-ads" : ""),
        c: q.get("utm_campaign") || "",
      });
      firstView = false;
    };

    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") {
        if (visibleSince) { shown += Date.now() - visibleSince; visibleSince = 0; }
        flush();
      } else if (!visibleSince) {
        visibleSince = Date.now();
      }
    });
    window.addEventListener("pagehide", flush);

    // The app changes pages without reloading; count those too.
    ["pushState", "replaceState"].forEach(function (k) {
      var orig = history[k];
      history[k] = function () {
        var r = orig.apply(this, arguments);
        setTimeout(start, 0);
        return r;
      };
    });
    window.addEventListener("popstate", start);
    start();
  } catch (e) { /* never break the page */ }
})();
