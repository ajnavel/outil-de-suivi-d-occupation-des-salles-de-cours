import * as fs from 'fs';
import { Exam } from './classes';

export class GiftExporter {
    
    public static save(exam: Exam, filePath: string): boolean {
        try {
            // EFO5 - Vérification du nombre de questions (15-20)
            if (!exam.isValid()) {
                console.error("\nErreur: L'examen doit contenir entre 15 et 20 questions pour être exporté.");
                return false;
            }

            // Génération du contenu complet
            const fileContent = exam.questions.map(q => q.toGift()).join('\n\n');

            // Écriture du fichier
            fs.writeFileSync(filePath, fileContent, 'utf-8');
            return true;

        } catch (error) {
            console.error("Erreur lors de la sauvegarde du fichier:", error);
            return false;
        }
    }
}