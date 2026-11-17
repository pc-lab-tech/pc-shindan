// 設定：GoatCounterのコード（https://CODE.goatcounter.com の CODE）。空なら計測は一切送信されません。
var CONFIG = { goatcounterCode: "", dataUrl: "../data/pcs.json" };
var started = false;

function track(name) { // 送るのはイベント名だけ。診断内容・個人情報は送らない。
  if (!CONFIG.goatcounterCode || !window.goatcounter || !window.goatcounter.count) return;
  window.goatcounter.count({ path: "event/" + name, title: name, event: true });
}
if (CONFIG.goatcounterCode) {
  var s = document.createElement("script");
  s.async = true; s.src = "https://gc.zgo.at/count.js";
  s.setAttribute("data-goatcounter", "https://" + CONFIG.goatcounterCode + ".goatcounter.com/count");
  s.setAttribute("data-goatcounter-settings", '{"no_onload":false}');
  document.head.appendChild(s);
}

var form = document.getElementById("form"), out = document.getElementById("result");
form.addEventListener("change", function () { if (!started) { started = true; track("diagnosis_start"); } });

form.addEventListener("submit", function (e) {
  e.preventDefault();
  var f = new FormData(form);
  var a = { budget: Number(f.get("budget")), use: f.get("use"), game: f.get("game"),
            resolution: f.get("resolution"), priority: f.get("priority") };
  track("diagnosis_complete");
  out.innerHTML = "<p>診断中…</p>";
  fetch(CONFIG.dataUrl).then(function (r) { if (!r.ok) throw 0; return r.json(); })
    .then(function (d) { render(PCDiag.diagnose(d.items, a), d.updated); })
    .catch(function () { out.innerHTML = "<p class='msg'>データを読み込めませんでした。時間をおいて再度お試しください。</p>"; });
});

function esc(s) { return String(s).replace(/[&<>"']/g, function (c) {
  return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

function render(list, updated) {
  track("result_view");
  if (!list.length) {
    out.innerHTML = "<p class='msg'>この条件に合うPCは現在見つかりませんでした。予算や解像度を変えてお試しください。</p>";
    return;
  }
  out.innerHTML = list.map(function (r) {
    var p = r.pc;
    return "<article class='card'><h3>" + esc(p.name) + "</h3>" +
      "<p class='price'>" + p.price.toLocaleString("ja-JP") + "円（税込目安）</p>" +
      "<dl><dt>CPU</dt><dd>" + esc(p.cpu) + "</dd><dt>GPU</dt><dd>" + esc(p.gpu) + "</dd>" +
      "<dt>RAM</dt><dd>" + p.ram_gb + "GB</dd><dt>SSD</dt><dd>" + p.ssd_gb + "GB</dd>" +
      "<dt>電源</dt><dd>" + p.psu_w + "W</dd></dl>" +
      "<ul>" + r.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>" +
      "<p class='upd'>価格情報の更新日：" + esc(p.updated || updated) + "（価格は変動します。販売ページでご確認ください）</p>" +
      "<a class='btn' data-track='1' href='" + esc(p.url) + "' target='_blank' rel='noopener sponsored'>販売ページを見る</a></article>";
  }).join("");
  out.querySelectorAll("a[data-track]").forEach(function (el) {
    el.addEventListener("click", function () { track("sales_click"); });
  });
}