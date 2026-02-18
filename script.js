document.addEventListener("DOMContentLoaded", () => {

  /* ================= Theme ================= */
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");

  if (toggle) {
    toggle.addEventListener("click", () => {
      if (root.getAttribute("data-theme") === "light") {
        root.removeAttribute("data-theme");
        toggle.textContent = "🌙";
      } else {
        root.setAttribute("data-theme", "light");
        toggle.textContent = "☀️";
      }
    });
  }

  /* ================= Tabs ================= */
  const tabs = document.querySelectorAll(".tab");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const id = tab.dataset.tab;
      const target = document.getElementById(id);
      if (target) target.classList.add("active");
    });
  });

  /* ================= Accordion ================= */
  function bindAccordion(item) {
    const header = item.querySelector(".acc-header");
    if (!header) return;

    header.addEventListener("click", (e) => {
      if (e.target.closest(".btn.copy") ||
          e.target.closest(".edit") ||
          e.target.closest(".delete")) return;

      item.classList.toggle("open");
    });
  }

  /* ================= Copy ================= */
  function bindCopy(btn) {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();

      const scope = btn.closest(".card") || btn.closest(".acc-item");
      const pre = scope?.querySelector("pre");
      if (!pre) return;

      navigator.clipboard.writeText(pre.innerText);

      const old = btn.innerText;
      btn.innerText = "Copied!";
      btn.disabled = true;

      setTimeout(() => {
        btn.innerText = old;
        btn.disabled = false;
      }, 1200);
    });
  }

  document.querySelectorAll(".btn.copy").forEach(bindCopy);
  document.querySelectorAll(".acc-item").forEach(bindAccordion);

  /* ================= Domain generator ================= */
  const domainInput = document.getElementById("domainInput");
  const genBtn = document.getElementById("genBtn");
  const out = document.getElementById("generatedUrls");

  function normalizeDomain(d) {
    if (!d) return "domain.com";
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

  /* ================= HTTP Status ================= */
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

      const code = r.status || "ERR";
      const primary = document.createElement("span");
      primary.className =
        "badge " + (code == 200 ? "ok" : code == 301 ? "redirect" : "err");
      primary.textContent = code;
      if (code == 301 && r.redirect) primary.title = r.redirect;
      badges.appendChild(primary);

      if (r.redirect) {
        const final = document.createElement("span");
        final.className = "badge ok";
        final.textContent = "200";
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
        fetch("/.netlify/functions/httpstatus?url=" + encodeURIComponent(u))
          .then(r => r.json())
          .catch(() => ({ url: u, error: true }))
      )
    ).then(renderStatus);
  }

  if (genBtn && out && domainInput) {
    genBtn.addEventListener("click", () => {
      const d = normalizeDomain(domainInput.value);
      const urls = buildVariants(d);
      out.textContent = urls.join("\n");
      checkStatus(urls);
    });
  }

  if (recheckBtn) {
    recheckBtn.addEventListener("click", () => {
      const urls = out ? out.innerText.split("\n").filter(Boolean) : [];
      checkStatus(urls);
    });
  }

  /* ================= htaccess search ================= */
  const htaccessSearch = document.getElementById("htaccessSearch");

  if (htaccessSearch) {
    htaccessSearch.addEventListener("input", () => {
      const q = htaccessSearch.value.toLowerCase().trim();
      document.querySelectorAll("#htaccess .acc-item").forEach(item => {
        const title = item.querySelector("h3")?.textContent.toLowerCase() || "";
        item.style.display = !q || title.includes(q) ? "" : "none";
      });
    });
  }

  /* ================= Rules CRUD ================= */
  const addRuleBtn = document.getElementById("addRuleBtn");
  const modal = document.getElementById("ruleModal");
  const saveRule = document.getElementById("saveRule");
  const cancelRule = document.getElementById("cancelRule");
  const ruleTitle = document.getElementById("ruleTitle");
  const ruleCode = document.getElementById("ruleCode");

  function createRuleCard(rule) {
    const { id, title, code } = rule;
    const acc = document.querySelector("#htaccess .accordion");
    if (!acc) return;

    const item = document.createElement("div");
    item.className = "acc-item";
    item.dataset.id = id;

    item.innerHTML = `
      <div class="acc-header">
        <h3>${title}</h3>
        <div class="acc-actions">
          <button class="btn small edit admin-only">Edit</button>
          <button class="btn small delete admin-only">Delete</button>
          <button class="btn copy">Copy Code</button>
          <button class="acc-toggle">▾</button>
        </div>
      </div>
      <div class="acc-body">
        <pre><code>${code.replace(/</g, "&lt;")}</code></pre>
      </div>
    `;

    acc.appendChild(item);

    bindAccordion(item);
    bindCopy(item.querySelector(".btn.copy"));

    /* delete */
    item.querySelector(".delete").addEventListener("click", async e => {
      e.stopPropagation();
      if (!confirm("Are you sure you want to delete this rule?")) return;

      await fetch("/.netlify/functions/rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      item.remove();
    });

    /* edit */
    item.querySelector(".edit").addEventListener("click", e => {
      e.stopPropagation();
      ruleTitle.value = title;
      ruleCode.value = code;
      modal.dataset.editId = id;
      modal.classList.add("open");
    });
	  
	updateAdminUI();
  }

  async function loadGlobalRules() {
    try {
      const res = await fetch("/.netlify/functions/rules");
      const list = await res.json();
      list.forEach(r => createRuleCard(r));
    } catch (e) {
      console.warn("rules load failed", e);
    }
  }

  loadGlobalRules();

  if (addRuleBtn) {
    addRuleBtn.addEventListener("click", () => {
      delete modal.dataset.editId;
      modal.classList.add("open");
    });
  }

  if (cancelRule) {
    cancelRule.addEventListener("click", () => {
      modal.classList.remove("open");
    });
  }

  if (saveRule) {
    saveRule.addEventListener("click", async () => {
      const t = ruleTitle.value.trim();
      const c = ruleCode.value.trim();
      if (!t || !c) return;

      const editId = modal.dataset.editId;

      if (editId) {
        /* UPDATE */
        await fetch("/.netlify/functions/rules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, title: t, code: c })
        });

        const item = document.querySelector(
          `.acc-item[data-id="${editId}"]`
        );
        if (item) {
          item.querySelector("h3").textContent = t;
          item.querySelector("code").textContent = c;
        }

        delete modal.dataset.editId;
      } else {
        /* ADD */
        const res = await fetch("/.netlify/functions/rules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: t, code: c })
        });

        const data = await res.json();
        createRuleCard({ id: data.id, title: t, code: c });
      }

      modal.classList.remove("open");
      ruleTitle.value = "";
      ruleCode.value = "";
    });

