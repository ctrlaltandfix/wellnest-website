/* WellNest on GitHub Pages: runs first on every page (inlined into <head> by
 * tools/github-pages-subpath.py; __BASE__, __LIVE__, __ROUTES__ are filled in).
 *
 * - Plain root-relative links get the /wellnest-website prefix.
 * - Sign-in and data requests (/.netlify/identity, /api/*) go to the WellNest
 *   server at __LIVE__, carrying the login token as a Bearer header.
 * - The signed-in app (login, dashboard, ...) runs here when the server accepts
 *   requests from this site (the "bridge"); until then, app routes open __LIVE__.
 */
(function () {
  var B = "__BASE__", L = "__LIVE__", R = new RegExp("__ROUTES__", "i"), K = "wn_bridge";
  var D = document.documentElement, of = window.fetch.bind(window);
  window.__WN_IDENTITY__ = L + "/api/_identity";

  function rel(p) { return p.indexOf(B) === 0 ? (p.slice(B.length) || "/") : p; }
  function appUrl(u) {
    try { var x = new URL(u, location.href); return x.origin === location.origin && R.test(rel(x.pathname)) ? x : null; }
    catch (e) { return null; }
  }
  function liveUrl(x) { return L + rel(x.pathname) + x.search + x.hash; }
  function fix(u) {
    return typeof u == "string" && u.charAt(0) == "/" && u.charAt(1) != "/" && u !== B && u.indexOf(B + "/") !== 0 ? B + u : u;
  }
  function token() { var m = document.cookie.match(/(?:^|;\s*)nf_jwt=([^;]+)/); return m ? decodeURIComponent(m[1]) : null; }

  // --- send API + identity calls to the WellNest server -------------------
  window.fetch = function (input, init) {
    try {
      var s = typeof input == "string" ? input : input instanceof URL ? input.href : input && input.url;
      var x = new URL(s, location.href);
      if (x.origin === location.origin) {
        var p = rel(x.pathname);
        if (p.indexOf("/.netlify/identity") === 0) p = "/api/_identity" + p.slice(18);
        if (p.indexOf("/api/") === 0) {
          init = Object.assign({}, init || {});
          var h = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
          var t = token();
          if (t && !h.has("Authorization") && p.indexOf("/api/_identity") !== 0) h.set("Authorization", "Bearer " + t);
          init.headers = h; init.credentials = "omit"; init.mode = "cors";
          var target = L + p + x.search;
          return input instanceof Request ? of(new Request(target, input), init) : of(target, init);
        }
      }
    } catch (e) {}
    return of(input, init);
  };

  // --- is the server bridge live? ------------------------------------------
  var ok = null;
  try { if (sessionStorage.getItem(K) === "1") ok = true; } catch (e) {}
  var hide = document.createElement("style");
  hide.textContent = "html[data-wn-wait] body{visibility:hidden}";
  D.appendChild(hide);
  function settle(v) {
    if (ok !== null) return;
    ok = v;
    try { if (v) sessionStorage.setItem(K, "1"); } catch (e) {}
    if (!v) { var x = appUrl(location.href); if (x) { location.replace(liveUrl(x)); return; } }
    D.removeAttribute("data-wn-wait");
  }
  if (ok === null) {
    of(L + "/api/_identity/settings", { mode: "cors", credentials: "omit" })
      .then(function (r) { settle(r.ok && /json/i.test(r.headers.get("content-type") || "")); }, function () { settle(false); });
    setTimeout(function () { settle(false); }, 6000);
    if (appUrl(location.href)) D.setAttribute("data-wn-wait", "");
  }

  // --- navigation ------------------------------------------------------------
  ["pushState", "replaceState"].forEach(function (k) {
    var o = history[k];
    history[k] = function (s, t, u) {
      var x = u != null && appUrl(String(u));
      if (x && ok === false) { location.assign(liveUrl(x)); return; }
      if (x && ok === null) D.setAttribute("data-wn-wait", "");
      return o.apply(this, arguments);
    };
  });
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var h = a.getAttribute("href"), n = fix(h), x = appUrl(n);
    if (x && ok === false) {
      a.setAttribute("href", liveUrl(x));
      if (!a.target) { e.preventDefault(); e.stopPropagation(); location.assign(liveUrl(x)); }
      return;
    }
    if (n !== h) a.setAttribute("href", n);
  }, true);

  // --- file previews (<img src="/api/files/...">) load from the server -------
  function fixSrc(el) {
    var v = el.getAttribute && el.getAttribute("src");
    if (v && /^\/(?:[^/]+\/)?api\//.test(v)) { var x = new URL(v, location.href); el.setAttribute("src", L + rel(x.pathname) + x.search); }
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type == "attributes") return fixSrc(m.target);
      m.addedNodes.forEach(function (n) { if (n.nodeType == 1) { fixSrc(n); n.querySelectorAll && n.querySelectorAll("[src]").forEach(fixSrc); } });
    });
  }).observe(D, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
})();
