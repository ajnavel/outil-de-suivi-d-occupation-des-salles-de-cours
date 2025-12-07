const fs = require("fs");
const path = require("path");
const { parseGiftFile } = require("../dist/parser.js");
const { QuestionType } = require("../dist/classes.js");

describe("GiftParser / parseGiftFile", () => {
  const tmpFile = path.join(__dirname, "sample.gift");

  beforeAll(() => {
    const content = `
::Q1::What is 2+2? {
=4
~3
~5
}
`.trim();
    fs.writeFileSync(tmpFile, content, "utf-8");
  });

  afterAll(() => {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  });

  it("parses a basic GIFT question file", () => {
    const exam = parseGiftFile(tmpFile);

    expect(exam.questions.length).toBe(1);

    const q = exam.questions[0];
    expect(q.title).toBe("Q1");
    expect(q.type).toBe(QuestionType.MultipleChoice);

    const correct = q.answers.filter(a => a.isCorrect);
    expect(correct.length).toBe(1);
    expect(correct[0].text).toBe("4");
  });

  it("returns undefined when index is out of range", () => {
    const exam = parseGiftFile(tmpFile);
    expect(exam.questions[999]).toBeUndefined();
  });
});
