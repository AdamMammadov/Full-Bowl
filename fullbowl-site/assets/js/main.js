/* FullBowl landing page behaviour: language switch, menu, waitlist form. */
(function () {
  "use strict";

  /* ---- settings ---- */
  var CONFIG = window.FB_CONFIG || {};
  var CONTACT_EMAIL = CONFIG.email || "mammadovadem842@gmail.com";
  // FormSubmit AJAX endpoint. The first submission sends an activation email to this address.
  // Form delivery: Web3Forms when a key is set (works on any address), otherwise FormSubmit.
  var W3F_KEY = CONFIG.web3formsKey || "";
  var FORM_ENDPOINT = W3F_KEY ? "https://api.web3forms.com/submit" : (CONFIG.formEndpoint || ("https://formsubmit.co/ajax/" + CONTACT_EMAIL));
  var PREVIEW = !!CONFIG.preview; // true only in the claude.ai preview build
  var LANGS = ["az", "en", "ru"];
  var DICT = window.FB_I18N || {};
  var current = "az";

  function store(key, val) {
    try { if (val === undefined) return window.localStorage.getItem(key); window.localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }
  function t(key) {
    var d = DICT[current] || {};
    if (d[key] !== undefined) return d[key];
    return (DICT.az && DICT.az[key]) || "";
  }
  function splitTitle(text) {
    // "Feed. Prove. Get repaid." -> three lines, the middle one in the accent colour
    var parts = text.match(/[^.]+\.?/g) || [text];
    return parts.map(function (p) { return '<span class="w">' + escapeHtml(p.trim()) + "</span>"; }).join(" ");
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }

  /* ---- i18n ---- */
  function applyLang(lang) {
    if (LANGS.indexOf(lang) === -1) lang = "az";
    current = lang;
    document.documentElement.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = t(el.getAttribute("data-i18n"));
      if (v) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-html");
      if (/\.split$/.test(key)) { el.innerHTML = splitTitle(t(key.replace(/\.split$/, ""))); return; }
      var v = t(key);
      if (v) el.innerHTML = v; // values come only from our own dictionary
    });
    document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
      el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
        var bits = pair.split(":");
        if (bits.length === 2) { var v = t(bits[1].trim()); if (v) el.setAttribute(bits[0].trim(), v); }
      });
    });

    document.title = t("meta.title");
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute("content", t("meta.desc"));

    document.querySelectorAll(".lang button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === lang ? "true" : "false");
    });

    // refresh visible validation messages in the new language
    document.querySelectorAll(".err:not([hidden])").forEach(function (el) {
      var k = el.getAttribute("data-key"); if (k) el.textContent = t(k);
    });
    var msg = document.getElementById("form-msg");
    if (msg && !msg.hidden && msg.getAttribute("data-kind") === "error") showError(msg.getAttribute("data-err") || null);

    store("fb-lang", lang);
    if (typeof renderDemo === "function") renderDemo();
  }

  function initialLang() {
    var q = null;
    try { q = new URLSearchParams(window.location.search).get("lang"); } catch (e) { q = null; }
    if (q && LANGS.indexOf(q) > -1) return q;
    var saved = store("fb-lang");
    if (saved && LANGS.indexOf(saved) > -1) return saved;
    return "az";
  }

  document.querySelectorAll(".lang button").forEach(function (b) {
    b.addEventListener("click", function () { applyLang(b.getAttribute("data-lang")); });
  });

  /* ---- header and mobile menu ---- */
  var header = document.querySelector(".site-header");
  var nav = document.getElementById("main-nav");
  var menuBtn = document.querySelector(".menu-btn");
  function onScroll() { if (header) header.classList.toggle("is-scrolled", window.scrollY > 8); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  function closeMenu() { if (!nav) return; nav.classList.remove("is-open"); if (menuBtn) menuBtn.setAttribute("aria-expanded", "false"); }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 1080) closeMenu(); });
  }

  /* ---- copy email ---- */
  var copyBtn = document.getElementById("copy-mail");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var done = function () {
        copyBtn.textContent = t("foot.copied");
        setTimeout(function () { copyBtn.textContent = t("foot.copy"); }, 1800);
      };
      var fallback = function () {
        var el = document.querySelector(".mail-text");
        if (!el) return;
        var r = document.createRange(); r.selectNodeContents(el);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      };
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(CONTACT_EMAIL).then(done, fallback);
        } else { fallback(); }
      } catch (e) { fallback(); }
    });
  }

  /* ---- waitlist form ---- */
  var form = document.getElementById("join-form");
  var success = document.getElementById("join-success");
  var msgBox = document.getElementById("form-msg");
  var submitBtn = document.getElementById("submit-btn");
  function F(n) { return form.elements.namedItem(n); }
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setErr(fieldId, errId, key) {
    var f = document.getElementById(fieldId), e = document.getElementById(errId);
    if (!e) return;
    if (key) { e.textContent = t(key); e.setAttribute("data-key", key); e.hidden = false; if (f) f.classList.add("invalid"); }
    else { e.hidden = true; e.removeAttribute("data-key"); if (f) f.classList.remove("invalid"); }
  }
  var lastPayload = null;
  function mailtoHref() {
    var p = lastPayload || {};
    var lines = ["Role: " + (p.role_label || ""), "Name: " + (p.name || ""), "Email: " + (p.email || ""), "Phone: " + (p.phone || ""), "District: " + (p.district || ""), "", p.message || ""];
    return "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("FullBowl pilot") + "&body=" + encodeURIComponent(lines.join("\n"));
  }
  function showError(kind) {
    msgBox.setAttribute("data-kind", "error");
    msgBox.setAttribute("data-err", kind || "");
    msgBox.className = "form-msg error";
    var text = kind === "activation" ? t("join.err.activation") : kind === "file" ? t("join.err.file") : t("join.err");
    msgBox.innerHTML = escapeHtml(text) + ' <span class="mail">' + escapeHtml(CONTACT_EMAIL) + '</span><br><a class="mail-btn" href="' + mailtoHref() + '">' + escapeHtml(t("join.mailbtn")) + "</a>";
    msgBox.hidden = false;
  }
  function validate() {
    var ok = true, first = null;
    var role = form.querySelector('input[name="role"]:checked');
    if (!role) { setErr("f-role", "err-role", "join.req.role"); ok = false; first = first || form.querySelector('input[name="role"]'); } else setErr("f-role", "err-role", null);
    var name = F("name").value.trim();
    if (name.length < 2) { setErr("f-name", "err-name", "join.req"); ok = false; first = first || F("name"); } else setErr("f-name", "err-name", null);
    var email = F("email").value.trim();
    if (!EMAIL_RE.test(email)) { setErr("f-email", "err-email", email ? "join.req.email" : "join.req"); ok = false; first = first || F("email"); } else setErr("f-email", "err-email", null);
    if (!F("consent").checked) { setErr("f-consent", "err-consent", "join.req.consent"); ok = false; first = first || F("consent"); } else setErr("f-consent", "err-consent", null);
    if (first) first.focus();
    return ok;
  }

  if (form) {
    ["name", "email"].forEach(function (n) {
      F(n).addEventListener("input", function () { if (document.getElementById("f-" + n).classList.contains("invalid")) validate(); });
    });
    form.addEventListener("change", function (e) {
      if (e.target.name === "role") setErr("f-role", "err-role", null);
      if (e.target.name === "consent" && e.target.checked) setErr("f-consent", "err-consent", null);
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      msgBox.hidden = true;
      if (!validate()) return;
      if (F("_honey") && F("_honey").value) return; // bot

      var role = form.querySelector('input[name="role"]:checked');
      var roleLabel = role ? role.parentNode.textContent.trim() : "";
      var payload = {
        _subject: "FullBowl pilot: " + roleLabel + " - " + F("name").value.trim(),
        _template: "table",
        _captcha: "false",
        role: role ? role.value : "",
        role_label: roleLabel,
        name: F("name").value.trim(),
        email: F("email").value.trim(),
        phone: F("phone").value.trim(),
        district: F("district").value,
        message: F("message").value.trim(),
        language: current,
        page: window.location.href.split("#")[0]
      };

      var label = submitBtn.querySelector("span");
      submitBtn.disabled = true;
      if (label) label.textContent = t("join.sending");

      var finish = function (ok, kind) {
        submitBtn.disabled = false;
        if (label) label.textContent = t("join.submit");
        if (ok) {
          form.hidden = true;
          success.hidden = false;
          document.getElementById("preview-note").hidden = !PREVIEW;
          success.focus();
        } else {
          showError(kind);
        }
      };

      if (PREVIEW) { setTimeout(function () { finish(true); }, 500); return; }
      if (!W3F_KEY && window.location.protocol === "file:") { lastPayload = payload; finish(false, "file"); return; }
      if (W3F_KEY) {
        payload = Object.assign({}, payload, {
          access_key: W3F_KEY,
          subject: payload._subject,
          from_name: "FullBowl",
          replyto: payload.email
        });
        delete payload._subject; delete payload._template; delete payload._captcha;
      }

      // Sent as a simple form post (no CORS preflight), answer read as JSON.
      var body = new URLSearchParams();
      Object.keys(payload).forEach(function (k) { body.append(k, payload[k]); });
      lastPayload = payload;
      var settled = false;
      var controller = ("AbortController" in window) ? new AbortController() : null;
      var slow = setTimeout(function () { if (!settled && label) label.textContent = t("join.slow"); }, 4000);
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true; clearTimeout(slow);
        if (controller) controller.abort();
        finish(false);
      }, 12000);
      var done = function (ok, kind) {
        if (settled) return;
        settled = true; clearTimeout(timer); clearTimeout(slow);
        finish(ok, kind);
      };
      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: body,
        signal: controller ? controller.signal : undefined
      }).then(function (r) {
        return r.text().then(function (txt) {
          var data = {};
          try { data = JSON.parse(txt); } catch (e) { data = {}; }
          var ok = r.ok && (data.success === true || data.success === "true");
          var kind = (!ok && /activat/i.test(String(data.message || txt))) ? "activation" : null;
          done(ok, kind);
        });
      }).catch(function () { done(false); });
    });
  }

  /* ---- donation simulator (sample only, no real payment) ---- */
  var demo = { total: 1430, covered: 950, start: 950 }; // in qəpik to avoid rounding errors
  var dForm = document.getElementById("demo-form");
  function fmt(c) { return (c / 100).toFixed(2); }
  function fill(s, map) { return s.replace(/\{(\w)\}/g, function (_, k) { return map[k] !== undefined ? map[k] : ""; }); }
  function demoAmount() {
    var v = parseFloat(String(document.getElementById("demo-amount").value).replace(",", "."));
    return isFinite(v) ? Math.round(v * 100) : 0;
  }
  function renderDemo() {
    if (!dForm) return;
    var left = demo.total - demo.covered;
    var full = left <= 0;
    document.getElementById("demo-covered").textContent = fill(t("demo.covered"), { a: fmt(demo.covered), b: fmt(demo.total) });
    document.getElementById("demo-left").textContent = full ? "" : fill(t("demo.left"), { x: fmt(left) });
    document.getElementById("demo-bar").style.width = (demo.covered / demo.total * 100).toFixed(1) + "%";
    document.querySelector(".mc-progress").classList.toggle("is-full", full);

    var amt = demoAmount();
    var tip = document.getElementById("demo-tip").checked ? 100 : 0;
    var err = document.getElementById("demo-err");
    var field = err.parentNode;
    var problem = null;
    if (!full) {
      if (amt > left) problem = fill(t("demo.max"), { x: fmt(left) });
      else if (amt < 10) problem = t("demo.min");
    }
    err.hidden = !problem; err.textContent = problem || ""; field.classList.toggle("invalid", !!problem);
    var shown = problem ? 0 : Math.max(0, amt);
    document.getElementById("b-donation").textContent = fmt(shown) + " AZN";
    document.getElementById("b-tip-row").hidden = !tip;
    document.getElementById("b-feeder").textContent = fmt(shown + (shown ? tip : 0)) + " AZN";

    var pay = document.getElementById("demo-pay");
    pay.disabled = full || !!problem;
    pay.hidden = full;
    document.getElementById("demo-reset").hidden = demo.covered === demo.start;
    dForm.querySelectorAll(".quick button").forEach(function (b) {
      var a = b.getAttribute("data-amt");
      var val = a === "rest" ? left : Math.round(parseFloat(a) * 100);
      b.disabled = full || (a !== "rest" && val > left);
      b.setAttribute("aria-pressed", !full && val === amt ? "true" : "false");
    });
    var st = document.getElementById("demo-status");
    if (full) { st.hidden = false; st.textContent = t("demo.done"); }
    else if (st.getAttribute("data-last")) { st.hidden = false; st.textContent = fill(t("demo.thanks"), { x: st.getAttribute("data-last") }); }
    else st.hidden = true;
  }
  if (dForm) {
    dForm.addEventListener("input", renderDemo);
    dForm.addEventListener("change", renderDemo);
    dForm.querySelectorAll(".quick button").forEach(function (b) {
      b.addEventListener("click", function () {
        var a = b.getAttribute("data-amt");
        var left = demo.total - demo.covered;
        document.getElementById("demo-amount").value = fmt(a === "rest" ? left : Math.round(parseFloat(a) * 100));
        renderDemo();
      });
    });
    dForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var amt = demoAmount(), left = demo.total - demo.covered;
      if (amt < 10 || amt > left) { renderDemo(); return; }
      demo.covered += amt;
      document.getElementById("demo-status").setAttribute("data-last", fmt(amt));
      var newLeft = demo.total - demo.covered;
      document.getElementById("demo-amount").value = fmt(Math.min(newLeft, 200) || 0);
      renderDemo();
    });
    document.getElementById("demo-reset").addEventListener("click", function () {
      demo.covered = demo.start;
      document.getElementById("demo-amount").value = "2.00";
      document.getElementById("demo-tip").checked = false;
      document.getElementById("demo-status").removeAttribute("data-last");
      renderDemo();
    });
  }

  var again = document.getElementById("again-btn");
  if (again) {
    again.addEventListener("click", function () {
      form.reset();
      form.hidden = false;
      success.hidden = true;
      msgBox.hidden = true;
      form.querySelector('input[name="role"]').focus();
    });
  }

  applyLang(initialLang());
})();
