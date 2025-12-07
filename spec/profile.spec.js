const { Exam, Question, QuestionType } = require("../dist/classes.js");

describe("Exam Profile (EF10)", () => {

  it("builds correct statistics of question types", () => {
    const exam = new Exam();

    exam.addQuestion(new Question("A", "MC 1", QuestionType.MultipleChoice));
    exam.addQuestion(new Question("B", "MC 2", QuestionType.MultipleChoice)); 
    exam.addQuestion(new Question("C", "TF 1", QuestionType.TrueFalse));
    exam.addQuestion(new Question("D", "DESC 1", QuestionType.Description));


    const stats = {};
    exam.questions.forEach(q => {
      const key = String(q.type);
      stats[key] = (stats[key] || 0) + 1;
    });

    expect(stats).toEqual({
      [QuestionType.MultipleChoice]: 2,
      [QuestionType.TrueFalse]: 1,
      [QuestionType.Description]: 1
    });
  });
});
