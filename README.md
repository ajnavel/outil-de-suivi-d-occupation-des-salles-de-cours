# GL02_BLACKLIST

# Outil de suivi d’occupation des salles (SRU)

## Résumé du projet

Ce projet est un programme en ligne de commande qui lit des fichiers d’emploi du temps au format CRU de l’université et fournit plusieurs fonctionnalités pour les étudiants, enseignants et gestionnaires de locaux.  
Il permet de rechercher les salles associées à un cours, de consulter les capacités des salles, de vérifier les conflits d’occupation, de trouver des salles libres sur un créneau, d’exporter des cours au format iCalendar et de calculer le taux d’occupation des salles, avec une attention particulière à l’ergonomie de la CLI et à la fiabilité des données.

## Spécifications fonctionnelles

### SPEC1 – Rechercher les salles associées à un cours

Permet d’afficher, pour un code de cours donné, la liste des créneaux avec jour, heure, type, salle et capacité. 

exemple d'utilisation : 
Affiche les créneaux (jour, heure, type d’enseignement, salle, capacité) pour le cours dont le code est `ME01` dans le fichier `data.cru`.[file:2][file:3]

$node sruCli.js cours-salles ME01 data.cru

### SPEC2 – Consulter la capacité maximale d’une salle

Affiche la capacité maximale rencontrée pour une salle donnée dans le fichier CRU. 

exemple d'utilisation :
Affiche la capacité maximale observée pour la salle `B101` à partir des créneaux du fichier CRU.[file:2][file:3]

$node sruCli.js salle-capacite B101 data.cru

### SPEC3 – Afficher les créneaux d’une salle donnée

Liste tous les créneaux planifiés dans une salle (jour, heures, cours, type, capacité) ou indique que la salle est libre sur la semaine si aucun créneau n’est trouvé. 

exemple d'utilisation :
Liste tous les créneaux où la salle `B101` est utilisée (jour, heure, cours, type, capacité), ou indique si la salle est libre toute la semaine.[file:2][file:3]

$node sruCli.js salle-creneaux B101 data.cru

### SPEC4 – Rechercher les salles libres pour un créneau

Pour un jour et un intervalle horaire donnés, affiche les salles non occupées sur ce créneau, triées par capacité croissante, avec un message explicite si le format est invalide ou si aucune salle n’est libre.

exemple d'utilisation :

Affiche les salles libres le mardi (`MA`) entre 10h00 et 12h00, triées par capacité croissante.[file:2][file:3]

$node sruCli.js salles-libres MA 1000 1200 data.cru

### SPEC5 – Vérifier les conflits d’occupation des salles

Analyse tous les créneaux par salle et par jour, détecte les chevauchements horaires et affiche la liste des conflits ou un message indiquant l’absence de conflit.

exemple d'utilisation :

Affiche les créneaux (jour, heure, type d’enseignement, salle, capacité) pour le cours dont le code est `ME01` dans le fichier `data.cru`.[file:2][file:3]

$node sruCli.js conflits data.cru

### SPEC6 – Générer un emploi du temps iCalendar

À partir d’un code de cours et d’une période `[dateDébut, dateFin]`, génère un fichier `.ics` contenant les séances du cours, au format compatible avec les agendas (RFC 5545). Gère les cas “aucun cours sur la période” et “dates invalides”.

exemple d'utilisation : 

Génère un fichier `export_ME01.ics` contenant les séances du cours `ME01` entre le 1er janvier 2025 et le 31 janvier 2025, au format iCalendar.[file:2][file:3]

$node sruCli.js export-ical 20250101 20250131 ME01 data.cru

### SPEC7 – Calculer le taux d’occupation des salles

Calcule, pour chaque salle, le temps total occupé sur la semaine par rapport à un temps disponible de référence, puis affiche un taux d’occupation en pourcentage et peut générer un rapport CSV.

exemple d'utilisation : 

Affiche pour chaque salle le temps occupé, le temps total disponible et le taux d’occupation en pourcentage.[file:2][file:3]

$node sruCli.js occupation data.cru

## Commande utilitaire 

### Lire un fichier brut

Affiche le contenu du fichier `data.cru` dans la console.[file:2][file:3]
$node sruCli.js read data.cru

### Informations sur une commande 
Pour plus de détails sur les arguments et options de chaque commande, utiliser :
$node sruCli.js <commande> --help

## Spécifications non fonctionnelles

### NF1 – Portabilité et compatibilité

Le programme doit s’exécuter en ligne de commande sur les principaux systèmes (Windows, Linux, macOS) avec un environnement d’exécution standard, sans dépendances exotiques.  
Les résultats produits doivent être identiques à partir du même fichier CRU.

### NF2 – Interface en ligne de commande claire

Les commandes sont nommées de manière explicite, chaque commande dispose d’arguments clairement décrits et de messages d’aide/erreur lisibles.  
En cas de mauvaise commande ou d’arguments manquants/invalides, un message informatif est affiché, et l’utilisateur peut consulter l’aide intégrée.

### NF3 – Fiabilité et cohérence des données

Le programme valide le format CRU (nombre de champs, format horaire, capacité, jours valides, etc.) et signale précisément les erreurs (numéro de ligne, type d’erreur).  
Les créneaux incohérents sont rejetés avec un message d’erreur, les conflits d’occupation sont détectés, et les calculs (occupations, iCalendar, salles libres) ne se font que sur des données considérées comme valides.


## Utilisation

Le programme fournit une interface en ligne de commande via `sruCli.js`.  
Toutes les commandes disposent d’une aide intégrée, accessible avec l’option `--help`.[file:2][file:3]

### Aide générale

node sruCli.js --help
