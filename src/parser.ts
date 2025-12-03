import * as fs from 'fs';
import { Question, QuestionType, AnswerOption, Category, Exam } from './classes';

export class GiftParser {
    private currentCategory: Category | null = null;

    constructor() { }

    public parse(filePath: string): Exam {
        const content = fs.readFileSync(filePath, 'utf-8');
        const exam = new Exam();

        // Split lines and handle comments/categories
        const lines = content.split(/\r?\n/);
        const cleanLines: string[] = [];

        for (let line of lines) {
            const trimmed = line.trim();
            // Skip comments
            if (trimmed.startsWith('//')) continue;
            // Handle Category
            if (trimmed.startsWith('$CATEGORY:')) {
                this.handleCategory(trimmed);
                continue;
            }
            cleanLines.push(line);
        }

        const fullText = cleanLines.join('\n');

        // Split by blank lines (standard GIFT separator)
        const blocks = fullText.split(/\n\s*\n+/).filter(b => b.trim().length > 0);

        for (const block of blocks) {
            const q = this.parseQuestionBlock(block);
            if (q) {
                exam.addQuestion(q);
            }
        }

        return exam;
    }

    private handleCategory(line: string) {
        // Format: $CATEGORY: $course$/top/Gold B2, Unit 3
        const path = line.replace('$CATEGORY:', '').trim();
        const parts = path.split('/').filter(p => p.length > 0);
        let parent: Category | null = null;

        for (const part of parts) {
            parent = new Category(part, parent);
        }
        this.currentCategory = parent;
    }

    private parseQuestionBlock(block: string): Question | null {
        block = block.trim();
        if (block.length === 0) return null;

        // 1. Extract Title ::Title::
        let title = '';
        let text = block;
        const titleMatch = block.match(/^::(.*?)::/);
        if (titleMatch) {
            title = titleMatch[1];
            text = block.substring(titleMatch[0].length).trim();
        } else {
            // If no title, use a snippet of text as title or default
            title = text.substring(0, 50) + (text.length > 50 ? '...' : '');
        }

        // 2. Extract Format [html]
        let format = 'moodle';
        const formatMatch = text.match(/^\[(html|markdown|moodle)\]/);
        if (formatMatch) {
            format = formatMatch[1];
            text = text.substring(formatMatch[0].length).trim();
        }

        // 3. Find Answer Block {...}
        // Handle escaped braces if necessary (simple approach for now)
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) {
            // No answer block -> Description
            return new Question(title, text, QuestionType.Description, format, this.currentCategory);
        }

        const preText = text.substring(0, startIndex).trim();
        const answerBlock = text.substring(startIndex + 1, endIndex);
        const postText = text.substring(endIndex + 1).trim();

        // Construct Question Text
        // If it's a Cloze question (text before and/or after), we might want to represent the gap.
        // For now, we concatenate parts.
        let questionText = preText;
        if (postText) {
            questionText += " _____ " + postText;
        } else if (preText === '') {
            // If text is empty (e.g. just {answers}), title might be the text?
            // Or it's just a question where the prompt is the title?
            // Usually GIFT has text.
        }

        // 4. Parse Answers and Determine Type
        const { type, answers } = this.parseAnswers(answerBlock);

        // Refine Type
        let finalType = type;
        if (answerBlock.trim() === '') {
            finalType = QuestionType.Essay;
        }

        const q = new Question(title, questionText, finalType, format, this.currentCategory);
        q.answers = answers;
        return q;
    }

    private parseAnswers(block: string): { type: QuestionType, answers: AnswerOption[] } {
        // Nettoyage des sauts de ligne
        block = block.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim();

        const answers: AnswerOption[] = [];
        let type = QuestionType.ShortAnswer;

        // 1. True/False
        const tfMatch = block.match(/^([TF]|TRUE|FALSE)$/i);
        if (tfMatch) {
            const content = tfMatch[1].toUpperCase();
            const isTrue = content === 'T' || content === 'TRUE';
            answers.push(new AnswerOption("True", isTrue));
            answers.push(new AnswerOption("False", !isTrue));
            return { type: QuestionType.TrueFalse, answers };
        }

        // 2. Numerical
        if (block.startsWith('#')) {
            type = QuestionType.Numerical;
            const val = block.substring(1).trim();
            answers.push(new AnswerOption(val, true));
            return { type, answers };
        }

        // 3. Matching
        if (block.includes('->')) {
            type = QuestionType.Matching;
            const items = block.split('=').map(i => i.trim()).filter(i => i.length > 0);
            for (const item of items) {
                const parts = item.split('->');
                if (parts.length >= 2) {
                    const left = parts[0].trim();
                    const right = parts.slice(1).join('->').trim();
                    answers.push(new AnswerOption(left, true, null, null, right));
                }
            }
            return { type, answers };
        }

        // 4. Multiple Choice / Short Answer (C'est ici que se trouve le correctif)
        const options = block.split(/(?=[~=])/).map(o => o.trim()).filter(o => o.length > 0);

        let hasEquals = false;
        let hasTilde = false;

        for (const opt of options) {
            let isCorrect = false;
            let text = opt;
            let weight: number | null = null;
            let feedback: string | null = null;

            if (opt.startsWith('=')) {
                isCorrect = true;
                text = opt.substring(1).trim();
            } else if (opt.startsWith('~')) {
                isCorrect = false;
                text = opt.substring(1).trim();
            }

            // Poids (%50%)
            const weightMatch = text.match(/^%(-?\d+(\.\d+)?)%/);
            if (weightMatch) {
                weight = parseFloat(weightMatch[1]);
                text = text.substring(weightMatch[0].length).trim();
                if (weight === 100) isCorrect = true;
            }

            // Feedback (#)
            const feedbackIndex = text.indexOf('#');
            if (feedbackIndex !== -1) {
                feedback = text.substring(feedbackIndex + 1).trim();
                text = text.substring(0, feedbackIndex).trim();
            }

            // --- CORRECTIF DU BUG "F EN TROP" ---
            // Si le texte est vide après nettoyage (ex: le résidu d'un "~="), on l'ignore.
            if (text.length === 0) continue;
            // ------------------------------------

            if (isCorrect) hasEquals = true;
            else hasTilde = true;

            answers.push(new AnswerOption(text, isCorrect, feedback, weight));
        }

        if (hasTilde && hasEquals) {
            type = QuestionType.MultipleChoice;
        } else if (hasTilde && !hasEquals) {
            type = QuestionType.MultipleChoice;
        } else if (!hasTilde && hasEquals) {
            type = QuestionType.ShortAnswer;
        }

        return { type, answers };
    }
}

// Helper function for backward compatibility or easy usage
export function parseGiftFile(filePath: string): Exam {
    const parser = new GiftParser();
    return parser.parse(filePath);
}