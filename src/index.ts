import { parseGiftFile } from "./parser";
import * as fs from 'fs';
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

    s.stop('Successfully parsed the Gift file');


    let action = '';
    while (action !== 'exit') {
        action = await select({
            message: 'What do you want to do?',
            options: [
                { value: 'list', label: 'List all questions' },
                { value: 'view', label: 'View a question' },
                { value: 'edit', label: 'Edit a question' },
                { value: 'add', label: 'Add a new question' },
                { value: 'delete', label: 'Delete a question' },
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
            // Exemple simple pour lister (utile pour vérifier avant export)
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
            
        case 'exit':
            console.log("Goodbye!");
            process.exit(0);
    }
    }

    outro(`Thank you for using SRYEM Gift File editor !`);

}

main();