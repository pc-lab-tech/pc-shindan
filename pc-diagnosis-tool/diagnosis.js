// 診断ロジック（ブラウザ/Node 両対応）。条件を満たさないPCは返さない。
(function (root) {
  function required(a) {
    var gpu = 5, cpu = 5, ram = 16, ssd = 500;
    var is1440 = a.resolution === "1440p";
    if (a.game === "VALORANT" || a.game === "Minecraft") gpu = is1440 ? 4 : 3;
    else gpu = is1440 ? 7 : 5; // Apex / その他
    if (a.priority === "画質") gpu += 1;
    if (a.priority === "FPS") cpu += 1;
    if (a.use === "配信") { cpu = Math.max(cpu, 6); ram = 32; gpu += 1; }
    if (a.use === "動画編集") { cpu = Math.max(cpu, 7); ram = 32; ssd = 1000; }
    return { gpu: gpu, cpu: cpu, ram: ram, ssd: ssd };
  }
  function evaluate(pc, a) {
    var r = required(a), why = [];
    if (pc.price > a.budget) return null;
    if (pc.gpu_tier < r.gpu || pc.cpu_tier < r.cpu) return null;
    if (pc.ram_gb < r.ram || pc.ssd_gb < r.ssd) return null;
    if (pc.psu_w < (pc.cpu_w + pc.gpu_w + 100) * 1.4) return null; // 電源余裕
    if (Math.abs(pc.cpu_tier - pc.gpu_tier) > 3) return null;       // バランス
    why.push(a.game + "を" + a.resolution + "で遊ぶ目安のGPU性能を満たしています。");
    why.push("CPUとGPUの性能差が小さく、片方がボトルネックになりにくい構成です。");
    why.push("メモリ" + pc.ram_gb + "GB・SSD" + pc.ssd_gb + "GBで「" + a.use + "」用途に必要な容量があります。");
    why.push("電源" + pc.psu_w + "Wは、CPU+GPUの消費電力に対して余裕があります。");
    var score = pc.gpu_tier * (a.priority === "FPS" || a.priority === "画質" ? 2 : 1.5)
      + pc.cpu_tier + (a.budget - pc.price) / 50000;
    return { pc: pc, why: why, score: score };
  }
  function diagnose(items, a) {
    return items.map(function (p) { return evaluate(p, a); })
      .filter(Boolean).sort(function (x, y) { return y.score - x.score; }).slice(0, 3);
  }
  var api = { diagnose: diagnose, required: required };
  if (typeof module !== "undefined") module.exports = api; else root.PCDiag = api;
})(this);