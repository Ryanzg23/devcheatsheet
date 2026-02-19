document.addEventListener("DOMContentLoaded", () => {

/* =========================
   THEME TOGGLE
========================= */
const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

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
   TABS
========================= */
const tabs = document.querySelectorAll(".tab");
const contents = document.querySelectorAll(".tab-content");

function activateTab(id){
  tabs.forEach(t=>t.classList.remove("active"));
  contents.forEach(c=>c.classList.remove("active"));

  const tab = document.querySelector(`.tab[data-tab="${id}"]`);
  const content = document.getElementById(id);

  if(tab) tab.classList.add("active");
  if(content) content.classList.add("active");

  localStorage.setItem("activeTab", id);
}

tabs.forEach(t=>{
  t.onclick = ()=> activateTab(t.dataset.tab);
});

activateTab(localStorage.getItem("activeTab") || "origin");

/* =========================
   ACCORDIONS + COPY (ALL)
========================= */
function bindAccordions(scope=document){

  scope.querySelectorAll(".acc-header").forEach(header=>{
    header.onclick = ()=>{
      const item = header.closest(".acc-item");
      if(item) item.classList.toggle("open");
    };
  });

  scope.querySelectorAll(".btn.copy").forEach(btn=>{
    btn.onclick = e=>{
      e.stopPropagation();

      const code = btn.closest(".acc-item, .card")
        ?.querySelector("code")?.innerText;

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

bindAccordions();

/* =========================
   DOMAIN GENERATOR
========================= */
const domainInput = document.getElementById("domainInput");
const genBtn = document.getElementById("genBtn");
const generatedUrls = document.getElementById("generatedUrls");

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

if(genBtn){
  genBtn.onclick = ()=>{
    const d = normalizeDomain(domainInput.value);
    if(!d) return;

    const urls = buildVariants(d);
    generatedUrls.textContent = urls.join("\n");
    checkStatus(urls);
  };
}

/* =========================
   STATUS CHECKER
========================= */
const statusTable = document.getElementById("statusTable");
const recheckBtn = document.getElementById("recheckStatus");

function showLoading(){
  if(statusTable)
    statusTable.innerHTML = '<div class="status-loading">Checking…</div>';
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
    primary.className = "badge " +
      (r.status==200?"ok":r.status==301?"redirect":"err");
    primary.textContent = r.status || "ERR";
    badges.appendChild(primary);

    if(r.redirect){
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

if(recheckBtn){
  recheckBtn.onclick = ()=>{
    const urls = generatedUrls.textContent.split("\n").filter(Boolean);
    checkStatus(urls);
  };
}

/* =========================
   AMP INTRO COPY
========================= */
const copyAmpIntro = document.getElementById("copyAmpIntro");
const ampIntroCode = document.getElementById("ampIntroCode");

if(copyAmpIntro && ampIntroCode){
  copyAmpIntro.onclick = ()=>{
    navigator.clipboard.writeText(ampIntroCode.innerText);

    const old = copyAmpIntro.innerText;
    copyAmpIntro.innerText = "Copied";
    copyAmpIntro.disabled = true;

    setTimeout(()=>{
      copyAmpIntro.innerText = old;
      copyAmpIntro.disabled = false;
    },1200);
  };
}

});