/* ================= Admin Mode ================= */
const adminBtn = document.getElementById("adminModeBtn");
const adminModal = document.getElementById("adminModal");
const adminLogin = document.getElementById("adminLogin");
const adminCancel = document.getElementById("adminCancel");
const adminPassword = document.getElementById("adminPassword");
const adminError = document.getElementById("adminError");

let isAdmin = false;

function updateAdminUI(){
  document.querySelectorAll(".admin-only").forEach(el=>{
    el.style.display = isAdmin ? "inline-flex" : "none";
  });

  if(adminBtn){
    adminBtn.textContent = isAdmin ? "Admin ✓" : "Admin Mode";
  }
}


if(adminBtn){
  adminBtn.addEventListener("click", ()=>{
    if(isAdmin){
      isAdmin = false;
      updateAdminUI();
      return;
    }
    adminModal.classList.add("open");
    adminPassword.value="";
    adminError.style.display="none";
  });
}

if(adminCancel){
  adminCancel.addEventListener("click", ()=>{
    adminModal.classList.remove("open");
  });
}

if(adminLogin){
  adminLogin.addEventListener("click", ()=>{
    if(adminPassword.value==="admin"){
      isAdmin = true;
      adminModal.classList.remove("open");
      updateAdminUI();
    }else{
      adminError.style.display="block";
    }
  });
}

/* hide controls initially */
updateAdminUI();

    
  }

});
