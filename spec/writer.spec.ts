import * as fs from "fs";
import * as path from "path";
import { Exam, Question, QuestionType } from "../dist/classes.js";
import { GiftExporter } from "../dist/writer.js";

describe("GiftExporter.save", () => {

  it("refuses export when exam has <15 questions", () => {
    const exam = new Exam();

    for (let i = 0; i < 10; i++)
      exam.addQuestion(new Question(`Q${i}`, "T", QuestionType.Description));

    const filePath = path.join(__dirname, "invalid-export.gift");

    const ok = GiftExporter.save(exam, filePath);

    expect(ok).toBe(false);
    expect(fs.existsSync(filePath)).toBe(false);
  });

  it("exports a valid exam when it has 15 questions", () => {
    const exam = new Exam();

    for (let i = 0; i < 15; i++)
      exam.addQuestion(new Question(`Q${i}`, "T", QuestionType.Description));

    const filePath = path.join(__dirname, "valid-export.gift");

    const ok = GiftExporter.save(exam, filePath);

    expect(ok).toBe(true);
    expect(fs.existsSync(filePath)).toBe(true);

    const content = fs.readFileSync(filePath, "utf8");
    expect(content.includes("::Q0::")).toBe(true);

    fs.unlinkSync(filePath);
  });
});
