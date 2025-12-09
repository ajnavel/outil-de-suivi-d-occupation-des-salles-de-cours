const fs = require('fs');
const cli = require('@caporal/core').default;
const { parseCRU, getICalendar, getOccupancyCSV } = require('./parsers');

// VERSION
cli.version('1.0.0');
cli.description('Outil CLI de suivi d’occupation des salles (recherche de salles, conflits, export iCal, taux d’occupation).');
// SPEC1 : Rechercher les salles associées à un cours
cli
  .command('cours-salles', 'Rechercher les salles associées à un cours')
  .argument('deCours>', 'Code du cours (ex: ME01)')
  .argument('<fichier>', 'Fichier de données CRU')
  .action(({ args, logger }) => {
    try {
      const code    = args.deCours;      // <-- ICI : deCours
      const fichier = args.fichier;

      const creneaux = parseCRU(fs.readFileSync(fichier, 'utf8'));
      const result   = creneaux.filter(c => c.courseCode === code);

      if (result.length === 0) {
        logger.warn(`Aucun résultat trouvé pour ce code de cours (${code})`);
      } else {
        const lignes = result.map(c =>
          `${c.day} ${c.start}-${c.end} | ${c.kind} | ${c.room} | ${c.capacity} places`
        );
        logger.info(lignes.join('\n'));
      }
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });

// SPEC2 : Consulter la capacité maximale d'une salle
cli
  .command('salle-capacite', 'Consulter la capacité maximale d\'une salle')
  .argument('<nomSalle>', 'Nom de la salle (ex: B101)')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    try {
      const creneaux = parseCRU(fs.readFileSync(args.fichier, 'utf8'));
      const capacities = creneaux
        .filter(c => c.room === args.nomSalle)
        .map(c => c.capacity);

      if (capacities.length === 0) {
        logger.warn('Aucune salle correspondante');
      } else {
        logger.info(`Capacité maximale: ${Math.max(...capacities)}`);
      }
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });


// SPEC3 : Afficher les créneaux d'une salle donnée
cli
  .command('salle-creneaux', 'Afficher les créneaux d\'une salle')
  .argument('<nomSalle>', 'Nom de la salle')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    try {
      const creneaux = parseCRU(fs.readFileSync(args.fichier, 'utf8'));
      const list = creneaux.filter(c => c.room === args.nomSalle);

      if (list.length === 0) {
        logger.warn('Salle libre sur la semaine');
      } else {
        const lignes = list.map(c =>
          `${c.day} ${c.start}-${c.end} | ${c.courseCode} | ${c.kind} | ${c.capacity} places`
        );
        logger.info(lignes.join('\n'));
      }
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });


// SPEC4 : Salles libres sur un créneau
cli
  .command('salles-libres', 'Recherche les salles libres sur un créneau')
  .argument('<jour>', 'Jour (ex: L, MA, ME, J, V)')
  .argument('<heureDebut>', 'Heure début (HHMM)')
  .argument('<heureFin>', 'Heure fin (HHMM)')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    try {
      const jour    = args.jour;
      const hDeb    = args.heureDebut;
      const hFin    = args.heureFin;
      const fichier = args.fichier;

      // Validation simple des formats (SPEC4)
      if (!/^(L|MA|ME|J|V)$/.test(jour) || !/^\d{4}$/.test(hDeb) || !/^\d{4}$/.test(hFin)) {
        logger.error('Format invalide. Utiliser: JOUR (L,MA,ME,J,V) et HHMM HHMM');
        return;
      }
      if (hDeb >= hFin) {
        logger.error('Heure de début doit être < heure de fin');
        return;
      }

      const creneaux = parseCRU(fs.readFileSync(fichier, 'utf8'));

      // Toutes les salles connues + capacité max (idée de SPEC2)
      const salles = new Map(); // room -> { room, maxCap }
      for (const c of creneaux) {
        const prev = salles.get(c.room);
        const cap  = c.capacity;
        if (!prev || cap > prev.maxCap) {
          salles.set(c.room, { room: c.room, maxCap: cap });
        }
      }

      // Salles occupées sur ce jour et ce créneau (overlap)
      const occupees = new Set();
      for (const c of creneaux) {
        if (c.day !== jour) continue;
        const start = c.start;
        const end   = c.end;
        const overlap = !(end <= hDeb || start >= hFin);
        if (overlap) {
          occupees.add(c.room);
        }
      }

      // Salles libres = toutes - occupées
      const libres = [];
      for (const { room, maxCap } of salles.values()) {
        if (!occupees.has(room)) {
          libres.push({ room, maxCap });
        }
      }

      if (libres.length === 0) {
        logger.warn('Aucune salle libre sur ce créneau');
        return;
      }

      // Tri par capacité croissante (SPEC4)
      libres.sort((a, b) => a.maxCap - b.maxCap);

      const lignes = libres.map(s => `${s.room} ${s.maxCap} places`);
      logger.info(`Salles libres le ${jour} ${hDeb}-${hFin} :\n` + lignes.join('\n'));
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });


