#!/usr/bin/env node
// Génère agenda.ics (calendrier abonnable) à partir de data/agenda.json.
// Usage : node scripts/build-agenda.js   (depuis la racine du dépôt)
// Sans dépendance. Garde les événements à venir et ceux des 30 derniers jours.
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SITE = "https://nicolasbaudoin.github.io/huit-temps/";
const data = JSON.parse(fs.readFileSync(path.join(ROOT, "data/agenda.json"), "utf8"));

const today = new Date();
const keepAfter = new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10);

const ICON = { battle: "🔴", audition: "🟢", stage: "🔵", training: "🔵", spectacle: "🟣", actu: "🟡" };
const LABEL = { battle: "Battle", audition: "Audition", stage: "Stage", training: "Training", spectacle: "Spectacle", actu: "Actu" };

function esc(s) {
  return String(s == null ? "" : s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}
function ymd(d) { return d.replace(/-/g, ""); }
function nextDay(d) {
  const t = new Date(d + "T12:00:00Z");
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}
// Plie les lignes à 75 octets (RFC 5545) sans couper un caractère UTF-8.
function fold(line) {
  const out = [];
  let cur = "", bytes = 0, limit = 75;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > limit) { out.push(cur); cur = " "; bytes = 1; limit = 75; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join("\r\n");
}
function isValidDate(d) { return typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d); }

const stamp = today.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const lines = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Huit Temps//Agenda danse//FR",
  "CALSCALE:GREGORIAN",
  "METHOD:PUBLISH",
  "X-WR-CALNAME:Huit Temps · agenda danse",
  "X-WR-CALDESC:" + esc("Battles, stages, auditions et spectacles repérés par Huit Temps. " + SITE),
  "X-WR-TIMEZONE:Europe/Paris",
  "REFRESH-INTERVAL;VALUE=DURATION:PT12H",
  "X-PUBLISHED-TTL:PT12H"
];

function description(it) {
  const parts = [];
  if (it.summary) parts.push(it.summary);
  if (it.time) parts.push("Horaire : " + it.time);
  const lieu = [it.venue, it.city, it.region].filter(Boolean).join(", ");
  if (lieu) parts.push("Lieu : " + lieu);
  if (it.price) parts.push("Prix : " + it.price);
  if (it.organizer) parts.push("Organisation : " + it.organizer);
  if (it.deadline) parts.push("Date limite : " + it.deadline + (it.deadline_label ? " (" + it.deadline_label + ")" : ""));
  if (it.url) parts.push("Source : " + it.url);
  parts.push("Huit Temps, la veille danse gratuite : " + SITE);
  return parts.join("\n");
}

function vevent(uid, start, end, summary, it, rrule) {
  const ev = [
    "BEGIN:VEVENT",
    "UID:" + uid + "@huittemps",
    "DTSTAMP:" + stamp,
    "DTSTART;VALUE=DATE:" + ymd(start),
    "DTEND;VALUE=DATE:" + ymd(nextDay(end)),
    "SUMMARY:" + esc(summary),
    "DESCRIPTION:" + esc(description(it))
  ];
  const loc = [it.venue, it.city].filter(Boolean).join(", ");
  if (loc) ev.push("LOCATION:" + esc(loc));
  if (it.url) ev.push("URL:" + it.url);
  if (rrule) ev.push("RRULE:" + rrule);
  ev.push("TRANSP:TRANSPARENT", "END:VEVENT");
  return ev;
}

let count = 0;
for (const it of data.items || []) {
  if (it.status === "annule") continue;
  const icon = ICON[it.type] || "•";
  const label = LABEL[it.type] || "";
  const where = it.city ? " · " + it.city : "";
  const time = it.time ? " · " + it.time : "";

  // L'événement lui-même
  if (isValidDate(it.start)) {
    const end = isValidDate(it.end) ? it.end : it.start;
    if (it.rrule || end >= keepAfter) {
      const prefix = it.status === "reporte" ? "[Reporté] " : "";
      lines.push(...vevent(it.id, it.start, it.rrule ? it.start : end, icon + " " + prefix + label + " · " + it.title + where + time, it, it.rrule));
      count++;
    }
  }
  // La date limite, en événement séparé
  if (isValidDate(it.deadline) && it.deadline >= keepAfter) {
    lines.push(...vevent(it.id + "-deadline", it.deadline, it.deadline, "⏰ Date limite · " + (it.deadline_label || it.title), it, null));
    count++;
  }
}
lines.push("END:VCALENDAR");

fs.writeFileSync(path.join(ROOT, "agenda.ics"), lines.map(fold).join("\r\n") + "\r\n");
console.log("agenda.ics : " + count + " événements");
