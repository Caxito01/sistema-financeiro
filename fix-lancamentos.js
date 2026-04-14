const fs = require("fs");
const f = "html_version/lancamentos.html";
let c = fs.readFileSync(f, "utf8");

// Normalize CRLF -> LF
c = c.replace(/\r\n/g, "\n");

// 0. Remove any duplicate CSS injections from previous runs
const cssMarker = ".act-btn{display:inline-flex";
const first = c.indexOf(cssMarker);
const second = c.indexOf(cssMarker, first + 1);
if (first !== -1 && second !== -1) {
  // Remove from first occurrence back to nearest \n
  const blockStart = c.lastIndexOf("\n", first) + 1;
  const blockEnd = c.indexOf("\n  </style>", second);
  c = c.slice(0, blockStart) + c.slice(blockEnd);
  console.log("Removed duplicate CSS");
}

// 1. CSS injection (only if not already present)
const css = [
  "    .act-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 18px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:all .2s;text-decoration:none}",
  "    .act-btn:hover{border-color:#7c5cfc;background:#7c5cfc;color:#fff}",
  "    .act-btn.primary{background:#7c5cfc;border-color:#7c5cfc;color:#fff}",
  "    .act-btn.primary:hover{background:#6a4ce0}",
  "    .act-btn.success{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.3);color:#16a34a}",
  "    .act-btn.success:hover{background:#22c55e;border-color:#22c55e;color:#fff}",
  "    .act-btn.desp-active{background:rgba(239,68,68,.15);border-color:rgba(239,68,68,.4);color:#ef4444}",
  "    .act-btn.rec-active{background:rgba(34,197,94,.15);border-color:rgba(34,197,94,.4);color:#16a34a}",
  "    .act-btn.cart-active{background:#7c3aed;border-color:#7c3aed;color:#fff;font-weight:700}",
].join("\n");
const idx = c.indexOf("\n  </style>");
if (c.includes(cssMarker)) {
  console.log("CSS already present - skip");
} else if (idx !== -1) {
  c = c.slice(0, idx) + "\n" + css + c.slice(idx);
  console.log("CSS injected");
} else {
  console.log("WARN: no </style>");
}

// helper: assert replacement worked
function rep(old, n) {
  if (!c.includes(old)) { console.log("MISS: " + old.slice(0, 60)); return; }
  c = c.replace(old, n);
}

// 2. tipo buttons HTML
rep(
  `class="btn btn-danger"\n              style="flex: 1; padding: 0.75rem; min-width: 130px;"`,
  `class="act-btn desp-active"\n              style="flex: 1; padding: 0.75rem; min-width: 130px;"`
);
rep(
  `class="btn btn-secondary"\n              style="flex: 1; padding: 0.75rem; min-width: 130px;"\n            >\n              📈 Receita`,
  `class="act-btn"\n              style="flex: 1; padding: 0.75rem; min-width: 130px;"\n            >\n              📈 Receita`
);
rep(
  `class="btn btn-secondary"\n              style="flex: 1; padding: 0.75rem; min-width: 160px; background: #1a0d2e; border: 1px solid #7c3aed; color: #c4b5fd;"`,
  `class="act-btn"\n              style="flex: 1; min-width: 160px; background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.35);color:#7c3aed"`
);

// 3. bottom buttons
rep(
  `onclick="window.location.href='dashboard.html'" class="btn btn-secondary" style="flex: 1;">`,
  `onclick="window.location.href='dashboard.html'" class="act-btn" style="flex: 1;">`
);
rep(
  `onclick="window.location.href='lista-lancamentos.html'" class="btn btn-secondary" style="flex: 1;">`,
  `onclick="window.location.href='lancamentos/lista.html'" class="act-btn success" style="flex: 1;">`
);
rep(
  `onclick="window.location.href='cartao-credito.html'" class="btn" style="flex: 1; background: #7c3aed; color: white;">`,
  `onclick="window.location.href='cartao-credito.html'" class="act-btn" style="flex: 1; background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.35);color:#7c3aed">`
);
rep(
  `class="btn btn-success" style="flex: 1;" id="submitBtn">`,
  `class="act-btn primary" style="flex: 1;" id="submitBtn">`
);

// 4. JS setTipo reset block
rep(
  "      btnDespesa.className = 'btn btn-secondary';\n      btnDespesa.style = 'flex: 1; padding: 0.75rem; min-width: 130px;';\n      btnReceita.className = 'btn btn-secondary';\n      btnReceita.style = 'flex: 1; padding: 0.75rem; min-width: 130px;';\n      btnCartao.className  = 'btn btn-secondary';\n      btnCartao.style = 'flex: 1; padding: 0.75rem; min-width: 160px; background: #1a0d2e; border: 1px solid #7c3aed; color: #c4b5fd;';",
  "      btnDespesa.className = 'act-btn'; btnDespesa.removeAttribute('style');\n      btnReceita.className = 'act-btn'; btnReceita.removeAttribute('style');\n      btnCartao.className  = 'act-btn';\n      btnCartao.setAttribute('style', 'flex:1;min-width:160px;background:rgba(124,58,237,.12);border-color:rgba(124,58,237,.35);color:#7c3aed');"
);

// 4b. CARTAO active
rep(
  "        btnCartao.style = 'flex: 1; padding: 0.75rem; min-width: 160px; background: #7c3aed; border: 1px solid #7c3aed; color: #fff; font-weight: 700;';",
  "        btnCartao.className = 'act-btn cart-active'; btnCartao.removeAttribute('style');"
);

// 4c. DESPESA active
rep(
  "        btnDespesa.className = 'btn btn-danger';\n        btnDespesa.style = 'flex: 1; padding: 0.75rem; min-width: 130px;';",
  "        btnDespesa.className = 'act-btn desp-active';"
);

// 4d. RECEITA active
rep(
  "        btnReceita.className = 'btn btn-success';\n        btnReceita.style = 'flex: 1; padding: 0.75rem; min-width: 130px;';",
  "        btnReceita.className = 'act-btn rec-active';"
);

// 5. redirect after save
rep("window.location.href = 'lista-lancamentos.html'", "window.location.href = 'lancamentos/lista.html'");

// 6. nav link
rep('<a href="lista-lancamentos.html">', '<a href="lancamentos/lista.html">');

fs.writeFileSync(f, c, "utf8");
const act = (c.match(/act-btn/g) || []).length;
const oldH = (c.match(/class="btn btn-/g) || []).length;
const oldJ = (c.match(/'btn btn-/g) || []).length;
console.log("\nRESULT -> act-btn:" + act + " | old HTML class:" + oldH + " | old JS class:" + oldJ);