// SPEC5 : Vérifier les conflits d'occupation des salles
cli
  .command('conflits', 'Vérifier les conflits d\'occupation des salles')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    try {
      const fichier  = args.fichier;
      const creneaux = parseCRU(fs.readFileSync(fichier, 'utf8'));

      // Regrouper par (salle, jour)
      const groupes = new Map(); // key = room + '|' + day -> [creneaux]
      for (const c of creneaux) {
        const key = `${c.room}|${c.day}`;
        if (!groupes.has(key)) groupes.set(key, []);
        groupes.get(key).push(c);
      }

      const conflits = [];

      const overlap = (a, b) => !(a.end <= b.start || b.end <= a.start);

      for (const [, list] of groupes.entries()) {
        if (list.length < 2) continue;
        list.sort((x, y) => x.start.localeCompare(y.start));

        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const c1 = list[i];
            const c2 = list[j];
            if (overlap(c1, c2)) {
              conflits.push({
                room: c1.room,
                day:  c1.day,
                c1,
                c2
              });
            }
          }
        }
      }

      if (conflits.length === 0) {
        logger.info('Aucun conflit détecté.');
      } else {
        const lignes = conflits.map(conf =>
          `Conflit en salle ${conf.room} le ${conf.day} : ` +
          `${conf.c1.courseCode} ${conf.c1.start}-${conf.c1.end} ` +
          `chevauche ${conf.c2.courseCode} ${conf.c2.start}-${conf.c2.end}`
        );
        logger.info('Conflits détectés :\n' + lignes.join('\n'));
      }
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });


// SPEC6 : Générer un emploi du temps iCalendar
cli
  .command('export-ical', 'Exporter un cours au format iCalendar (.ics)')
  .argument('<dateDebut>', 'Date début (AAAAMMJJ)')
  .argument('<dateFin>', 'Date fin (AAAAMMJJ)')
  .argument('deCours>', 'Identifiant du cours (ex: ME01)')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    try {
      const dateDebut = String(args.dateDebut);
      const dateFin   = String(args.dateFin);
      const code      = args.deCours;      // <-- ici, utiliser deCours
      const fichier   = args.fichier;

      if (!/^\d{8}$/.test(dateDebut) || !/^\d{8}$/.test(dateFin) || dateDebut > dateFin) {
        logger.error('Dates invalides. Utiliser AAAAMMJJ avec dateDebut <= dateFin');
        return;
      }

      const creneaux  = parseCRU(fs.readFileSync(fichier, 'utf8'));
      const selection = creneaux.filter(c => c.courseCode === code);

      if (selection.length === 0) {
        logger.warn(`Aucun cours ${code} trouvé dans ${fichier} sur la période ${dateDebut}-${dateFin}`);
        return;
      }

      const dayOffset = { L: 0, MA: 1, ME: 2, J: 3, V: 4 };

      const events = selection.map(c => {
        const offset = dayOffset[c.day];
        if (offset == null) return null;

        const base = dateDebut;
        const y = base.slice(0, 4);
        const m = base.slice(4, 6);
        const d0 = Number(base.slice(6, 8));
        const d = String(d0 + offset).padStart(2, '0');

        const dateStr = `${y}${m}${d}`;
        const dtstart = `${dateStr}T${c.start}00`;
        const dtend   = `${dateStr}T${c.end}00`;

        const summary  = `${c.courseCode} ${c.kind}`;
        const location = c.room;

        return (
          'BEGIN:VEVENT\r\n' +
          `SUMMARY:${summary}\r\n` +
          `LOCATION:${location}\r\n` +
          `DTSTART:${dtstart}\r\n` +
          `DTEND:${dtend}\r\n` +
          'END:VEVENT\r\n'
        );
      }).filter(Boolean);

      if (events.length === 0) {
        logger.warn('Aucun créneau exploitable pour ce cours dans la période donnée');
        return;
      }

      const icalContent =
        'BEGIN:VCALENDAR\r\n' +
        'VERSION:2.0\r\n' +
        events.join('') +
        'END:VCALENDAR\r\n';

      const outName = `export_${code}.ics`;
      fs.writeFileSync(outName, icalContent, 'utf8');

      logger.info(`Fichier iCalendar généré: ${outName}`);
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });


