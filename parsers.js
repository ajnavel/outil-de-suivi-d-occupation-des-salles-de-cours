const fs = require('fs');

function parseCRU(content) {
  const rawLines = content.split(/\r?\n/);
  const creneaux = [];
  let currentCourse = null;
  let lineNumber = 0;

  for (const raw of rawLines) {
    lineNumber++;
    const line = raw.trim();
    if (line === '') continue;  // Ignore lignes vides

    // Ligne de code de cours (ex: "ME01")
    if (!line.includes(',')) {
      currentCourse = line;
      continue;
    }

    const parts = line.split(',').map(p => p.trim());

    // On attend 9 champs pour un créneau CRU bien formé
    if (parts.length !== 9) {
      throw new Error(`Ligne CRU invalide à la ligne ${lineNumber}: "${line}"`);
    }

    if (!currentCourse) {
      throw new Error(`Ligne CRU sans code de cours à la ligne ${lineNumber}: "${line}"`);
    }

    const [
      index,
      kind,
      subgrp,
      capacityRaw,
      schedule,
      day,
      timeRange,
      filiere,
      room
    ] = parts;

    // Vérif format horaire "HHMM-HHMM"
    const m = /^(\d{4})-(\d{4})$/.exec(timeRange);
    if (!m) {
      throw new Error(`Heure invalide à la ligne ${lineNumber}: "${timeRange}"`);
    }

    const start = m[1];
    const end = m[2];

    // Vérif capacité > 0
    const capacityStr = capacityRaw.replace(/^P/, '');
    const capacity = Number(capacityStr);
    if (!Number.isFinite(capacity) || capacity <= 0) {
      throw new Error(`Capacité invalide à la ligne ${lineNumber}: "${capacityRaw}"`);
    }

    // (Optionnel NF3) Vérif jour dans l’ensemble attendu
    const joursValides = ['L', 'MA', 'ME', 'J', 'V'];
    if (!joursValides.includes(day)) {
      throw new Error(`Jour invalide à la ligne ${lineNumber}: "${day}"`);
    }

    creneaux.push({
      index,
      courseCode: currentCourse,
      kind,
      subgrp,
      capacity,
      schedule,
      day,
      start,
      end,
      filiere,
      room
    });
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

