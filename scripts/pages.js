#!/usr/bin/env node
// Génère les pages secondaires (head + styles de index.html + un corps dans scripts/) :
//   trainings.html (lit data/agenda.json en direct) et mentions-legales.html.
// À relancer seulement si le design ou le texte de ces pages change.
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
const index = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const baseHead = index.slice(0, index.indexOf("</head>"));
const MAST = (h1, sub) => `<header class="mast"><div class="mast-in">
  <div class="kicker" aria-hidden="true">5 · 6 · 7 · <b>8</b></div>
  <h1>${h1}</h1>
  <div class="issue"><span>Huit Temps</span><span>${sub}</span></div>
</div></header>`;
const FOOT = `<footer><p><a href="index.html">S'abonner gratuitement</a> · <a href="agenda.html">L'agenda</a> · <a href="trainings.html">Trainings libres</a> · <a href="https://docs.google.com/forms/d/e/1FAIpQLScX4Ho4S7FMhxda1UpL8GkvDDvrCxvvpW4WfMQ2mwsQijr3yA/viewform" target="_blank" rel="noopener">Signale un événement</a> · <a href="https://ko-fi.com/huittemps" target="_blank" rel="noopener">Soutenir sur Ko-fi</a> · <a href="mentions-legales.html">Mentions légales</a></p></footer>`;

function page(file, title, desc, body) {
  const head = baseHead
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*"/g, `$1${desc}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${title}"`)
    .replace(/(<meta property="og:url" content="[^"]*\/)"/, `$1${file}"`);
  fs.writeFileSync(path.join(ROOT, file), head + "</head>\n<body>\n" + body + "\n</body>\n</html>\n");
}

page("trainings.html", "Huit Temps — trainings libres", "Les trainings libres et réguliers, ville par ville : où s'entraîner toute l'année.",
  MAST("Trainings<span>libres</span>", "Où s'entraîner toute l'année") + `
<div class="wrap">
<section class="sec">
  <header><p>Les créneaux réguliers repérés par Huit Temps : trainings libres, jams et sessions ouvertes, ville par ville. Tu en connais un qui manque ? <a href="https://docs.google.com/forms/d/e/1FAIpQLScX4Ho4S7FMhxda1UpL8GkvDDvrCxvvpW4WfMQ2mwsQijr3yA/viewform" target="_blank" rel="noopener">Signale-le</a>.</p></header>
  <div id="list"><p class="empty">Chargement…</p></div>
</section>
${FOOT}
</div>
<script>
fetch("data/agenda.json",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){
  var box=document.getElementById("list"); box.textContent="";
  var it=(j.items||[]).filter(function(i){return i.type==="training"&&i.status!=="annule"});
  if(!it.length){box.innerHTML='<p class="empty">Aucun training référencé pour l\\'instant.</p>';return}
  var by={}; it.forEach(function(i){var c=(i.city||"Autres")+(i.region?" · "+i.region:"");(by[c]=by[c]||[]).push(i)});
  Object.keys(by).sort().forEach(function(c){
    var h=document.createElement("div");h.className="sub";h.textContent=c;box.appendChild(h);
    by[c].forEach(function(i){
      var a=document.createElement("article");a.className="item stage";
      var t=document.createElement("h3");t.textContent=i.title;a.appendChild(t);
      var J={MO:"lundi",TU:"mardi",WE:"mercredi",TH:"jeudi",FR:"vendredi",SA:"samedi",SU:"dimanche"};
      var m=/BYDAY=([A-Z,]+)/.exec(i.rrule||""), quand=m?"Chaque "+m[1].split(",").map(function(x){return J[x]}).join(" et "):"Régulier";
      var meta=document.createElement("div");meta.className="meta";
      [quand+(i.time?" · "+i.time:""),i.venue,i.price,i.organizer].filter(Boolean).forEach(function(s){var e=document.createElement("span");e.textContent=s;meta.appendChild(e)});
      a.appendChild(meta);
      if(i.summary){var p=document.createElement("p");p.textContent=i.summary;a.appendChild(p)}
      if(i.url){var l=document.createElement("a");l.href=i.url;l.target="_blank";l.rel="noopener";l.textContent="Voir la source";var q=document.createElement("p");q.appendChild(l);a.appendChild(q)}
      box.appendChild(a);
    });
  });
}).catch(function(){document.getElementById("list").innerHTML='<p class="empty">Impossible de charger la liste pour le moment.</p>'});
</script>`);

page("mentions-legales.html", "Huit Temps — mentions légales", "Mentions légales et données personnelles de Huit Temps.",
  MAST("Mentions<span>légales</span>", "Éditeur · hébergeur · données") + `
<div class="wrap">
<section class="sec">
  <header><h2>Éditeur</h2></header>
  <p>Huit Temps est une newsletter et un site personnels, non commerciaux, édités par Nicolas Baudoin.<br>Contact : <b>baudoin.nicolasg@gmail.com</b></p>
  <header><h2>Hébergeur</h2></header>
  <p>GitHub, Inc. (GitHub Pages), 88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis.</p>
  <header><h2>Données personnelles</h2></header>
  <p><b>Ce qui est collecté :</b> ton adresse email, et ta ville si tu la donnes, via le formulaire d'inscription (Google Forms).</p>
  <p><b>Pourquoi :</b> uniquement pour t'envoyer Huit Temps chaque semaine. Base légale : ton consentement, donné lors de l'inscription.</p>
  <p><b>Qui y a accès :</b> seulement l'éditeur. Les données sont stockées dans Google Sheets et les lettres envoyées via Gmail (Google). Elles ne sont jamais vendues ni partagées.</p>
  <p><b>Durée :</b> jusqu'à ta désinscription. Ensuite, ton adresse n'est plus utilisée.</p>
  <p><b>Tes droits :</b> accès, rectification, suppression et opposition. Pour te désinscrire, utilise le lien en bas de chaque lettre ou le bouton « Me désinscrire » de la page d'accueil. Pour tout le reste, écris à l'adresse de contact ci-dessus. Tu peux aussi saisir la CNIL (cnil.fr).</p>
  <p><b>Formulaire « Signale un événement » :</b> les informations envoyées sur un événement peuvent être publiées dans Huit Temps. Ton email, s'il est demandé, ne sert qu'à te recontacter et n'est jamais publié.</p>
  <header><h2>Cookies et services tiers</h2></header>
  <p>Ce site ne dépose aucun cookie de suivi et ne fait pas de statistiques. Il charge des polices depuis Google Fonts, ce qui transmet ton adresse IP à Google. Les liens Ko-fi et Google Forms mènent vers des services tiers soumis à leurs propres règles.</p>
  <header><h2>Contenus</h2></header>
  <p>Les informations sur les événements viennent de sources publiques, citées et liées. Les dates peuvent changer : vérifie toujours auprès de l'organisateur. Pour toute correction ou demande de retrait, écris à l'adresse de contact.</p>
</section>
${FOOT}
</div>`);
console.log("trainings.html et mentions-legales.html générés");