// SPEC7 : Calculer le taux d'occupation des salles
cli
  .command('occupation', 'Calculer le taux d\'occupation des salles')
  .argument('<fichier>', 'Fichier CRU')
  .option('--csv', 'Rapport CSV')
  .action(({ args, options, logger }) => {
    try {
      const fichier  = args.fichier;
      const creneaux = parseCRU(fs.readFileSync(fichier, 'utf8'));

      const DUREE_JOUR_MIN = 12 * 60; // 720 minutes

      const salles = new Map();

      const toMinutes = (hhmm) => {
        const h = Number(hhmm.slice(0, 2));
        const m = Number(hhmm.slice(2, 4));
        return h * 60 + m;
      };

      for (const c of creneaux) {
        const room  = c.room;
        const day   = c.day;
        const start = c.start;
        const end   = c.end;

        const duree = toMinutes(end) - toMinutes(start);
        if (duree <= 0) continue;

        if (!salles.has(room)) {
          salles.set(room, {
            room,
            capacityMax: c.capacity,
            jours: new Map()
          });
        }

        const infoSalle = salles.get(room);
        if (c.capacity > infoSalle.capacityMax) {
          infoSalle.capacityMax = c.capacity;
        }

        const occJour = infoSalle.jours.get(day) || 0;
        infoSalle.jours.set(day, occJour + duree);
      }

      if (salles.size === 0) {
        logger.warn('Aucune donnée de salle dans ce fichier CRU');
        return;
      }

      const resultat = [];
      for (const infoSalle of salles.values()) {
        let tempsOccTotal = 0;
        let tempsDispoTotal = 0;
        for (const occMin of infoSalle.jours.values()) {
          tempsOccTotal   += occMin;
          tempsDispoTotal += DUREE_JOUR_MIN;
        }
        if (tempsDispoTotal === 0) continue;

        const taux = Math.round((tempsOccTotal / tempsDispoTotal) * 100);

        resultat.push({
          room: infoSalle.room,
          capacity: infoSalle.capacityMax,
          occupied: tempsOccTotal,
          total: tempsDispoTotal,
          taux
        });
      }

      if (resultat.length === 0) {
        logger.warn('Aucune donnée exploitable pour calculer le taux d’occupation');
        return;
      }

      resultat.sort((a, b) => b.taux - a.taux);

      if (options.csv) {
        let csv = 'Salle;Capacite;TempsOccup;TempsTotal;TauxOccupation\r\n';
        for (const r of resultat) {
          csv += `${r.room};${r.capacity};${r.occupied};${r.total};${r.taux}\r\n`;
        }
        const outName = 'occupation_salles.csv';
        fs.writeFileSync(outName, csv, 'utf8');
        logger.info(`Rapport CSV généré: ${outName}`);
      } else {
        const lignes = resultat.map(r =>
          `${r.room} (${r.capacity} places) : ` +
          `${r.occupied} min occupées / ${r.total} min (${r.taux}%)`
        );
        logger.info('Taux d’occupation des salles :\n' + lignes.join('\n'));
      }
    } catch (e) {
      logger.error('Erreur CRU: ' + e.message);
    }
  });


