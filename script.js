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
   TABS (persist)
========================= */
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

function activateTab(id){
  tabs.forEach(t => t.classList.remove("active"));
  tabContents.forEach(c => c.classList.remove("active"));

  const tab = document.querySelector(`.tab[data-tab="${id}"]`);
  const content = document.getElementById(id);

  if(tab && content){
    tab.classList.add("active");
    content.classList.add("active");
    localStorage.setItem("activeTab", id);
  }
}

tabs.forEach(tab => {
  tab.onclick = () => activateTab(tab.dataset.tab);
});

/* restore tab on load */
const savedTab = localStorage.getItem("activeTab");
if(savedTab){
  activateTab(savedTab);
}


/* =========================
   ACCORDION (DELEGATED)
========================= */
document.addEventListener("click", e => {
  if (e.target.closest(".btn")) return;

  const header = e.target.closest(".acc-header");
  if (!header) return;

  const item = header.closest(".acc-item");
  if (item) item.classList.toggle("open");
});

/* =========================
   COPY BUTTONS
========================= */
document.addEventListener("click", e => {
  const btn = e.target.closest(".btn.copy");
  if (!btn) return;

  if (btn.disabled) return;

  const card = btn.closest(".acc-item, .card");
  const pre = card?.querySelector("pre");
  if (!pre) return;

  navigator.clipboard.writeText(pre.innerText);

  const original = btn.innerText;
  btn.innerText = "Copied";
  btn.disabled = true;

  setTimeout(() => {
    btn.innerText = original;
    btn.disabled = false;
  }, 1200);
});

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

/* =========================
   HTTP STATUS
========================= */
const statusTable = document.getElementById("statusTable");
const recheckBtn = document.getElementById("recheckStatus");

function showLoading() {
  if (!statusTable) return;
  statusTable.innerHTML = '<div class="status-loading">Checking…</div>';
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
  if (!urls?.length) return;
  showLoading();

  Promise.all(
    urls.map(u =>
      fetch("/.netlify/functions/httpstatus?url=" + encodeURIComponent(u))
        .then(r => r.json())
        .catch(() => ({ url: u, status: "ERR" }))
    )
  ).then(renderStatus);
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

if (recheckBtn) {
  recheckBtn.onclick = () => {
    const urls = generatedUrls.innerText.split("\n").filter(Boolean);
    checkStatus(urls);
  };
}

/* =========================
   ADMIN MODE (persist)
========================= */
let isAdmin = localStorage.getItem("adminMode") === "1";

const adminBtn = document.getElementById("adminModeBtn");
const adminModal = document.getElementById("adminModal");
const adminPassword = document.getElementById("adminPassword");
const adminLogin = document.getElementById("adminLogin");
const adminCancel = document.getElementById("adminCancel");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const adminPassword = document.getElementById("adminPassword");
const adminLogin = document.getElementById("adminLogin");

/* Enter key submits admin login */
if(adminPassword){
  adminPassword.addEventListener("keydown", e => {
    if(e.key === "Enter"){
      e.preventDefault();
      adminLogin.click();
    }
  });
}
   
function openAdminModal(){
  adminModal.style.display = "flex";
  adminPassword.value = "";
  adminPassword.focus();
}

function closeAdminModal(){
  adminModal.style.display = "none";
}

function updateAdminUI(){
  document.body.classList.toggle("admin-mode", isAdmin);

  if(adminBtn){
    adminBtn.textContent = isAdmin ? "Admin ✓" : "Admin Mode";
  }

  if(adminLogoutBtn){
    adminLogoutBtn.style.display = isAdmin ? "inline-flex" : "none";
  }
}

/* open modal */
if(adminBtn){
  adminBtn.onclick = () => {
    if(isAdmin) return; // already admin
    openAdminModal();
  };
}

/* cancel */
if(adminCancel){
  adminCancel.onclick = closeAdminModal;
}

/* login */
if(adminLogin){
  adminLogin.onclick = () => {
    if(adminPassword.value === "admin"){
      isAdmin = true;
      localStorage.setItem("adminMode","1");
      updateAdminUI();
      loadRules();
      closeAdminModal();
    }else{
      alert("Wrong password");
    }
  };
}

/* logout */
if(adminLogoutBtn){
  adminLogoutBtn.onclick = () => {
    isAdmin = false;
    localStorage.removeItem("adminMode");
    updateAdminUI();
  };
}

/* restore on load */
updateAdminUI();


/* =========================
   HTACCESS RULES (NEON)
========================= */
const rulesContainer = document.getElementById("htaccessAccordion");
const searchInput = document.getElementById("htaccessSearch");
const addRuleBtn = document.getElementById("addRuleBtn");

let rulesData = [];
let editingRuleId = null;

/* ---------- RULE MODAL ---------- */
const ruleModal = document.getElementById("ruleModal");
const ruleTitleInput = document.getElementById("ruleTitle");
const ruleCodeInput = document.getElementById("ruleCode");
const saveRuleBtn = document.getElementById("saveRule");
const cancelRuleBtn = document.getElementById("cancelRule");

function openRuleModal(rule = null) {
  ruleModal.style.display = "flex";

  if (rule) {
    editingRuleId = rule.id;
    ruleTitleInput.value = rule.title;
    ruleCodeInput.value = rule.code;
  } else {
    editingRuleId = null;
    ruleTitleInput.value = "";
    ruleCodeInput.value = "";
  }
}

function closeRuleModal() {
  ruleModal.style.display = "none";
}

if (cancelRuleBtn) cancelRuleBtn.onclick = closeRuleModal;

/* ---------- CREATE CARD ---------- */
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
      if (!confirm("Are you sure you want to delete this rule?")) return;
      deleteRule(rule.id);
    };
  }

  if (edit) {
    edit.onclick = () => openRuleModal(rule);
  }

  return item;
}

/* ---------- RENDER ---------- */
function renderRules(list) {
  if (!rulesContainer) return;

  rulesContainer.innerHTML = "";

  list.forEach(rule => {
    const card = createRuleCard(rule);
    rulesContainer.appendChild(card);
  });

  updateAdminUI();
}

/* ---------- LOAD ---------- */
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

/* ---------- ADD ---------- */
function addRule(title, code) {
  fetch("/.netlify/functions/rules", {
    method: "POST",
    body: JSON.stringify({ title, code })
  })
  .then(r => r.json())
  .then(data => {
    // add immediately to UI
    const newRule = { id: data.id, title, code };
    rulesData.push(newRule);
    renderRules(rulesData);
  });
}

/* ---------- UPDATE ---------- */
function updateRule(id, title, code) {
  fetch("/.netlify/functions/rules", {
    method: "PUT",
    body: JSON.stringify({ id, title, code })
  }).then(loadRules);
}

/* ---------- DELETE ---------- */
function deleteRule(id) {
  fetch("/.netlify/functions/rules", {
    method: "DELETE",
    body: JSON.stringify({ id })
  }).then(loadRules);
}


/* ---------- SAVE MODAL ---------- */
if (saveRuleBtn) {
  saveRuleBtn.onclick = () => {
    const title = ruleTitleInput.value.trim();
    const code = ruleCodeInput.value.trim();
    if (!title || !code) return;

    if (editingRuleId) {
      updateRule(editingRuleId, title, code);
    } else {
      addRule(title, code);
    }

    closeRuleModal();
  };
}

/* ---------- ADD BUTTON ---------- */
if (addRuleBtn) {
  addRuleBtn.onclick = () => openRuleModal();
}

/* ---------- SEARCH ---------- */
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
