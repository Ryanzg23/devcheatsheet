document.addEventListener("DOMContentLoaded", function(){

/* =========================
   THEME TOGGLE
========================= */
const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
if(themeToggle){
  themeToggle.onclick = ()=>{
    if(root.getAttribute("data-theme")==="light"){
      root.removeAttribute("data-theme");
      themeToggle.textContent = "🌙";
    }else{
      root.setAttribute("data-theme","light");
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
  tabs.forEach(t=>t.classList.remove("active"));
  tabContents.forEach(c=>c.classList.remove("active"));

  const tab = document.querySelector(`.tab[data-tab="${id}"]`);
  const content = document.getElementById(id);
  if(tab) tab.classList.add("active");
  if(content) content.classList.add("active");
  localStorage.setItem("activeTab", id);
}

tabs.forEach(t=>{
  t.onclick = ()=> activateTab(t.dataset.tab);
});

const savedTab = localStorage.getItem("activeTab") || "domain";
activateTab(savedTab);

/* =========================
   ACCORDIONS (ALL TABS)
========================= */
function bindAccordions(){
  document.querySelectorAll(".acc-header").forEach(header=>{
    header.onclick = ()=>{
      const item = header.closest(".acc-item");
      if(!item) return;
      item.classList.toggle("open");
    };
  });
}

/* =========================
   COPY BUTTONS
========================= */
function bindCopyButtons(){
  document.querySelectorAll(".btn.copy").forEach(btn=>{
    btn.onclick = (e)=>{
      e.stopPropagation();
      const acc = btn.closest(".acc-item");
      const code = acc?.querySelector("pre code")?.innerText;
      if(!code) return;

      navigator.clipboard.writeText(code);
      const old = btn.innerText;
      btn.innerText = "Copied";
      btn.disabled = true;
      setTimeout(()=>{
        btn.innerText = old;
        btn.disabled = false;
      },1200);
    };
  });
}

/* =========================
   DOMAIN GENERATOR + STATUS
========================= */
const domainInput = document.getElementById("domainInput");
const genBtn = document.getElementById("genBtn");
const generatedUrls = document.getElementById("generatedUrls");
const statusTable = document.getElementById("statusTable");
const recheckBtn = document.getElementById("recheckStatus");

function normalizeDomain(d){
  if(!d) return "domain.com";
  d = d.replace(/^https?:\/\//i, "");
  d = d.replace(/^www\./i, "");
  d = d.split("/")[0];
  return d.trim();
}

function buildVariants(domain){
  return [
    `https://www.${domain}`,
    `https://${domain}`,
    `http://www.${domain}`,
    `http://${domain}`
  ];
}

function renderStatus(results){
  if(!statusTable) return;
  statusTable.innerHTML = "";

  const header = document.createElement("div");
  header.className = "status-row header";
  header.innerHTML = "<div>Request URL</div><div>Status</div>";
  statusTable.appendChild(header);

  results.forEach(r=>{
    const row = document.createElement("div");
    row.className = "status-row";

    const urlDiv = document.createElement("div");
    urlDiv.textContent = r.url;

    const statusDiv = document.createElement("div");
    const badges = document.createElement("div");
    badges.className = "badges";

    const primary = document.createElement("span");
    primary.className = "badge " + (r.status==200?"ok":r.status==301?"redirect":"err");
    primary.textContent = r.status || "ERR";
    badges.appendChild(primary);

    if(r.redirect){
      const final = document.createElement("span");
      final.className = "badge ok tooltip";
      final.textContent = "200";
      final.dataset.tip = r.redirect;
      badges.appendChild(final);
    }

    statusDiv.appendChild(badges);
    row.appendChild(urlDiv);
    row.appendChild(statusDiv);
    statusTable.appendChild(row);
  });

  if(recheckBtn) recheckBtn.style.display = "inline-flex";
}

function showLoading(){
  if(statusTable) statusTable.innerHTML = '<div class="status-loading">Checking…</div>';
}

function checkStatus(urls){
  if(!urls?.length) return;
  showLoading();

  Promise.all(urls.map(u=>
    fetch(`/.netlify/functions/httpstatus?url=${encodeURIComponent(u)}`)
      .then(r=>r.json())
      .catch(()=>({url:u,error:true}))
  )).then(renderStatus);
}

if(genBtn){
  genBtn.onclick = ()=>{
    const d = normalizeDomain(domainInput.value);
    const urls = buildVariants(d);
    generatedUrls.textContent = urls.join("\n");
    checkStatus(urls);
  };
}

if(recheckBtn){
  recheckBtn.onclick = ()=>{
    const urls = generatedUrls.innerText.split("\n").filter(Boolean);
    checkStatus(urls);
  };
}

/* =========================
   HTACCESS RULES
========================= */
const rulesContainer = document.getElementById("rulesContainer");
const rulesSearch = document.getElementById("rulesSearch");

let rulesData = [];

function renderRules(list){
  if(!rulesContainer) return;
  rulesContainer.innerHTML = "";

  list.forEach(rule=>{
    const item = document.createElement("div");
    item.className = "acc-item";
    item.innerHTML = `
      <div class="acc-header">
        <div>
          <h3>${rule.title}</h3>
          ${rule.description?`<div class="muted" style="font-size:12px;margin-top:2px">${rule.description}</div>`:""}
        </div>
        <div class="acc-actions">
          <button class="btn small copy">Copy Code</button>
          <span class="acc-toggle">▾</span>
        </div>
      </div>
      <div class="acc-body">
        <pre><code>${rule.code}</code></pre>
      </div>
    `;
    rulesContainer.appendChild(item);
  });

  bindAccordions();
  bindCopyButtons();
}

function loadRules(){
  fetch("/.netlify/functions/rules")
    .then(r=>r.json())
    .then(data=>{
      rulesData = data || [];
      renderRules(rulesData);
    });
}

if(rulesSearch){
  rulesSearch.oninput = ()=>{
    const q = rulesSearch.value.toLowerCase();
    const filtered = rulesData.filter(r=>
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
    renderRules(filtered);
  };
}

/* =========================
   AMP REQUIREMENTS
========================= */
const ampContainer = document.getElementById("ampContainer");
const ampSearch = document.getElementById("ampSearch");

const ampRules = [
  {
    title:"AMP Runtime Script",
    description:"Core AMP JS runtime",
    code:`<script async src="https://cdn.ampproject.org/v0.js"></script>`
  },
  {
    title:"AMP HTML Tag",
    description:"Required AMP attribute",
    code:`<html ⚡>`
  },
  {
    title:"AMP Canonical Link",
    description:"Canonical reference",
    code:`<link rel="canonical" href="https://example.com/page/">`
  }
];

function renderAmp(list){
  if(!ampContainer) return;
  ampContainer.innerHTML = "";

  list.forEach(rule=>{
    const item = document.createElement("div");
    item.className = "acc-item";
    item.innerHTML = `
      <div class="acc-header">
        <div>
          <h3>${rule.title}</h3>
          ${rule.description?`<div class="muted" style="font-size:12px;margin-top:2px">${rule.description}</div>`:""}
        </div>
        <div class="acc-actions">
          <button class="btn small copy">Copy Code</button>
          <span class="acc-toggle">▾</span>
        </div>
      </div>
      <div class="acc-body">
        <pre><code>${rule.code}</code></pre>
      </div>
    `;
    ampContainer.appendChild(item);
  });

  bindAccordions();
  bindCopyButtons();
}

if(ampSearch){
  ampSearch.oninput = ()=>{
    const q = ampSearch.value.toLowerCase();
    const filtered = ampRules.filter(r=>
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
    renderAmp(filtered);
  };
}

renderAmp(ampRules);
loadRules();

});