// Commande read
cli
  .command('read', 'Afficher le contenu du fichier')
  .argument('<fichier>', 'fichier à afficher')
  .action(({ args, logger }) => {
    try {
      const data = fs.readFileSync(args.fichier, 'utf8');
      logger.info(data);
    } catch (err) {
      // NF2 : messages d'erreur détaillés
      if (err.code === 'ENOENT') {
        logger.error(`Fichier non trouvé: ${args.fichier}`);
      } else if (err.message.includes('CRU invalide') || err.message.includes('parseCRU')) {
        logger.error(`Format CRU invalide: ${err.message}`);
      } else {
        logger.error(`Erreur CLI: ${err.message}`);
      }
    }

  });

// SPEC1
cli
  .command('cours-salles', 'Lister les salles associées à un cours\nEx: sru cours-salles ME01 emploi.cru')
  .argument('<deCours>', 'Code du cours (ex: ME01, L01)')
  .argument('<fichier>', 'Fichier CRU (.cru)')
  .action(({ args, logger }) => {
    const codeCours = args.deCours;
    const chemin = args.fichier;

    try {
      const contenu = fs.readFileSync(chemin, 'utf8');
      const creneaux = parseCRU(contenu);

      const selection = creneaux.filter(c => c.courseCode === codeCours);

      if (selection.length === 0) {
        logger.warn(`Aucun résultat trouvé pour le cours ${codeCours} dans ${chemin}`);
        return;
      }

      const lignes = selection.map(c =>
        `${c.day} ${c.start}-${c.end} | ${c.kind} | ${c.room} | ${c.capacity} places`
      );

      logger.info(lignes.join('\n'));
    } catch (err) {
      // NF2 : messages d'erreur détaillés
      if (err.code === 'ENOENT') {
        logger.error(`Fichier non trouvé: ${args.fichier}`);
      } else if (err.message.includes('CRU invalide') || err.message.includes('parseCRU')) {
        logger.error(`Format CRU invalide: ${err.message}`);
      } else {
        logger.error(`Erreur CLI: ${err.message}`);
      }
    }
  });

// SPEC2 
cli
  .command('salle-capacite', 'Capacité max d\'une salle\nEx: sru salle-capacite B101 emploi.cru')
  .argument('<nomSalle>', 'Salle (ex: B101, A205)')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    const nomSalle = args.nomSalle;
    const chemin = args.fichier;

    try {
      const contenu = fs.readFileSync(chemin, 'utf8');
      const creneaux = parseCRU(contenu);

      const caps = creneaux
        .filter(c => c.room === nomSalle)
        .map(c => c.capacity);

      if (caps.length === 0) {
        logger.warn(`Aucun créneau trouvé pour la salle ${nomSalle} dans ${chemin}`);
        return;
      }

      const maxCap = Math.max(...caps);
      logger.info(`Capacité maximale de la salle ${nomSalle} : ${maxCap} places`);
    } catch (err) {
        // NF2 : messages d'erreur détaillés
      if (err.code === 'ENOENT') {
        logger.error(`Fichier non trouvé: ${args.fichier}`);
      } else if (err.message.includes('CRU invalide') || err.message.includes('parseCRU')) {
        logger.error(`Format CRU invalide: ${err.message}`);
      } else {
        logger.error(`Erreur CLI: ${err.message}`);
      }
    }
  });

