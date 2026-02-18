document.addEventListener("DOMContentLoaded", function(){

  /* ---------- Theme toggle ---------- */
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");

  if(toggle){
    toggle.addEventListener("click", function(){
      if(root.getAttribute("data-theme")==="light"){
        root.removeAttribute("data-theme");
        toggle.textContent="🌙";
      }else{
        root.setAttribute("data-theme","light");
        toggle.textContent="☀️";
      }
    });
  }

  /* ---------- Tabs ---------- */
  document.querySelectorAll(".tab").forEach(tab=>{
    tab.addEventListener("click", ()=>{
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c=>c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.tab)?.classList.add("active");
    });
  });

  /* ---------- Copy ---------- */
  document.querySelectorAll(".btn.copy").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const pre = btn.closest(".card")?.querySelector("pre");
      if(!pre) return;
      navigator.clipboard.writeText(pre.innerText);
      const old = btn.innerText;
      btn.innerText="Copied!";
      setTimeout(()=>btn.innerText=old,1200);
    });
  });

  /* ---------- Domain generator ---------- */
  const input = document.getElementById("domainInput");
  const genBtn = document.getElementById("genBtn");
  const out = document.getElementById("generatedUrls");
  const copyUrls = document.getElementById("copyUrls");

  function normalize(d){
    return d.replace(/^https?:\/\//i,"")
            .replace(/^www\./i,"")
            .split("/")[0]
            .trim();
  }

  function variants(d){
    return [
      "https://www."+d,
      "https://"+d,
      "http://www."+d,
      "http://"+d
    ];
  }

  if(genBtn){
    genBtn.addEventListener("click", ()=>{
      const d = normalize(input.value||"domain.com");
      const list = variants(d);
      out.textContent = list.join("\n");
      checkStatus(list);
    });
  }

  if(copyUrls){
    copyUrls.addEventListener("click", ()=>{
      navigator.clipboard.writeText(out.innerText);
    });
  }

  /* ---------- Status ---------- */
  const table = document.getElementById("statusTable");
  const recheck = document.getElementById("recheckStatus");

  function showLoading(){
    if(!table) return;
    table.innerHTML = `<div class="status-loading">Checking…</div>`;
  }

  function render(results){
    table.innerHTML="";
    const header = document.createElement("div");
    header.className="status-row header";
    header.innerHTML="<div>Request URL</div><div>Status</div>";
    table.appendChild(header);

    results.forEach(r=>{
      const row = document.createElement("div");
      row.className="status-row";

      const url = document.createElement("div");
      url.textContent=r.url;

      const status = document.createElement("div");
      const badges = document.createElement("div");
      badges.className="badges";

      const b = document.createElement("span");
      b.className="badge "+(r.status==200?"ok":"redirect");
      b.textContent=r.status||"ERR";
      if(r.redirect) b.title=r.redirect;   // tooltip
      badges.appendChild(b);

      status.appendChild(badges);
      row.appendChild(url);
      row.appendChild(status);
      table.appendChild(row);
    });
  }

  function checkStatus(urls){
    if(!urls?.length) return;
    showLoading();

    Promise.all(urls.map(u=>
      fetch("/.netlify/functions/httpstatus?url="+encodeURIComponent(u))
        .then(r=>r.json())
        .catch(()=>({url:u,error:true}))
    )).then(render);
  }

  if(recheck){
    recheck.addEventListener("click", ()=>{
      const urls = out.innerText.split("\n").filter(Boolean);
      checkStatus(urls);
    });
  }

});
