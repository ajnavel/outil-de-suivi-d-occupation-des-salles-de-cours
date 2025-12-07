import { Exam, Question, QuestionType, AnswerOption } from './classes';
import { parseGiftFile } from "./parser";
import * as fs from 'fs';
import * as path from 'path';
import { intro, outro, select, spinner, text } from '@clack/prompts';
import { GiftExporter } from "./writer";
import { VCardGenerator } from "./vcard";

async function main() {

    intro(`SRYEM Gift file editor`);

    // Start file from scratch or use an existing one
    const projectType = await select({
        message: 'Do you want to create a new Gift file or edit an existing one?',
        options: [
            { value: 'edit', label: 'Edit an existing Gift file' },
            { value: 'new', label: 'Create a new Gift file' },
            { value: 'export', label: 'Export exam to GIFT file' },
            { value: 'vcard', label: 'Create teacher vCard' },
            { value: 'exit', label: 'Exit' },
        ],
    });

    if (projectType === 'new') {
        outro(`Feature to create new Gift files is coming soon!`);
        process.exit(0);
    }

    const filePath = await text({
        message: 'What is the file\'s path?',
        placeholder: './SujetB_data/EM-U5-p34-Voc.gift',
        initialValue: './SujetB_data/EM-U5-p34-Voc.gift',
        validate(value) {
            // check if you can access the file use fs
            if (!fs.existsSync(value)) {
                return 'File does not exist';
            }
        },
    });

    const s = spinner();
    s.start('Parsing the Gift file...');

    // parse the gift file
    const exam = parseGiftFile(filePath as string);
    // artificial delay to see the spinner
    await new Promise(resolve => setTimeout(resolve, 600));

    // Stockage des réponses utilisateur pour la simulation 
    const userAnswers: Map<number, string> = new Map();
    s.stop('Successfully parsed the Gift file');


    let action = '';
    while (action !== 'exit') {
        action = await select({
            message: 'What do you want to do?',
            options: [
                { value: 'list', label: 'List all questions' },
                { value: 'search', label: 'Search questions' }, // <---  (EFO1)
                { value: 'view', label: 'View question details' }, // <--- EFO2
                { value: 'simulate', label: 'Simulate exam' }, // <---  (EFO8)
                { value: 'summary',  label: 'Show exam summary' }, // <---  (EFO9)
                { value: 'profile',  label: 'Analyze exam profile' }, // <-- (EF10)
                { value: 'edit', label: 'Edit a question' },
                { value: 'add', label: 'Add a new question' },
                { value: 'delete', label: 'Delete a question' },
                { value: 'export', label: 'Export exam to GIFT file' },
                { value: 'vcard', label: 'Create teacher vCard' },
                { value: 'exit', label: 'Exit' },
            ],
        }) as string

        switch (action) {
            case 'export':
                const exportPath = await text({
                    message: 'Where do you want to save the GIFT file?',
                    placeholder: './my-exam.gift',
                    validate(value) {
                        if (!value.endsWith('.gift')) return 'File must end with .gift';
                    },
                });

                if (typeof exportPath === 'string') {
                    const s = spinner();
                    s.start('Saving file...');

                    const success = GiftExporter.save(exam, exportPath);

                    if (success) {
                        s.stop(`Successfully saved exam to ${exportPath}`);
                    } else {
                        s.stop('Export failed (check criteria or permissions)');
                    }
                }
                break;

            case 'list':
                console.log('\n--- Current Exam Questions ---');
                exam.questions.forEach((q, idx) => {
                    console.log(`${idx + 1}. [${q.type}] ${q.title}`);
                });
                break;

            case 'vcard':
                intro('vCard Generator');

                // Collecte des informations
                const lastName = await text({ message: 'Last Name (Nom):', placeholder: 'Doe', validate: v => !v ? 'Required' : undefined }) as string;
                const firstName = await text({ message: 'First Name (Prénom):', placeholder: 'John', validate: v => !v ? 'Required' : undefined }) as string;
                const email = await text({ message: 'Email:', placeholder: 'john.doe@school.sealand', validate: v => !v ? 'Required' : undefined }) as string;
                const org = await text({ message: 'Organization:', placeholder: 'SRYEM' }) as string;
                const phone = await text({ message: 'Phone (optional):', placeholder: '+33 6 12 34 56 78' }) as string;

                // Génération du contenu
                const vcardContent = VCardGenerator.generate(firstName, lastName, email, org, phone);

                // Sauvegarde
                const vcardPath = `./${firstName}_${lastName}.vcf`.replace(/\s+/g, '_');
                VCardGenerator.save(vcardPath, vcardContent);

                outro(`vCard created successfully: ${vcardPath}`);
                break;

            // EFO1 : RECHERCHE PAR MOT-CLÉ
            case 'search':
                const searchPattern = await text({
                    message: 'Enter a keyword to search:',
                    placeholder: 'grammar',
                    validate: (val) => val.length < 2 ? 'Please enter at least 2 characters' : undefined
                });

                if (typeof searchPattern === 'string') {
                    const term = searchPattern.toLowerCase();

                    const matches = exam.questions.filter(q => {
                        // 1. Titre et Texte
                        const inHeader = (q.title && q.title.toLowerCase().includes(term)) ||
                            (q.text && q.text.toLowerCase().includes(term));

                        // 2. Réponses (Answers)
                        const inAnswers = q.answers.some(ans =>
                            // Cherche dans le texte de la réponse
                            ans.text.toLowerCase().includes(term) ||
                            // Cherche dans le feedback
                            (ans.feedback && ans.feedback.toLowerCase().includes(term)) ||
                            // Cherche dans la partie "Droite" des questions d'appariement (Ex: Japan -> TOKYO)
                            (ans.matchText && ans.matchText.toLowerCase().includes(term))
                        );

                        return inHeader || inAnswers;
                    });

                    console.log(`\n Found ${matches.length} matching question(s):`);
                    matches.forEach((q, index) => {
                        const realIndex = exam.questions.indexOf(q);
                        // On coupe le titre s'il est trop long
                        const displayTitle = q.title.length > 50 ? q.title.substring(0, 50) + "..." : q.title;
                        console.log(`   [ID: ${realIndex + 1}] [${q.type}] ${displayTitle}`);
                    });
                }
                break;

            // EFO2 : VISUALISATION DÉTAILLÉE
            case 'view':
                // 1. Sélection
                const viewOptions = exam.questions.map((q, idx) => ({
                    value: idx,
                    label: `${idx + 1}. [${q.type}] ${q.title.slice(0, 50)}`
                }));
                viewOptions.push({ value: -1, label: '⬅ Back to menu' });

                const selectedId = await select({
                    message: 'Select a question to view details:',
                    options: viewOptions,
                });

                if (selectedId === -1 || typeof selectedId !== 'number') break;

                const q = exam.questions[selectedId];

                // 2. Affichage Header
                console.log('\n' + '─'.repeat(60));
                console.log(`DETAILS FOR QUESTION #${selectedId + 1}`);
                console.log('─'.repeat(60));
                console.log(`Type:     ${q.type}`);
                console.log(`Title:    ${q.title}`);
                console.log('─'.repeat(20) + ' Question Text ' + '─'.repeat(20));
                console.log(q.text); // Affiche le texte brut (avec balises [html] si présentes, c'est normal)
                console.log('─'.repeat(60));

                // 3. Affichage Réponses (Switch intelligent selon le type)
                console.log('ANSWERS / CONTENT:');

                switch (q.type) {
                    case QuestionType.Description:
                        console.log("(Info / Description - No answers expected)");
                        break;
                    
                    case QuestionType.Essay:
                        console.log("(Essay - Open ended answer)");
                        break;

                    case QuestionType.Matching:
                        q.answers.forEach(ans => {
                            // Affiche :  Left term  ---->  Right term
                            console.log(` ${ans.text.padEnd(20)} ---->  ${ans.matchText}`);
                        });
                        break;

                    case QuestionType.TrueFalse:
                        const correctVal = q.answers.find(a => a.isCorrect)?.text;
                        console.log(`   Correct Answer: ${correctVal?.toUpperCase()}`);
                        break;
                    
                    case QuestionType.Numerical:
                         console.log(`   Value: ${q.answers[0]?.text}`);
                         break;

                    default: 
                        // Cas standard (QCM, Short Answer)
                        if (q.answers.length === 0) {
                            console.log('   (No answers defined)');
                        } else {
                            q.answers.forEach(ans => {
                                const icon = ans.isCorrect ? 'T' : 'F';
                                let ansText = `   ${icon} ${ans.text}`;
                                if (ans.weight) ansText += ` (Partial credit: ${ans.weight}%)`;
                                console.log(ansText);
                                if (ans.feedback) console.log(`      ↳ 💬 Feedback: ${ans.feedback}`);
                            });
                        }
                        break;
                }
                console.log('─'.repeat(60) + '\n');
                
                await text({ message: 'Press Enter to return...', placeholder: '' });
                break;

            // DELETE
            case 'delete':
                if (exam.questions.length === 0) {
                    console.log("The exam is empty. Nothing to delete.");
                    break;
                }

                const deleteId = await select({
                    message: 'Select a question to DELETE:',
                    options: [
                        ...exam.questions.map((q, idx) => ({
                            value: idx,
                            label: `${idx + 1}. ${q.title} [${q.type}]`
                        })),
                        { value: -1, label: '⬅ Cancel' }
                    ]
                });

                if (typeof deleteId === 'number' && deleteId !== -1) {
                    const removed = exam.questions.splice(deleteId, 1);
                    console.log(`Deleted: "${removed[0].title}"`);
                }
                break;

            // EF08 : Simulation de passation d'examen
                        // EF08 : Simulation de passation d'examen
            case 'simulate':
                if (exam.questions.length === 0) {
                    console.log('\nNo questions in the exam, nothing to simulate.');
                    break;
                }

                console.log('\n=== EXAM SIMULATION ===');
                userAnswers.clear();

                // On prépare la liste des questions à poser
                const allQuestions = [...exam.questions];

                // Mélange simple (Fisher–Yates)
                for (let i = allQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
                }

                // Nombre de questions à poser (max 20)
                const MAX_QUESTIONS = 20;
                const questionsToAsk = allQuestions.slice(0, Math.min(MAX_QUESTIONS, allQuestions.length));

                console.log(`\nThis simulation will ask you ${questionsToAsk.length} question(s).`);

                for (let i = 0; i < questionsToAsk.length; i++) {
                    const q = questionsToAsk[i];
                    const originalIndex = exam.questions.indexOf(q); // pour recoller avec userAnswers

                    console.log('\n' + '-'.repeat(60));
                    console.log(`Q${i + 1} [${q.type}]`);
                    console.log(q.text);

                    // Affichage des réponses possibles quand il y en a
                    if (q.answers && q.answers.length > 0 && q.type !== QuestionType.TrueFalse) {
                        q.answers.forEach((ans, idx) => {
                            console.log(`  ${idx + 1}) ${ans.text}`);
                        });
                    }

                    let answerStr: string;

                    if (q.type === QuestionType.TrueFalse) {
                        const tfChoice = await select({
                            message: 'Your answer:',
                            options: [
                                { value: 'TRUE',  label: 'TRUE' },
                                { value: 'FALSE', label: 'FALSE' },
                            ]
                        });
                        answerStr = String(tfChoice);
                    } else {
                        const raw = await text({
                            message: 'Your answer (text or number):',
                            placeholder: '1'
                        });
                        answerStr = typeof raw === 'string' ? raw.trim() : '';
                    }

                    // On stocke par rapport à l'indice ORIGINAL de la question
                    userAnswers.set(originalIndex, answerStr);
                }

                console.log('\nSimulation finished. You can now see the summary with "Show exam summary".');
                break;

            // EF09 : Bilan des réponses après simulation
            case 'summary':
                if (exam.questions.length === 0) {
                    console.log('\nNo exam loaded.');
                    break;
                }
                if (userAnswers.size === 0) {
                    console.log('\nNo simulation done yet.');
                    break;
                }

                console.log('\n=== EXAM SUMMARY ===');

                let graded = 0;
                let correctCount = 0;

                exam.questions.forEach((q, idx) => {
                    const user = userAnswers.get(idx);
                    const correctOptions = q.answers?.filter(a => a.isCorrect) ?? [];

                    // Cas non noté : pas de bonne réponse définie (description, etc.)
                    if (!user || correctOptions.length === 0) {
                        console.log(`Q${idx + 1}: Not graded (no correct answer defined)`);
                        return;
                    }

                    graded++;

                    // On simplifie : une seule bonne réponse "principale"
                    const mainCorrect = correctOptions[0];
                    const normalizedUser = user.trim().toUpperCase();
                    const normalizedCorrect = mainCorrect.text.trim().toUpperCase();

                    const isCorrect = normalizedUser === normalizedCorrect;
                    if (isCorrect) correctCount++;

                    console.log(
                        `Q${idx + 1}: ${isCorrect ? 'Correct' : 'Incorrect'} ` +
                        `(your answer: "${user}", correct: "${mainCorrect.text}")`
                    );
                });

                console.log('\n--- Summary ---');
                console.log(`Graded questions: ${graded}/${exam.questions.length}`);
                console.log(`Correct answers:  ${correctCount}/${graded}`);
                if (graded > 0) {
                    const score = (correctCount / graded) * 20;
                    console.log(`Score (on 20):   ${score.toFixed(2)}`);
                }
                break;
            // EF10 : Analyse du profil de test
            case 'profile':
                if (exam.questions.length === 0) {
                    console.log('\nNo exam loaded to analyze.');
                    break;
                }

                console.log('\n=== EXAM PROFILE ===');

                const stats: Record<string, number> = {};
                exam.questions.forEach(q => {
                    const key = String(q.type);
                    stats[key] = (stats[key] || 0) + 1;
                });

                const total = exam.questions.length;

                Object.entries(stats).forEach(([type, count]) => {
                    const pct = (count / total) * 100;
                    // Petit histogramme textuel
                    const bar = '#'.repeat(Math.round(pct / 5)); // 1 # = 5%
                    console.log(`${type.padEnd(15)} : ${count.toString().padStart(3)}  (${pct.toFixed(1)}%)  ${bar}`);
                });

                console.log(`\nTotal questions: ${total}`);
                break;

            // EDIT
            case 'edit':
                if (exam.questions.length === 0) {
                    console.log("The exam is empty.");
                    break;
                }

                const editId = await select({
                    message: 'Select a question to EDIT:',
                    options: [
                        ...exam.questions.map((q, idx) => ({
                            value: idx,
                            label: `${idx + 1}. ${q.title}`
                        })),
                        { value: -1, label: '⬅ Cancel' }
                    ]
                });

                if (typeof editId === 'number' && editId !== -1) {
                    const qToEdit = exam.questions[editId];

                    const field = await select({
                        message: `Editing "${qToEdit.title}". What do you want to change?`,
                        options: [
                            { value: 'title', label: 'Title' },
                            { value: 'text', label: 'Text (Enoncé)' },
                            { value: 'cancel', label: 'Cancel' }
                        ]
                    });

                    if (field === 'title') {
                        const newTitle = await text({
                            message: 'New Title:',
                            initialValue: qToEdit.title
                        });
                        if (typeof newTitle === 'string') qToEdit.title = newTitle;
                    } else if (field === 'text') {
                        const newText = await text({
                            message: 'New Text:',
                            initialValue: qToEdit.text
                        });
                        if (typeof newText === 'string') qToEdit.text = newText;
                    }
                    console.log("Question updated.");
                }
                break;


            // AJOUT (EFO3 : Selection / Ajout)
            case 'add':
            const addMethod = await select({
                message: 'How do you want to add questions?',
                options: [
                    { value: 'bank_all', label: 'Import EVERYTHING from SujetB_data (Mass Test)' }, // Nouvelle option
                    { value: 'bank_select', label: 'Select file & questions from SujetB_data' },
                    { value: 'manual', label: 'Create manually' },
                    { value: 'cancel', label: '⬅ Cancel' }
                ]
            });

            // OPTION 1 : IMPORT MASSIF (Idéal pour tester tous les types)
            if (addMethod === 'bank_all') {
                const dataDir = './SujetB_data';
                
                if (!fs.existsSync(dataDir)) {
                    console.log(`Error: Directory ${dataDir} not found.`);
                    break;
                }

                const sBulk = spinner();
                sBulk.start('Scanning directory and parsing ALL files...');

                try {
                    // 1. Lister tous les fichiers .gift
                    const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.gift'));
                    
                    let totalAdded = 0;
                    
                    // 2. Boucler sur chaque fichier
                    for (const file of files) {
                        const fullPath = path.join(dataDir, file);
                        const bankExam = parseGiftFile(fullPath);
                        
                        // 3. Ajouter toutes les questions
                        for (const q of bankExam.questions) {
                            if (exam.addQuestion(q)) {
                                totalAdded++;
                            }
                        }
                    }
                    
                    sBulk.stop(`Process complete.`);
                    console.log(`Imported ${totalAdded} new questions from ${files.length} files.`);
                    console.log(`(Duplicate questions were skipped automatically)`);

                } catch (err) {
                    sBulk.stop('Error during bulk import.');
                    console.error(err);
                }
            }

            // OPTION 2 : SELECTION FICHIER PAR FICHIER
            else if (addMethod === 'bank_select') {
                const dataDir = './SujetB_data';
                if (!fs.existsSync(dataDir)) {
                    console.log(`Directory not found.`);
                    break;
                }

                // On liste les fichiers pour laisser l'utilisateur choisir
                const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.gift'));
                
                const selectedFile = await select({
                    message: 'Choose a GIFT file to load:',
                    options: [
                        ...files.map(f => ({ value: f, label: f })),
                        { value: 'cancel', label: '⬅ Cancel' }
                    ]
                });

                if (selectedFile === 'cancel' || typeof selectedFile !== 'string') break;

                const sLoad = spinner();
                sLoad.start(`Loading ${selectedFile}...`);
                const bankExam = parseGiftFile(path.join(dataDir, selectedFile));
                sLoad.stop(`Loaded ${bankExam.questions.length} questions.`);

                // Sélection de la question spécifique
                const qIndexToAdd = await select({
                    message: 'Select a question to IMPORT:',
                    options: [
                        ...bankExam.questions.map((q, idx) => ({
                            value: idx,
                            label: `${q.title.slice(0,50)} (${q.type})`
                        })),
                        { value: -1, label: '⬅ Cancel' }
                    ]
                });

                if (typeof qIndexToAdd === 'number' && qIndexToAdd !== -1) {
                    const selectedQ = bankExam.questions[qIndexToAdd];
                    if (exam.addQuestion(selectedQ)) {
                        console.log(`Added: "${selectedQ.title}"`);
                    } else {
                        console.log(`Duplicate question ignored.`);
                    }
                }
            } 
            
            // OPTION 3 : MANUEL
            else if (addMethod === 'manual') {
                // ... (Garder votre code manuel existant ici) ...
                const qType = await select({
                    message: 'Question Type:',
                    options: [
                        { value: QuestionType.Essay, label: 'Essay (Open question)' },
                        { value: QuestionType.TrueFalse, label: 'True / False' },
                        { value: QuestionType.Description, label: 'Description (Instruction)' }
                    ]
                });
                
                const qTitle = await text({ message: 'Title:', placeholder: 'New Question' }) as string;
                const qText = await text({ message: 'Question Text:', placeholder: 'What is...?' }) as string;
                
                const newQ = new Question(qTitle, qText, qType as QuestionType);
                if (qType === QuestionType.TrueFalse) {
                    const tfVal = await select({
                        message: 'Correct Answer:',
                        options: [{ value: true, label: 'TRUE' }, { value: false, label: 'FALSE' }]
                    });
                    newQ.answers.push(new AnswerOption(tfVal ? "TRUE" : "FALSE", tfVal as boolean));
                }
                exam.addQuestion(newQ);
                console.log("New question created.");
            }
            break;

            case 'exit':
                console.log("Goodbye!");
                process.exit(0);
        }
    }

    outro(`Thank you for using SRYEM Gift File editor !`);

}

main();