// SPEC3 : salle-creneaux
cli
  .command('salle-creneaux', 'Créneaux d\'une salle\nEx: sru salle-creneaux B101 emploi.cru')
  .argument('<nomSalle>', 'Salle (ex: B101)')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    const nomSalle = args.nomSalle;
    const chemin = args.fichier;

    try {
      const contenu = fs.readFileSync(chemin, 'utf8');
      const creneaux = parseCRU(contenu);

      // tri par jour/heure
      const list = creneaux
        .filter(c => c.room === nomSalle)
        .sort((a, b) => a.day.localeCompare(b.day) || a.start.localeCompare(b.start));

      if (list.length === 0) {
        logger.info('✅ Salle libre sur toute la semaine');  // Hong NF2
        return;
      }


      const lignes = list.map(c =>
        `${c.day} ${c.start}-${c.end} | ${c.courseCode} | ${c.kind} | ${c.capacity} places`
      );
      logger.info(lignes.join('\n'));
    } catch (err) {
      // NF2 : messages d'erreur détaillés
      if (err.code === 'ENOENT') {
        logger.error(`Fichier non trouvé: ${args.fichier}`);
      } else if (err.message.includes('CRU invalide') || err.message.includes('parseCRU')) {
        logger.error(`Format CRU invalide: ${err.message}`);
      } else {
        logger.error(`Erreur CLI: ${err.message}`);
      }
    }
  });

// SPEC4 : Salles libres sur un créneau 
cli
  .command('salles-libres', 'Salles libres sur créneau\nEx: sru salles-libres L 0900 1100 emploi.cru')
  .argument('<jour>', 'Jour (L,MA,ME,J,V)')
  .argument('<heureDebut>', 'HHMM (ex: 0900)')
  .argument('<heureFin>', 'HHMM (ex: 1100)')
  .argument('<fichier>', 'Fichier CRU')
  .action(({ args, logger }) => {
    const jour = args.jour;
    const hDeb = args.heureDebut;
    const hFin = args.heureFin;
    const chemin = args.fichier;

    try {
     
      if (!/^(L|MA|ME|J|V)$/.test(jour) || !/^\d{4}$/.test(hDeb) || !/^\d{4}$/.test(hFin)) {
        logger.error('Format invalide. Utiliser: JOUR (L,MA,ME,J,V) et HHMM HHMM');
        return;
      }

      if (hDeb >= hFin) {
        logger.error('Heure de début doit être < heure de fin');
        return;
      }

      const contenu = fs.readFileSync(chemin, 'utf8');
      const creneaux = parseCRU(contenu);

      // Toutes les salles + capacité max (réutilise SPEC2)
      const salles = new Map(); // room -> maxCap
      for (const c of creneaux) {
        const prev = salles.get(c.room);
        if (!prev || c.capacity > prev) {
          salles.set(c.room, c.capacity);
        }
      }

      // Salles occupées sur ce créneau (overlap)
      const occupees = new Set();
      for (const c of creneaux) {
        if (c.day !== jour) continue;
        const overlap = !(c.end <= hDeb || c.start >= hFin);
        if (overlap) {
          occupees.add(c.room);
        }
      }

      // Salles libres = toutes - occupées
      const libres = [];
      for (const [room, maxCap] of salles) {
        if (!occupees.has(room)) {
          libres.push({ room, maxCap });
        }
      }

      
      if (libres.length === 0) {
        logger.warn(' Aucune salle libre sur ce créneau');  // Hong NF2
        return;
      }


      // TRI PAR CAPACITÉ CROISSANTE (SPEC4)
      libres.sort((a, b) => a.maxCap - b.maxCap);

      const lignes = libres.map(s => `${s.room} ${s.maxCap} places`);
      logger.info(`Salles libres le ${jour} ${hDeb}-${hFin} :\n` + lignes.join('\n'));
    } catch (err) {
      // NF2 : messages d'erreur détaillés
      if (err.code === 'ENOENT') {
        logger.error(`Fichier non trouvé: ${args.fichier}`);
      } else if (err.message.includes('CRU invalide') || err.message.includes('parseCRU')) {
        logger.error(`Format CRU invalide: ${err.message}`);
      } else {
        logger.error(`Erreur CLI: ${err.message}`);
      }
    }
  });




// Lancement du CLI
cli.run(process.argv.slice(2));

