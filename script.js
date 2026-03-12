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

tabs.forEach(tab=>{
  tab.onclick = () => activateTab(tab.dataset.tab);
});

const savedTab = localStorage.getItem("activeTab");
if(savedTab) activateTab(savedTab);

/* =========================
   ACCORDION (delegated)
========================= */
document.addEventListener("click", e=>{
  if (e.target.closest(".copy") ||
      e.target.closest(".edit") ||
      e.target.closest(".delete")) return;

  const header = e.target.closest(".acc-header");
  if (!header) return;

  const item = header.closest(".acc-item");
  if (item) item.classList.toggle("open");
});

/* =========================
   COPY BUTTONS
========================= */
document.addEventListener("click", e=>{
  const btn = e.target.closest(".btn.copy");
  if(!btn || btn.disabled) return;

  const card = btn.closest(".acc-item, .card");
  const pre = card?.querySelector("pre");
  if(!pre) return;

  navigator.clipboard.writeText(pre.innerText);

  const original = btn.innerText;
  btn.innerText = "Copied";
  btn.disabled = true;

  setTimeout(()=>{
    btn.innerText = original;
    btn.disabled = false;
  },1200);
});

/* =========================
   DOMAIN GENERATOR
========================= */
const domainInput = document.getElementById("domainInput");
const genBtn = document.getElementById("genBtn");
const generatedUrls = document.getElementById("generatedUrls");

/* =========================
   HTTP STATUS
========================= */
const statusTable = document.getElementById("statusTable");
const recheckBtn = document.getElementById("recheckStatus");

function normalizeDomain(d){
  if(!d) return "";
  d = d.replace(/^https?:\/\//i,"");
  d = d.replace(/^www\./i,"");
  d = d.split("/")[0];
  return d.trim();
}

function buildVariants(domain){
  return [
    "https://www."+domain,
    "https://"+domain,
    "http://www."+domain,
    "http://"+domain
  ];
}

function showLoading(){
  if(!statusTable) return;
  statusTable.innerHTML = '<div class="status-loading">Checking…</div>';
  if(recheckBtn) recheckBtn.style.display="none";
}

function renderStatus(results){
  if(!statusTable) return;

  statusTable.innerHTML="";

  const header = document.createElement("div");
  header.className="status-row header";
  header.innerHTML="<div>Request URL</div><div>Status</div>";
  statusTable.appendChild(header);

  results.forEach(r=>{
    const row=document.createElement("div");
    row.className="status-row";

    const urlDiv=document.createElement("div");
    urlDiv.textContent=r.url;

    const statusDiv=document.createElement("div");
    const badges=document.createElement("div");
    badges.className="badges";

    const primary=document.createElement("span");
    primary.className="badge "+(r.status==200?"ok":r.status==301?"redirect":"err");
    primary.textContent=r.status||"ERR";

    if(r.status==301 && r.redirect){
      primary.classList.add("has-tooltip");
      const tip=document.createElement("span");
      tip.className="tooltip";
      tip.textContent=r.redirect;
      primary.appendChild(tip);
    }

    badges.appendChild(primary);

    if(r.redirect){
      const final=document.createElement("span");
      final.className="badge ok";
      final.textContent="200";
      badges.appendChild(final);
    }

    statusDiv.appendChild(badges);
    row.appendChild(urlDiv);
    row.appendChild(statusDiv);
    statusTable.appendChild(row);
  });

  if(recheckBtn) recheckBtn.style.display="inline-flex";
}

function checkStatus(urls){
  if(!urls?.length) return;
  showLoading();

  Promise.all(
    urls.map(u =>
      fetch("/.netlify/functions/httpstatus?url="+encodeURIComponent(u))
        .then(r=>r.json())
        .catch(()=>({url:u,status:"ERR"}))
    )
  ).then(renderStatus);
}

if(genBtn && generatedUrls && domainInput){
  genBtn.onclick=()=>{
    const d=normalizeDomain(domainInput.value);
    if(!d) return;

    const urls=buildVariants(d);
    generatedUrls.textContent=urls.join("\n");
    checkStatus(urls);
  };
}

if(recheckBtn){
  recheckBtn.onclick=()=>{
    const urls=generatedUrls.innerText.split("\n").filter(Boolean);
    checkStatus(urls);
  };
}

/* =========================
   ADMIN MODE
========================= */
let isAdmin = localStorage.getItem("adminMode")==="1";

const adminBtn=document.getElementById("adminModeBtn");
const adminLogoutBtn=document.getElementById("adminLogoutBtn");
const adminModal=document.getElementById("adminModal");
const adminPassword=document.getElementById("adminPassword");
const adminLogin=document.getElementById("adminLogin");
const adminCancel=document.getElementById("adminCancel");
const adminClose=document.getElementById("adminClose");

function openAdminModal(){
  adminModal.style.display="flex";
  adminPassword.value="";
  adminPassword.focus();
}

function closeAdminModal(){
  adminModal.style.display="none";
}

function updateAdminUI(){
  document.body.classList.toggle("admin-mode",isAdmin);

  if(adminBtn) adminBtn.textContent=isAdmin?"Admin ✓":"Admin Mode";
  if(adminLogoutBtn) adminLogoutBtn.style.display=isAdmin?"inline-flex":"none";
}

if(adminBtn){
  adminBtn.onclick=()=>{
    if(isAdmin) return;
    openAdminModal();
  };
}

if(adminCancel) adminCancel.onclick=closeAdminModal;
if(adminClose) adminClose.onclick=closeAdminModal;

if(adminPassword){
  adminPassword.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      adminLogin.click();
    }
  });
}

