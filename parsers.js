const fs = require('fs');

function parseCRU(content) {
  const rawLines = content.split(/\r?\n/);
  const creneaux = [];
  let currentCourse = null;

  for (const raw of rawLines) {
    const line = raw.trim();
    if (line === '') continue;

    // Détection du code de l'UE (ex: +GE04)
    if (line.startsWith('+')) {
      currentCourse = line.substring(1).trim();
      continue;
    }

    // On ignore les lignes qui ne ressemblent pas à un créneau (ex: commentaires, headers)
    // Un créneau commence généralement par un chiffre suivi d'une virgule
    if (!/^\d+,/.test(line)) {
      continue;
    }

    // Format attendu: 1,C1,P=56,H=L 14:00-16:00,F1,S=B101//
    const parts = line.split(',');
    if (parts.length < 6) {
      // Ligne mal formée ou format inconnu
      continue;
    }

    const type = parts[1].trim(); // C1, D1, T1...
    const capacityRaw = parts[2].trim(); // P=56
    const scheduleRaw = parts[3].trim(); // H=L 14:00-16:00
    const group = parts[4].trim(); // F1, F2...
    const roomRaw = parts[5].trim(); // S=B101//

    // Parsing de la capacité
    const capacityMatch = capacityRaw.match(/P=(\d+)/);
    const capacity = capacityMatch ? parseInt(capacityMatch[1], 10) : 0;

    // Parsing de l'horaire (Jour et Heure)
    // Ex: H=L 14:00-16:00 ou H=ME 8:00-10:00
    const scheduleMatch = scheduleRaw.match(/H=([A-Z]{1,2})\s+(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
    
    let day = '';
    let start = '';
    let end = '';

    if (scheduleMatch) {
      day = scheduleMatch[1];
      start = scheduleMatch[2];
      end = scheduleMatch[3];
    }

    // Parsing de la salle
    // Ex: S=B101//
    const roomMatch = roomRaw.match(/S=(.+?)\/\//);
    const room = roomMatch ? roomMatch[1] : '';

    if (currentCourse) {
      creneaux.push({
        courseCode: currentCourse,
        type,
        capacity,
        day,
        start,
        end,
        group,
        room
      });
    }
  }

  return creneaux;
}

// Bouchons pour compatibilité (non utilisés directement par ton CLI)
function getICalendar() {
  throw new Error('getICalendar non encore implémenté');
}

function getOccupancyCSV() {
  throw new Error('getOccupancyCSV non encore implémenté');
}

module.exports = { parseCRU, getICalendar, getOccupancyCSV };

