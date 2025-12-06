# GL02 - Sujet B - Groupe Xx_Master_Coder_10000_xX

---

Ce projet fait l'objet d'un outil de gestion, simulation et analyse de fichiers GIFT demandé par le SRYEM dans le cadre du module GL02.


##  Couverture fonctionnelle
- **Recherche avancée** (EF01)  
- **Affichage complet** d’une question (EF02)  
- **Sélection / Ajout / Gestion des doublons** (EF03–EF04)  
- **Contrôle des contraintes institutionnelles** (EF05)  
- **Export GIFT** conforme Moodle (EF06)  
- **Génération vCard** (EF07)  
- **Simulation de passation** (EF08)  
- **Bilan détaillé** avec score (EF09)  
- **Analyse statistique du profil d’examen** (EF10)

##  Données de référence
L’outil exploite l’intégralité des fichiers fournis dans `SujetB_data/` pour :
- tester le parseur  
- enrichir la banque de questions  
- analyser des profils réels  

##  Développement coopératif
Le travail a été réalisé sur GitLab avec :
- branche `main` stable  
- branche `dev` pour les développements  

#  Lancer l'application **SRYEM Gift File Editor**

Cette application fonctionne en **Node.js** avec **TypeScript**.  
Voici les étapes exactes pour l’installer, la compiler, puis l’exécuter.

---

## 1. INSTALLER NODE.JS ET NPM

Si vous n’avez pas encore Node.js :

--> Télécharger et installer depuis : https://nodejs.org/

Cela installe automatiquement :
- **node**
- **npm** (gestionnaire de paquets)

Vérifier l’installation :

```bash
node -v
npm -v
```

---

## 2. INSTALLER LES DÉPENDANCES

Dans un terminal, placez-vous dans le dossier du projet :

```bash
cd GL02_Xx_Master_Coder_10000_xX
npm install
```

---

## 3. COMPILER LE PROJET TYPESCRIPT

Le projet utilise TypeScript, il doit donc être **compilé avant chaque exécution**.

```bash
npm run build
```

 **IMPORTANT :**  
À chaque fois que vous modifiez un fichier dans `src/`, vous devez refaire :

```bash
npm run build
```

afin de mettre à jour les fichiers compilés dans `dist/`.

---

## 4. DÉMARRER L’APPLICATION

Une fois compilé :

```bash
npm start
```

Cela lance le programme et affiche le **menu principal**.

---

##  MENU 1 — CHOIX DU MODE (ÉCRAN INITIAL)

Après avoir lancé `npm start`, vous arrivez sur :

```
SRYEM Gift file editor

Do you want to create a new Gift file or edit an existing one?
❍ Edit an existing Gift file
❍ Create a new Gift file
❍ Export exam to GIFT file
❍ Create teacher vCard
❍ Exit
```

Sélectionner :

```
Edit an existing Gift file
```

Cela permet de charger un fichier depuis **SujetB_data/**.

---

##  MENU 2 — MENU COMPLET DES FONCTIONNALITÉS

Une fois le fichier GIFT chargé, vous accédez au menu principal :

```
What do you want to do?

❍ List all questions
❍ Search questions
❍ View question details
❍ Simulate exam           
❍ Show exam summary       
❍ Analyze exam profile    
❍ Edit a question
❍ Add a new question
❍ Delete a question
❍ Export exam to GIFT file
❍ Create teacher vCard
❍ Exit
```

Depuis ce menu, vous pouvez :
- consulter les questions  
- rechercher par mot-clé  
- afficher les détails  
- ajouter / supprimer / éditer 
- simuler une passation  
- afficher le bilan   
- analyser le profil du test  
- exporter un examen en fichier GIFT   
- générer une vCard 

---