if(adminLogin){
  adminLogin.onclick=()=>{
    if(adminPassword.value==="admin"){
      isAdmin=true;
      localStorage.setItem("adminMode","1");
      updateAdminUI();
      loadRules();
      closeAdminModal();
    }else{
      alert("Wrong password");
    }
  };
}

if(adminLogoutBtn){
  adminLogoutBtn.onclick=()=>{
    isAdmin=false;
    localStorage.removeItem("adminMode");
    updateAdminUI();
  };
}

updateAdminUI();

/* =========================
   HTACCESS RULES
========================= */
const rulesContainer=document.getElementById("htaccessAccordion");
const searchInput=document.getElementById("htaccessSearch");
const addRuleBtn=document.getElementById("addRuleBtn");

let rulesData=[];
let editingRuleId=null;

/* MODAL */
const ruleModalTitle=document.getElementById("ruleModalTitle");
const ruleTitleInput=document.getElementById("ruleTitle");
const ruleDescInput=document.getElementById("ruleDesc");
const ruleCodeInput=document.getElementById("ruleCode");
const saveRuleBtn=document.getElementById("saveRule");
const cancelRuleBtn=document.getElementById("cancelRule");

function openRuleModal(rule=null){
  const activeTab = localStorage.getItem("activeTab");

  ruleModal.style.display="flex";

  if(rule){
    ruleTitleInput.value = rule.title;
    ruleDescInput.value = rule.description || "";
    ruleCodeInput.value = rule.code;
  }else{
    ruleTitleInput.value="";
    ruleDescInput.value="";
    ruleCodeInput.value="";
  }

  if(activeTab === "htaccess"){
    ruleModalTitle.textContent = rule ? "Edit htaccess Rule" : "Add htaccess Rule";
  }

  if(activeTab === "cpanel"){
    ruleModalTitle.textContent = rule ? "Edit Cpanel Entry" : "Add Cpanel Entry";
  }
}

function openCpanelModal(rule=null){
  ruleModal.style.display="flex";

  if(rule){
    editingCpanelId = rule.id;
    ruleTitleInput.value = rule.title;
    ruleDescInput.value = rule.description || "";
    ruleCodeInput.value = rule.code;
  }else{
    editingCpanelId = null;
    ruleTitleInput.value="";
    ruleDescInput.value="";
    ruleCodeInput.value="";
  }
}

