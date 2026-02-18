document.addEventListener("DOMContentLoaded", () => {

/* =========================
   THEME TOGGLE
========================= */
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");

if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    if (root.getAttribute("data-theme") === "light") {
      root.removeAttribute("data-theme");
      themeToggle.textContent = "🌙";
    } else {
      root.setAttribute("data-theme", "light");
      themeToggle.textContent = "☀️";
    }
  });
}

/* =========================
   TABS
========================= */
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    const id = tab.dataset.tab;
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
  });
});

/* =========================
   ACCORDION (delegated)
========================= */
document.addEventListener("click", (e) => {
  const header = e.target.closest(".acc-header");
  if (!header) return;

  const item = header.closest(".acc-item");
  if (!item) return;

  item.classList.toggle("open");
});

/* =========================
   COPY BUTTONS
========================= */
function initCopyButtons(scope = document) {
  scope.querySelectorAll(".btn.copy").forEach(btn => {
    btn.onclick = () => {
      if (btn.disabled) return;

      const card = btn.closest(".acc-item, .card");
      const pre = card ? card.querySelector("pre") : null;
      if (!pre) return;

      navigator.clipboard.writeText(pre.innerText);

      const original = btn.innerText;
      btn.innerText = "Copied";
      btn.disabled = true;

      setTimeout(() => {
        btn.innerText = original;
        btn.disabled = false;
      }, 1200);
    };
  });
}

/* =========================
   DOMAIN GENERATOR
========================= */
const domainInput = document.getElementById("domainInput");
const genBtn = document.getElementById("genBtn");
const generatedUrls = document.getElementById("generatedUrls");

function normalizeDomain(d) {
  if (!d) return "";
  d = d.replace(/^https?:\/\//i, "");
  d = d.replace(/^www\./i, "");
  d = d.split("/")[0];
  return d.trim();
}

function buildVariants(domain) {
  return [
    "https://www." + domain,
    "https://" + domain,
    "http://www." + domain,
    "http://" + domain
  ];
}

if (genBtn && generatedUrls && domainInput) {
  genBtn.onclick = () => {
    const d = normalizeDomain(domainInput.value);
    if (!d) return;

    const urls = buildVariants(d);
    generatedUrls.textContent = urls.join("\n");
    checkStatus(urls);
  };
}

/* =========================
   HTTP STATUS CHECKER
========================= */
const statusTable = document.getElementById("statusTable");
const recheckBtn = document.getElementById("recheckStatus");

function showLoading() {
  if (!statusTable) return;
  statusTable.innerHTML =
    '<div class="status-loading">Checking…</div>';
  if (recheckBtn) recheckBtn.style.display = "none";
}

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
      (r.status == 200
        ? "ok"
        : r.status == 301
        ? "redirect"
        : "err");
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

  showLoading();

  Promise.all(
    urls.map(u =>
      fetch(
        "/.netlify/functions/httpstatus?url=" +
          encodeURIComponent(u)
      )
        .then(r => r.json())
        .catch(() => ({ url: u, status: "ERR" }))
    )
  ).then(renderStatus);
}

if (recheckBtn) {
  recheckBtn.onclick = () => {
    const urls = generatedUrls.innerText
      .split("\n")
      .filter(Boolean);
    checkStatus(urls);
  };
}

/* =========================
   ADMIN MODE
========================= */
let isAdmin = false;

const adminBtn = document.getElementById("adminModeBtn");
const adminModal = document.getElementById("adminModal");
const adminLogin = document.getElementById("adminLogin");
const adminCancel = document.getElementById("adminCancel");
const adminPassword = document.getElementById("adminPassword");
const adminClose = document.getElementById("adminClose");

function openAdminModal() {
  adminModal.style.display = "flex";
  adminPassword.value = "";
  adminPassword.focus();
}

function closeAdminModal() {
  adminModal.style.display = "none";
}

if (adminBtn) adminBtn.onclick = openAdminModal;
if (adminCancel) adminCancel.onclick = closeAdminModal;
if (adminClose) adminClose.onclick = closeAdminModal;

function updateAdminUI(){
  document.body.classList.toggle("admin-mode", isAdmin);

  if(adminBtn){
    adminBtn.textContent = isAdmin ? "Admin ✓" : "Admin Mode";
  }
}


if (adminLogin) {
  adminLogin.onclick = () => {
    if (adminPassword.value === "admin") {
      isAdmin = true;
      updateAdminUI();
      loadRules(); // re-render with admin buttons
      closeAdminModal();
    } else {
      alert("Wrong password");
    }
  };
}

/* =========================
   HTACCESS RULES (NEON)
========================= */
const rulesContainer = document.getElementById(
  "htaccessAccordion"
);
const searchInput = document.getElementById("ruleSearch");
const addRuleBtn = document.getElementById("addRuleBtn");

let rulesData = [];

function createRuleCard(rule) {
  const item = document.createElement("div");
  item.className = "acc-item";

  item.innerHTML = `
    <div class="acc-header">
      <h3>${rule.title}</h3>
      <div class="acc-actions">
        <button class="btn small copy">Copy Code</button>
        <button class="btn small admin-only edit">Edit</button>
        <button class="btn small admin-only delete">Delete</button>
        <span class="acc-toggle">▾</span>
      </div>
    </div>
    <div class="acc-body">
      <pre><code>${rule.code}</code></pre>
    </div>
  `;

  const del = item.querySelector(".delete");
  const edit = item.querySelector(".edit");

  if (del) {
    del.onclick = () => {
      if (!confirm("Delete this rule?")) return;
      deleteRule(rule.id);
    };
  }

  if (edit) {
    edit.onclick = () => {
      const title = prompt("Edit title", rule.title);
      if (!title) return;

      const code = prompt("Edit code", rule.code);
      if (!code) return;

      updateRule(rule.id, title, code);
    };
  }

  return item;
}

function renderRules(list) {
  if (!rulesContainer) return;

  rulesContainer.innerHTML = "";

  list.forEach(rule => {
    const card = createRuleCard(rule);
    rulesContainer.appendChild(card);
  });

  initAccordion(rulesContainer);
  initCopyButtons(rulesContainer);
  updateAdminUI();
}

/* =========================
   LOAD RULES FROM FUNCTION
========================= */
function loadRules() {
  fetch("/.netlify/functions/rules")
    .then(r => r.json())
    .then(data => {
      rulesData = data || [];
      renderRules(rulesData);
    })
    .catch(() => {
      rulesData = [];
      renderRules([]);
    });
}

/* =========================
   ADD RULE
========================= */
if (addRuleBtn) {
  addRuleBtn.onclick = () => {
    const title = prompt("Rule title");
    if (!title) return;

    const code = prompt("Rule code");
    if (!code) return;

    fetch("/.netlify/functions/rules", {
      method: "POST",
      body: JSON.stringify({ title, code })
    }).then(loadRules);
  };
}

/* =========================
   DELETE RULE
========================= */
function deleteRule(id) {
  fetch("/.netlify/functions/rules?id=" + id, {
    method: "DELETE"
  }).then(loadRules);
}

/* =========================
   UPDATE RULE
========================= */
function updateRule(id, title, code) {
  fetch("/.netlify/functions/rules", {
    method: "PUT",
    body: JSON.stringify({ id, title, code })
  }).then(loadRules);
}

/* =========================
   SEARCH
========================= */
if (searchInput) {
  searchInput.oninput = () => {
    const q = searchInput.value.toLowerCase();
    const filtered = rulesData.filter(r =>
      r.title.toLowerCase().includes(q)
    );
    renderRules(filtered);
  };
}

/* =========================
   INIT
========================= */
loadRules();

});
