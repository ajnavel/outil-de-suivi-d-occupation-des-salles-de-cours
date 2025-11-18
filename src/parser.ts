// take in a .gift file path and return an array of questions
import * as fs from 'fs';

export function parseGiftFile(filePath: string): string[] {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions = fileContent.split(/\n(?=\s*::)/).map(q => q.trim()).filter(q => q.length > 0);
    return questions;
}