function closeRuleModal(){
  ruleModal.style.display="none";
}

if(cancelRuleBtn) cancelRuleBtn.onclick=closeRuleModal;

function createRuleCard(rule){
  const item=document.createElement("div");
  item.className="acc-item";

  item.innerHTML=`
    <div class="acc-header">
      <div>
        <h3>${rule.title}</h3>
        ${rule.description?`<div class="muted" style="font-size:12px;margin-top:2px">${rule.description}</div>`:""}
      </div>
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

  item.querySelector(".edit").onclick=()=>openRuleModal(rule);
  item.querySelector(".delete").onclick=()=>openDeleteModal(rule.id);

  return item;
}

function renderRules(list){
  if(!rulesContainer) return;

  rulesContainer.innerHTML="";
  list.forEach(rule=>{
    rulesContainer.appendChild(createRuleCard(rule));
  });

  updateAdminUI();
}

/* ⭐ LOADING FIX HERE */
function loadRules(){
  if(rulesContainer){
    rulesContainer.innerHTML='<div class="status-loading">Loading rules…</div>';
  }

  fetch("/.netlify/functions/rules")
    .then(r=>r.json())
    .then(data=>{
      rulesData=data||[];
      renderRules(rulesData);
    })
    .catch(()=>{
      rulesData=[];
      renderRules([]);
    });
}

function addRule(title,description,code){
  fetch("/.netlify/functions/rules",{
    method:"POST",
    body:JSON.stringify({title,description,code})
  })
  .then(r=>r.json())
  .then(data=>{
    const newRule={id:data.id,title,description,code};
    rulesData.push(newRule);
    renderRules(rulesData);
  });
}

function updateRule(id,title,description,code){
  fetch("/.netlify/functions/rules",{
    method:"PUT",
    body:JSON.stringify({id,title,description,code})
  }).then(loadRules);
}

function deleteRule(id){
  fetch("/.netlify/functions/rules",{
    method:"DELETE",
    body:JSON.stringify({id})
  }).then(loadRules);
}

if(saveRuleBtn){
  saveRuleBtn.onclick=()=>{
    const title = ruleTitleInput.value.trim();
    const description = ruleDescInput.value.trim();
    const code = ruleCodeInput.value.trim();

    if(!title || !code) return;

    const activeTab = localStorage.getItem("activeTab");

    /* HTACCESS */
    if(activeTab === "htaccess"){
      if(editingRuleId){
        updateRule(editingRuleId,title,description,code);
      }else{
        addRule(title,description,code);
      }
    }

    /* CPANEL */
    if(activeTab === "cpanel"){
      if(editingCpanelId){
        updateCpanel(editingCpanelId,title,description,code);
      }else{
        addCpanel(title,description,code);
      }
    }

    closeRuleModal();
  };
}

if(addRuleBtn){
  addRuleBtn.onclick=()=>openRuleModal();
}

if(searchInput){
  searchInput.oninput=()=>{
    const q=searchInput.value.toLowerCase();
    const filtered=rulesData.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
    renderRules(filtered);
  };
}


/* =========================
   CPANEL RULES
========================= */
const cpanelContainer = document.getElementById("cpanelAccordion");
const cpanelSearch = document.getElementById("cpanelSearch");
const addCpanelBtn = document.getElementById("addCpanelBtn");
   
if(addCpanelBtn){
  addCpanelBtn.onclick = () => openCpanelModal();
}
   
let cpanelData = [];
let editingCpanelId = null;

/* ---------- LOAD ---------- */
function loadCpanel(){
  if(!cpanelContainer) return;

  cpanelContainer.innerHTML = '<div class="status-loading">Loading…</div>';

  fetch("/.netlify/functions/cpanel")
    .then(r=>r.json())
    .then(data=>{
      cpanelData = data || [];
      renderCpanel(cpanelData);
    })
    .catch(()=>{
      cpanelData = [];
      renderCpanel([]);
    });
}

/* ---------- RENDER ---------- */
function renderCpanel(list){
  if(!cpanelContainer) return;

  cpanelContainer.innerHTML="";
  list.forEach(rule=>{
    cpanelContainer.appendChild(createCpanelCard(rule));
  });

  updateAdminUI();
}

/* ---------- CARD ---------- */
function createCpanelCard(rule){
  const item=document.createElement("div");
  item.className="acc-item";

  item.innerHTML=`
    <div class="acc-header">
      <div>
        <h3>${rule.title}</h3>
        ${rule.description?`<div class="muted" style="font-size:12px;margin-top:2px">${rule.description}</div>`:""}
      </div>
      <div class="acc-actions">
        <button class="btn small copy">Copy</button>
        <button class="btn small admin-only edit">Edit</button>
        <button class="btn small admin-only delete">Delete</button>
        <span class="acc-toggle">▾</span>
      </div>
    </div>
    <div class="acc-body">
      <pre><code>${rule.code}</code></pre>
    </div>
  `;

  item.querySelector(".edit").onclick = ()=>openCpanelModal(rule);
item.querySelector(".delete").onclick = ()=>openDeleteModal(rule.id,"cpanel");

  return item;
}

/* ---------- ADD / EDIT ---------- */
function addCpanel(title, description, code){
  fetch("/.netlify/functions/cpanel",{
    method:"POST",
    body:JSON.stringify({title,description,code})
  })
  .then(r=>r.json())
  .then(data=>{
    cpanelData.push({id:data.id,title,description,code});
    renderCpanel(cpanelData);
  });
}

function updateCpanel(id,title,description,code){
  fetch("/.netlify/functions/cpanel",{
    method:"PUT",
    body:JSON.stringify({id,title,description,code})
  }).then(loadCpanel);
}

function deleteCpanel(id){
  fetch("/.netlify/functions/cpanel",{
    method:"DELETE",
    body:JSON.stringify({id})
  }).then(loadCpanel);
}

/* ---------- SEARCH ---------- */
if(cpanelSearch){
  cpanelSearch.oninput = ()=>{
    const q = cpanelSearch.value.toLowerCase();
    const filtered = cpanelData.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
    renderCpanel(filtered);
  };
}

   

/* =========================
   DELETE MODAL
========================= */
const deleteModal=document.getElementById("deleteModal");
const confirmDeleteBtn=document.getElementById("confirmDelete");
const cancelDeleteBtn=document.getElementById("cancelDelete");

let deleteRuleId=null;
let deleteType="htaccess";

function openDeleteModal(id,type="htaccess"){
  deleteRuleId=id;
  deleteType=type;
  deleteModal.style.display="flex";
}

function closeDeleteModal(){
  deleteModal.style.display="none";
  deleteRuleId=null;
}

if(cancelDeleteBtn) cancelDeleteBtn.onclick=closeDeleteModal;

if(confirmDeleteBtn){
  confirmDeleteBtn.onclick=()=>{
    if(!deleteRuleId) return;

    if(deleteType==="htaccess"){
      deleteRule(deleteRuleId);
    }

    if(deleteType==="cpanel"){
      deleteCpanel(deleteRuleId);
    }

    closeDeleteModal();
  };
}

/* =========================
   AMP STATIC SEARCH
========================= */
const ampSearch = document.getElementById("ampSearch");

if (ampSearch) {
  ampSearch.addEventListener("input", () => {
    const q = ampSearch.value.toLowerCase();
    const items = document.querySelectorAll(".amp-item");

    items.forEach(item => {
      const text = item.innerText.toLowerCase();
      item.style.display = text.includes(q) ? "" : "none";
    });
  });
}


/* =========================
   INIT
========================= */
setTimeout(()=>{
  loadRules();
  loadCpanel();
},50);
   

});
