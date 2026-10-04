# Huit Temps

La veille danse gratuite du dimanche : battles, auditions, stages, spectacles et pépites hors radar.

- `index.html` : page d'inscription et de soutien
- `lettre.html` : dernier numéro
- `archives/` : tous les numéros

Site : https://nicolasbaudoin.github.io/huit-temps/
Soutenir : https://ko-fi.com/huittemps

## Agenda

- `data/agenda.json` : tous les événements repérés (source unique, alimentée par les veilles quotidiennes)
- `scripts/build-agenda.js` : génère `agenda.ics` (`node scripts/build-agenda.js`)
- `agenda.ics` : calendrier abonnable (Google Agenda, iPhone, Outlook)
