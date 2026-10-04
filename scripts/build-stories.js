#!/usr/bin/env node
// Génère les visuels de story Instagram (1080×1920) à partir de data/agenda.json.
// Usage : node scripts/build-stories.js [id1 id2 ...]
//   - avec des id : ces items, dans cet ordre (5 max)
//   - sans argument : sélection auto (dates limites et événements des 14 prochains jours,
//     Nouvelle-Aquitaine et battles en priorité)
// Sortie : stories/AAAA-MM-JJ/00-couverture.png, 01.png, 02.png…  (rendu par Edge ou Chrome en mode headless)
"use strict";
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/agenda.json"), "utf8"));
const today = new Date().toISOString().slice(0, 10);
const in14 = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
const OUT = path.join(ROOT, "stories", today);
const TMP = path.join(require("os").tmpdir(), "huit-temps-stories");

const BROWSERS = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe"
];
const BROWSER = BROWSERS.find(p => fs.existsSync(p));
if (!BROWSER) { console.error("Aucun navigateur Edge/Chrome trouvé"); process.exit(1); }

const COLOR = { battle: "#d62d36", audition: "#1d9a52", stage: "#2a55d8", training: "#2a55d8", spectacle: "#7a3fc6", actu: "#c99a00" };
const LABEL = { battle: "Battle", audition: "Audition", stage: "Stage", training: "Training", spectacle: "Spectacle", actu: "À ne pas rater" };
const MOIS = ["janv.", "févr.", "mars", "avril", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];

const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const dt = s => new Date(s + "T12:00:00");
const short = s => { const d = dt(s); return d.getDate() + " " + MOIS[d.getMonth()]; };
function whenText(it) {
  if (it.rrule) return "Chaque semaine" + (it.time ? " · " + it.time : "");
  if (!it.start) return it.deadline ? "Avant le " + short(it.deadline) : "";
  const d = dt(it.start);
  let t = JOURS[d.getDay()] + " " + short(it.start);
  if (it.end && it.end !== it.start) t = short(it.start) + " → " + short(it.end);
  return t + (it.time ? " · " + it.time : "");
}

// Sélection
let picks;
const byId = Object.fromEntries((data.items || []).map(i => [i.id, i]));
const ids = process.argv.slice(2);
if (ids.length) {
  picks = ids.map(id => byId[id]).filter(Boolean);
} else {
  const score = it => (it.region === "Nouvelle-Aquitaine" ? 0 : 10) + (it.type === "battle" ? 0 : it.type === "stage" ? 1 : it.type === "audition" ? 2 : 3);
  picks = (data.items || []).filter(it => it.status !== "annule" && !it.rrule && (
    (it.deadline && it.deadline >= today && it.deadline <= in14) ||
    (it.start && it.start >= today && it.start <= in14)
  )).sort((a, b) => score(a) - score(b) || ((a.deadline || a.start) < (b.deadline || b.start) ? -1 : 1));
}
picks = picks.slice(0, 5);
const key = it => (it.deadline && it.deadline >= today && (!it.start || it.deadline < it.start)) ? it.deadline : (it.start || it.deadline);
const ordered = picks.slice().sort((a, b) => key(a) < key(b) ? -1 : 1);
if (!picks.length) { console.log("Aucun item à mettre en story."); process.exit(0); }

