import { program } from "@caporal/core";
import { parseGiftFile } from "./parser";

program
    .version("1.0.0")
    .description("A simple TypeScript CLI application")

    // Hello world!
    .command("greet", "Greet the user")
    .action(() => {
        console.log("Greetings from the TypeScript CLI!");
    })

    .command("parse-gift", "Parse a .gift file and display questions")
    .argument("<filePath>", "Path to the .gift file")
    .action(({ args }) => {
        const questions = parseGiftFile(args.filePath as string);
        console.log("Parsed Questions:");
        questions.forEach((q, index) => {
            console.log(`${index + 1}. ${q}`);
        });
    })

program.run();