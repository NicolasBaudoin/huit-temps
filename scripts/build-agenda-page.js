#!/usr/bin/env node
// Assemble agenda.html : <head> et styles de la page d'accueil + corps de scripts/agenda-page.html.
// À relancer seulement si le design du site ou scripts/agenda-page.html change (les données, elles, sont lues en direct).
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const head = index.slice(0, index.indexOf("</head>"))
  .replace(/<title>.*?<\/title>/, "<title>Huit Temps — l'agenda danse</title>")
  .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*"/g, '$1Battles, stages, auditions et spectacles à venir, filtrables par région et par style."')
  .replace(/(<meta property="og:title" content=")[^"]*"/, "$1Huit Temps — l'agenda danse\"")
  .replace(/(<meta property="og:url" content="[^"]*\/)"/, '$1agenda.html"');
const body = fs.readFileSync(path.join(__dirname, "agenda-page.html"), "utf8").replace(/^<!--.*?-->\s*/, "");
fs.writeFileSync(path.join(ROOT, "agenda.html"), head + "</head>\n<body>\n" + body + "</body>\n</html>\n");
console.log("agenda.html généré");
