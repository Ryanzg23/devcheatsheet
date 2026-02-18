document.addEventListener("DOMContentLoaded", function(){

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  var toggle = document.getElementById("themeToggle");
  if(toggle){
    toggle.addEventListener("click", function(){
      if(root.getAttribute("data-theme")==="light"){
        root.removeAttribute("data-theme");
        toggle.textContent = "🌙";
      }else{
        root.setAttribute("data-theme","light");
        toggle.textContent = "☀️";
      }
    });
  }

  /* ---------- Tabs ---------- */
  var tabs = document.querySelectorAll(".tab");
  var contents = document.querySelectorAll(".tab-content");
  tabs.forEach(function(tab){
    tab.addEventListener("click", function(){
      tabs.forEach(function(t){ t.classList.remove("active"); });
      contents.forEach(function(c){ c.classList.remove("active"); });
      tab.classList.add("active");
      var id = tab.getAttribute("data-tab");
      var target = document.getElementById(id);
      if(target) target.classList.add("active");
    });
  });

  /* ---------- Copy buttons (card + accordion) ---------- */
  var copyBtns = document.querySelectorAll(".btn.copy");
  copyBtns.forEach(function(btn){
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      var scope = btn.closest(".card") || btn.closest(".acc-item");
      if(!scope) return;
      var pre = scope.querySelector("pre");
      if(!pre) return;
      navigator.clipboard.writeText(pre.innerText);
      var old = btn.innerText;
      btn.innerText = "Copied!";
      setTimeout(function(){ btn.innerText = old; }, 1200);
    });
  });

  /* ---------- Accordion ---------- */
  var accHeaders = document.querySelectorAll(".acc-header");
  accHeaders.forEach(function(header){
    header.addEventListener("click", function(e){
      if(e.target.closest(".btn.copy")) return;
      var item = header.closest(".acc-item");
      if(item) item.classList.toggle("open");
    });
  });

  /* ---------- Domain generator ---------- */
  var domainInput = document.getElementById("domainInput");
  var genBtn = document.getElementById("genBtn");
  var out = document.getElementById("generatedUrls");

  function normalizeDomain(d){
    if(!d) return "domain.com";
    d = d.replace(/^https?:\/\//i, "");
    d = d.replace(/^www\./i, "");
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

  if(genBtn && out && domainInput){
    genBtn.addEventListener("click", function(){
      var d = normalizeDomain(domainInput.value);
      var urls = buildVariants(d);
      out.textContent = urls.join("\n");
      checkStatus(urls);
    });
  }

  /* ---------- Status checker ---------- */
  var statusTable = document.getElementById("statusTable");
  var recheckBtn = document.getElementById("recheckStatus");

  function renderStatus(results){
    if(!statusTable) return;
    statusTable.innerHTML = "";

    var header = document.createElement("div");
    header.className = "status-row header";
    header.innerHTML = "<div>Request URL</div><div>Status</div>";
    statusTable.appendChild(header);

    results.forEach(function(r){
      var row = document.createElement("div");
      row.className = "status-row";

      var urlDiv = document.createElement("div");
      urlDiv.textContent = r.url;

      var statusDiv = document.createElement("div");
      var badges = document.createElement("div");
      badges.className = "badges";

      var code = r.status || "ERR";
      var primary = document.createElement("span");
      primary.className = "badge " + (code==200?"ok":(code==301?"redirect":"err"));
      primary.textContent = code;
      if(code==301 && r.redirect) primary.title = r.redirect;
      badges.appendChild(primary);

      if(r.redirect){
        var final = document.createElement("span");
        final.className = "badge ok";
        final.textContent = "200";
        badges.appendChild(final);
      }

      statusDiv.appendChild(badges);
      row.appendChild(urlDiv);
      row.appendChild(statusDiv);
      statusTable.appendChild(row);
    });
  }

  function showLoading(){
    if(!statusTable) return;
    statusTable.innerHTML = '<div class="status-loading">Checking…</div>';
  }

  function checkStatus(urls){
    if(!urls || !urls.length) return;
    showLoading();

    Promise.all(urls.map(function(u){
      return fetch("/.netlify/functions/httpstatus?url="+encodeURIComponent(u))
        .then(function(r){ return r.json(); })
        .catch(function(){ return {url:u,error:true}; });
    })).then(renderStatus);
  }

  if(recheckBtn){
    recheckBtn.addEventListener("click", function(){
      var urls = out ? out.innerText.split("\n").filter(Boolean) : [];
      checkStatus(urls);
    });
  }

});
