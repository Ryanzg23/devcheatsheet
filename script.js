document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     THEME TOGGLE
  ========================= */
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");

  if (themeToggle) {
    themeToggle.onclick = () => {
      if (root.getAttribute("data-theme") === "light") {
        root.removeAttribute("data-theme");
        themeToggle.textContent = "🌙";
      } else {
        root.setAttribute("data-theme", "light");
        themeToggle.textContent = "☀️";
      }
    };
  }

  /* =========================
     TABS + PERSIST
  ========================= */
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  function activateTab(id) {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    const tab = document.querySelector(`.tab[data-tab="${id}"]`);
    const content = document.getElementById(id);

    if (tab && content) {
      tab.classList.add("active");
      content.classList.add("active");
      localStorage.setItem("activeTab", id);
    }
  }

  tabs.forEach(tab => {
    tab.onclick = () => activateTab(tab.dataset.tab);
  });

  const savedTab = localStorage.getItem("activeTab");
  if (savedTab) activateTab(savedTab);

  /* =========================
     ACCORDION (GLOBAL)
  ========================= */
  document.addEventListener("click", e => {
    const header = e.target.closest(".acc-header");
    if (!header) return;

    const item = header.parentElement;
    item.classList.toggle("open");
  });

  /* =========================
     COPY BUTTONS (GLOBAL)
  ========================= */
  document.addEventListener("click", e => {
    const btn = e.target.closest(".btn.copy");
    if (!btn) return;

    const item = btn.closest(".acc-item, .card");
    if (!item) return;

    const code = item.querySelector("pre code, pre");
    if (!code) return;

    navigator.clipboard.writeText(code.innerText);

    const old = btn.innerText;
    btn.innerText = "Copied";
    btn.disabled = true;

    setTimeout(() => {
      btn.innerText = old;
      btn.disabled = false;
    }, 1200);
  });

  /* =========================
     DOMAIN GENERATOR
  ========================= */
  const input = document.getElementById("domainInput");
  const genBtn = document.getElementById("genBtn");
  const output = document.getElementById("generatedUrls");

  function normalizeDomain(d) {
    if (!d) return "";
    d = d.replace(/^https?:\/\//, "");
    d = d.replace(/^www\./, "");
    return d.split("/")[0].trim();
  }

  function buildUrls(domain) {
    return [
      "https://www." + domain,
      "https://" + domain,
      "http://www." + domain,
      "http://" + domain
    ];
  }

  if (genBtn && input && output) {
    genBtn.onclick = () => {
      const domain = normalizeDomain(input.value);
      if (!domain) return;

      const urls = buildUrls(domain);
      output.innerText = urls.join("\n");
      checkStatus(urls);
    };
  }

  /* =========================
     HTTP STATUS CHECK
  ========================= */
  const statusTable = document.getElementById("statusTable");
  const recheckBtn = document.getElementById("recheckStatus");

  function renderStatus(results) {
    if (!statusTable) return;

    statusTable.innerHTML = "";

    const header = document.createElement("div");
    header.className = "status-row header";
    header.innerHTML = "<div>Request URL</div><div>Status</div>";
    statusTable.appendChild(header);

    results.forEach(r => {
      const row = document.createElement("div");
      row.className = "status-row";

      const urlDiv = document.createElement("div");
      urlDiv.textContent = r.url;

      const statusDiv = document.createElement("div");
      const badges = document.createElement("div");
      badges.className = "badges";

      const primary = document.createElement("span");
      primary.className =
        "badge " +
        (r.status == 200 ? "ok" : r.status == 301 ? "redirect" : "err");
      primary.textContent = r.status || "ERR";
      badges.appendChild(primary);

      if (r.redirect) {
        const final = document.createElement("span");
        final.className = "badge ok";
        final.textContent = "200";
        final.title = r.redirect;
        badges.appendChild(final);
      }

      statusDiv.appendChild(badges);
      row.appendChild(urlDiv);
      row.appendChild(statusDiv);
      statusTable.appendChild(row);
    });

    if (recheckBtn) recheckBtn.style.display = "inline-flex";
  }

  function checkStatus(urls) {
    if (!urls || !urls.length) return;

    statusTable.innerHTML =
      '<div class="status-loading">Checking…</div>';

    Promise.all(
      urls.map(u =>
        fetch("/.netlify/functions/httpstatus?url=" + encodeURIComponent(u))
          .then(r => r.json())
          .catch(() => ({ url: u, status: "ERR" }))
      )
    ).then(renderStatus);
  }

  if (recheckBtn) {
    recheckBtn.onclick = () => {
      const urls = output.innerText.split("\n").filter(Boolean);
      checkStatus(urls);
    };
  }

  /* =========================
     AMP INTRO COPY
  ========================= */
  const copyAmpIntro = document.getElementById("copyAmpIntro");
  const ampIntroCode = document.getElementById("ampIntroCode");

  if (copyAmpIntro && ampIntroCode) {
    copyAmpIntro.onclick = () => {
      navigator.clipboard.writeText(ampIntroCode.innerText);

      const old = copyAmpIntro.innerText;
      copyAmpIntro.innerText = "Copied";
      copyAmpIntro.disabled = true;

      setTimeout(() => {
        copyAmpIntro.innerText = old;
        copyAmpIntro.disabled = false;
      }, 1200);
    };
  }

});
