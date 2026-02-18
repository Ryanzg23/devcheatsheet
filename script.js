document.addEventListener("DOMContentLoaded", function(){

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

  /* ---------- Copy buttons ---------- */
  var copyBtns = document.querySelectorAll(".btn.copy");
  copyBtns.forEach(function(btn){
    btn.addEventListener("click", function(){
      var card = btn.closest(".card");
      if(!card) return;
      var pre = card.querySelector("pre");
      if(!pre) return;
      navigator.clipboard.writeText(pre.innerText);
      var old = btn.innerText;
      btn.innerText = "Copied!";
      setTimeout(function(){ btn.innerText = old; }, 1200);
    });
  });

  /* ---------- Domain generator ---------- */
  var domainInput = document.getElementById("domainInput");
  var genBtn = document.getElementById("genBtn");
  var out = document.getElementById("generatedUrls");
  var copyUrls = document.getElementById("copyUrls");

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
      checkStatus();
    });
  }

  if(copyUrls && out){
    copyUrls.addEventListener("click", function(){
      navigator.clipboard.writeText(out.innerText);
      var old = copyUrls.innerText;
      copyUrls.innerText = "Copied!";
      setTimeout(function(){ copyUrls.innerText = old; }, 1200);
    });
  }

  /* ---------- Status checker ---------- */
  var statusTable = document.getElementById("statusTable");
  var recheckBtn = document.getElementById("recheckStatus");

  function renderStatus(results){
    if(!statusTable) return;
    statusTable.innerHTML = "";

    // header
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

      // 301 / 200 primary badge
      var primary = document.createElement("span");
      var code = r.status || "ERR";
      primary.className = "badge " + (code==200?"ok":(code==301?"redirect":"err"));
      primary.textContent = code;
      badges.appendChild(primary);

      // final 200 badge for redirect target
      if(r.redirect){
        var final = document.createElement("span");
        final.className = "badge ok";
        final.textContent = "200";
        final.title = r.redirect; // tooltip final URL
        badges.appendChild(final);
      }

      statusDiv.appendChild(badges);
      row.appendChild(urlDiv);
      row.appendChild(statusDiv);
      statusTable.appendChild(row);
    });
  }

      statusDiv.appendChild(badges);
      row.appendChild(urlDiv);
      row.appendChild(statusDiv);
      statusTable.appendChild(row);
    });
  }

  function checkStatus(){
    if(!out || !statusTable) return;
    var urls = out.innerText.split("\n").filter(Boolean);
    if(!urls.length) return;

    // loading state centered
    statusTable.innerHTML = '<div class="status-loading">Checking…</div>';

    Promise.all(urls.map(function(u){
      return fetch("/.netlify/functions/httpstatus?url="+encodeURIComponent(u))
        .then(function(r){ return r.json(); })
        .catch(function(){ return {url:u,error:true}; });
    })).then(renderStatus);
  }

  if(recheckBtn){
    recheckBtn.addEventListener("click", checkStatus);
  }

});
