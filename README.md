# GL02 - Sujet B - Groupe Xx_Master_Coder_10000_xX

---


L’objectif principal de l’outil est de permettre à un enseignant de **composer un examen complet** au format GIFT en sélectionnant des questions issues de la banque officielle fournie dans `SujetB_data/`.

Chaque fichier `.gift` du dossier représente un **exercice thématique** contenant plusieurs questions.
Un examen réglementaire du SRYEM doit contenir **entre 15 et 20 questions**, sans doublons.



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

#  Composition d’un examen à partir de la banque nationale SRYEM

---

##  1. Charger un premier fichier GIFT

Depuis le menu initial :

```
Edit an existing Gift file
```

Sélectionnez un fichier de `SujetB_data/`.
Ce premier fichier sert de **base** : ses questions remplissent initialement l’examen en cours.

Utilisez ensuite `List all questions` pour visualiser le contenu actuel.

---

##  2. Ajouter des questions depuis la banque SRYEM

Dans le menu principal :

```
Add a new question
→ Select file & questions from SujetB_data
```

Vous pouvez alors :

* parcourir les fichiers de la banque
* afficher leurs questions
* importer celles que vous souhaitez ajouter à votre examen

Les doublons sont automatiquement détectés et **ignorés**.

Vous pouvez répéter l’opération autant que nécessaire jusqu’à obtenir **15 à 20 questions**.

---

##  3. Vérifier la composition de votre examen

À tout moment, utilisez :

```
List all questions
```

pour vérifier :

* le nombre total de questions
* leur type et leur ordre
* l’absence de doublons

C’est l’outil lui-même qui garantit la conformité avec la règle **15 ≤ nombre de questions ≤ 20** lors de l’export.

---

##  4. Exporter l’examen final

Lorsque l’examen est complet :

```
Export exam to GIFT file
```

L’outil vérifie automatiquement les contraintes du SRYEM :

* examen entre 15 et 20 questions
* absence de doublons
* format conforme Moodle

Si tout est correct, un fichier `.gift` est généré (ex : `./my-exam.gift`).
Ce fichier peut ensuite être chargé à nouveau, envoyé ou déployé sur un serveur Moodle.

---

## 5. Simuler la passation d’un examen 

Pour vérifier ou tester l’examen :

```
Simulate exam
```

L’utilisateur répond de manière interactive à chaque question.
Les réponses sont enregistrées uniquement pour la session courante.

---

##  6. Afficher le bilan de passation 

Après une simulation :

```
Show exam summary
```

L’outil affiche :

* les réponses correctes / incorrectes
* le score global sur 20
* la liste des questions notées et non notées

---

##  7. Analyser le profil de l’examen 

Via :

```
Analyze exam profile
```

L’outil génère un histogramme textuel représentant la **répartition des types de questions**.

---

###  Tests unitaires
Les tests unitaires ont été réalisés avec **Jasmine**.  
Ils sont situés dans le dossier `/spec` et couvrent les principales fonctionnalités :

- parsing GIFT
- gestion des doublons
- validation des contraintes institutionnelles (15–20 questions)
- export GIFT
- analyse statistique du profil d’examen

Les tests s’exécutent via :
```
npm run build
npm test
```