const HEAD = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Graduate&family=Barlow:wght@400;600&family=Barlow+Condensed:wght@700&display=swap">
<style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
body{background:#f2f1ee;color:#1a1512;font-family:Barlow,Arial,sans-serif;display:flex;flex-direction:column}
.top{height:520px;flex:none;background-color:#17110e;background-image:radial-gradient(ellipse 60% 70% at 50% -10%,rgba(255,179,87,.6),transparent 70%),linear-gradient(to bottom,rgba(23,17,14,.1),rgba(23,17,14,.85) 95%),radial-gradient(circle at 25% 50%,#4a403a 0 4px,#0c0907 5px 14px,#3c332d 15px 18px,transparent 19px),radial-gradient(circle at 75% 50%,#4a403a 0 4px,#0c0907 5px 14px,#3c332d 15px 18px,transparent 19px),linear-gradient(#2a221d 0 0);background-size:100% 100%,100% 100%,90px 52px,90px 52px,90px 52px;border-bottom:16px solid #d62d36;display:flex;flex-direction:column;justify-content:flex-end;padding:0 80px 56px;box-sizing:border-box}
.kick{font-family:Graduate,serif;color:#ffb357;font-size:38px;letter-spacing:.3em}
.brand{font-family:"Bowlby One",Impact,sans-serif;color:#fff;font-size:150px;line-height:.9;transform:rotate(-3deg) skewX(-6deg);transform-origin:left bottom;text-shadow:8px 8px 0 #1a1512,13px 13px 0 #d62d36;margin-top:18px}
.main{flex:1;padding:80px;display:flex;flex-direction:column;gap:40px;box-sizing:border-box}
.tag{align-self:flex-start;font-family:"Barlow Condensed",sans-serif;font-size:48px;text-transform:uppercase;letter-spacing:.06em;color:#fff;padding:6px 28px;border:5px solid #1a1512;box-shadow:8px 8px 0 #1a1512;transform:rotate(-2deg)}
h1{font-family:"Bowlby One",Impact,sans-serif;font-weight:400;font-size:92px;line-height:1.02;margin:0;text-transform:uppercase}
.when{font-family:Graduate,serif;font-size:66px;line-height:1.1;text-transform:uppercase}
.where{font-size:46px;line-height:1.3;color:#3d352f}
.dl{align-self:flex-start;font-family:"Barlow Condensed",sans-serif;font-size:48px;text-transform:uppercase;color:#d62d36;border:6px solid #d62d36;padding:6px 26px}
.foot{flex:none;padding:0 80px 90px;font-family:"Barlow Condensed",sans-serif;font-size:42px;text-transform:uppercase;letter-spacing:.05em;color:#6b625b}
.foot b{color:#1a1512}
.list{display:flex;flex-direction:column;gap:34px}
.li{border-left:16px solid;padding-left:30px}
.li .w{font-family:Graduate,serif;font-size:44px;text-transform:uppercase}
.li .t{font-family:"Barlow Condensed",sans-serif;font-size:58px;line-height:1.05;text-transform:uppercase}
</style></head><body>
<div class="top"><div class="kick">5 · 6 · 7 · 8</div><div class="brand">Huit<br>Temps</div></div>`;
const FOOT = `<div class="foot"><b>Toute la semaine danse</b> · lien en bio<br>tinyurl.com/huit-temps</div></body></html>`;

function storyHtml(it) {
  const c = COLOR[it.type] || "#1a1512";
  const fit = it.title.length > 60 ? 70 : it.title.length > 38 ? 80 : 92;
  const where = [it.venue, it.city].filter(Boolean).join(", ");
  return HEAD + `<div class="main">
<div class="tag" style="background:${c}">${esc(LABEL[it.type] || it.type)}</div>
<h1 style="font-size:${fit}px">${esc(it.title)}</h1>
<div class="when" style="color:${c}">${esc(whenText(it))}</div>
${where ? `<div class="where">📍 ${esc(where)}${it.price ? "<br>" + esc(it.price) : ""}</div>` : ""}
${it.deadline && it.deadline >= today ? `<div class="dl">⏰ ${esc(short(it.deadline))} · ${esc(it.deadline_label || "date limite")}</div>` : ""}
</div>` + FOOT;
}
function coverHtml(list) {
  return HEAD + `<div class="main"><h1 style="font-size:84px">Cette semaine<br>dans ta danse</h1><div class="list">` +
    list.map(it => `<div class="li" style="border-color:${COLOR[it.type] || "#1a1512"}"><div class="w" style="color:${COLOR[it.type] || "#1a1512"}">${esc(it.deadline && (!it.start || it.deadline < it.start) && it.deadline >= today ? "⏰ " + short(it.deadline) : whenText(it).split(" · ")[0])}</div><div class="t">${esc(it.title)}</div></div>`).join("") +
    `</div></div>` + FOOT;
}

function render(html, name) {
  const src = path.join(TMP, name + ".html");
  fs.writeFileSync(src, html);
  const r = spawnSync(BROWSER, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=" + path.join(TMP, "profile"),
    "--virtual-time-budget=6000", "--window-size=1080,1920", "--screenshot=" + path.join(OUT, name + ".png"), "file:///" + src.replace(/\\/g, "/")], { stdio: "ignore", timeout: 60000 });
  return fs.existsSync(path.join(OUT, name + ".png"));
}

fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const done = [render(coverHtml(ordered), "00-couverture")];
picks.forEach((it, i) => done.push(render(storyHtml(it), String(i + 1).padStart(2, "0"))));
try { fs.rmSync(TMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 }); } catch (e) { /* profil Edge encore verrouillé : sans gravité */ }
console.log(`${done.filter(Boolean).length}/${done.length} visuels dans stories/${today}/ : ` + picks.map(p => p.id).join(", "));
