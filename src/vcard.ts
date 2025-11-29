import * as fs from 'fs';

export class VCardGenerator {
    
    // Génère le contenu textuel au format vCard 4.0
    static generate(firstName: string, lastName: string, email: string, org: string, phone: string = ''): string {
        
        // "N" : Nom de famille;Prénom;;; 
        const nValue = `${lastName};${firstName};;;`;
        
        // "FN" : Prénom Nom (Nom complet) 
        const fnValue = `${firstName} ${lastName}`;

        let vcard = "BEGIN:VCARD\r\n";
        vcard += "VERSION:4.0\r\n";           
        vcard += `FN:${fnValue}\r\n`;         
        vcard += `N:${nValue}\r\n`;          
        
        if (email) {
            vcard += `EMAIL:${email}\r\n`;
        }

        if (org) {
            vcard += `ORG:${org}\r\n`;
        }

        if (phone) {
            vcard += `TEL:${phone}\r\n`;
        }

        vcard += "END:VCARD";                 

        return vcard;
    }

    static save(filePath: string, content: string): void {
        fs.writeFileSync(filePath, content, 'utf-8');
    }
}