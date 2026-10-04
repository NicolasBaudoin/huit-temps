#!/usr/bin/env node
// Visuel story « Abonne-toi à Huit Temps » (1080×1920) → stories/promo-abonne-toi.png
// Lancer depuis PowerShell (Edge headless ne produit pas d'image depuis Bash).
"use strict";
const fs = require("fs"), path = require("path"), os = require("os");
const { spawnSync } = require("child_process");
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "stories", "promo-abonne-toi.png");
const TMP = path.join(os.tmpdir(), "huit-temps-promo");
fs.mkdirSync(TMP, { recursive: true }); fs.mkdirSync(path.dirname(OUT), { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bowlby+One&family=Graduate&family=Barlow:wght@400;600&family=Barlow+Condensed:wght@700&display=swap">
<style>
html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
body{background-color:#17110e;background-image:radial-gradient(ellipse 70% 45% at 50% 0%,rgba(255,179,87,.6),transparent 70%),linear-gradient(to bottom,rgba(23,17,14,.05),rgba(23,17,14,.9) 60%),radial-gradient(circle at 25% 50%,#4a403a 0 4px,#0c0907 5px 14px,#3c332d 15px 18px,transparent 19px),radial-gradient(circle at 75% 50%,#4a403a 0 4px,#0c0907 5px 14px,#3c332d 15px 18px,transparent 19px),linear-gradient(#2a221d 0 0);background-size:100% 100%,100% 100%,90px 52px,90px 52px,90px 52px;color:#fff;font-family:Barlow,Arial,sans-serif;display:flex;flex-direction:column;padding:150px 80px 120px;box-sizing:border-box;gap:56px}
.kick{font-family:Graduate,serif;color:#ffb357;font-size:40px;letter-spacing:.3em}
.brand{font-family:"Bowlby One",Impact,sans-serif;font-size:190px;line-height:.88;transform:rotate(-4deg) skewX(-6deg);transform-origin:left bottom;text-shadow:9px 9px 0 #1a1512,15px 15px 0 #d62d36}
.new{align-self:flex-start;font-family:"Barlow Condensed",sans-serif;font-size:50px;text-transform:uppercase;letter-spacing:.06em;background:#ffd23f;color:#1a1512;padding:8px 26px;border:5px solid #fff;box-shadow:8px 8px 0 #1a1512;transform:rotate(-2deg)}
.pitch{font-size:58px;line-height:1.25;font-weight:600}
.pitch b{color:#ffb357}
.chips{display:flex;flex-wrap:wrap;gap:18px}
.chips span{font-family:"Barlow Condensed",sans-serif;font-size:44px;text-transform:uppercase;padding:4px 22px;border:4px solid #fff;box-shadow:5px 5px 0 #1a1512}
.chips span:nth-child(odd){transform:rotate(-2deg)}.chips span:nth-child(even){transform:rotate(1.5deg)}
.cta{margin-top:auto;background:#f2f1ee;color:#1a1512;border-left:22px solid #d62d36;padding:40px 44px;box-shadow:12px 12px 0 #d62d36}
.cta .t{font-family:"Bowlby One",Impact,sans-serif;font-size:66px;line-height:1;text-transform:uppercase}
.cta .u{font-family:Graduate,serif;font-size:58px;color:#d62d36;margin-top:18px}
.cta .s{font-family:"Barlow Condensed",sans-serif;font-size:40px;text-transform:uppercase;color:#6b625b;margin-top:14px}
</style></head><body>
<div class="kick">5 · 6 · 7 · 8</div>
<div class="brand">Huit<br>Temps</div>
<div class="new">Nouveau · newsletter danse</div>
<div class="pitch">Chaque <b>dimanche</b>, les battles, stages, auditions et spectacles à ne pas rater. <b>Focus Nouvelle-Aquitaine</b>, et toute la France.</div>
<div class="chips"><span style="background:#d62d36">Battles</span><span style="background:#2a55d8">Stages</span><span style="background:#1d9a52">Auditions</span><span style="background:#7a3fc6">Spectacles</span></div>
<div class="cta"><div class="t">Abonne-toi, c'est gratuit</div><div class="u">tinyurl.com/huit-temps</div><div class="s">Lien en bio ↑</div></div>
</body></html>`;
const src = path.join(TMP, "promo.html"); fs.writeFileSync(src, html);
const browser = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(p => fs.existsSync(p));
spawnSync(browser, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=" + path.join(TMP, "profile"), "--virtual-time-budget=6000", "--window-size=1080,1920", "--screenshot=" + OUT, "file:///" + src.split(path.sep).join("/")], { stdio: "ignore", timeout: 60000 });
console.log(fs.existsSync(OUT) ? "OK " + OUT : "ÉCHEC");
