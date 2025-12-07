const { Exam, Question, QuestionType } = require("../dist/classes.js");

describe("Exam class", () => {

  it("adds a question and blocks duplicates", () => {
    const exam = new Exam();

    const q1 = new Question("Q1", "Text", QuestionType.MultipleChoice);
    expect(exam.addQuestion(q1)).toBe(true);
    expect(exam.questions.length).toBe(1);

    // duplicate
    const q2 = new Question("Q1", "Text", QuestionType.MultipleChoice);
    expect(exam.addQuestion(q2)).toBe(false);
    expect(exam.questions.length).toBe(1);
  });

  it("validates that exam size must be between 15 and 20", () => {
    const exam = new Exam();

    // 10 questions -> invalide
    for (let i = 0; i < 10; i++) {
      exam.questions.push(new Question(`Q${i}`, `Text ${i}`, QuestionType.Essay));
    }
    expect(exam.card()).toBe(10);
    expect(exam.isValid()).toBe(false);

    // on monte à 15 questions -> valide
    for (let i = 10; i < 15; i++) {
      exam.questions.push(new Question(`Q${i}`, `Text ${i}`, QuestionType.Essay));
    }
    expect(exam.card()).toBe(15);
    expect(exam.isValid()).toBe(true);

    // on dépasse 20 -> invalide
    for (let i = 15; i < 21; i++) {
      exam.questions.push(new Question(`Q${i}`, `Text ${i}`, QuestionType.Essay));
    }
    expect(exam.card()).toBe(21);
    expect(exam.isValid()).toBe(false);
  });

  it("differentiates null and undefined", () => {
    const exam = new Exam();

    let undef = exam.metadata;
    let nul = null;

    expect(undef).toBeUndefined();
    expect(nul).toBeNull();
    expect(undef === nul).toBe(false);
  });
});
