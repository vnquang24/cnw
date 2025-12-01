interface Answer {
  id: string;
  correct: boolean;
}

interface Question {
  id: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY";
  points?: number | null;
  answers: Answer[];
}

export interface QuestionScore {
  score: number;
  maxScore: number;
  feedback: string;
}

export type QuestionScores = Record<string, QuestionScore>;

/**
 * Calculate auto score for multiple choice questions
 */
export function calculateAutoScore(
  question: Question,
  userAnswer: string | string[] | null | undefined,
): number {
  if (question.questionType === "ESSAY") {
    return 0; // Essay questions need manual grading
  }

  const userAnswerIds = !userAnswer
    ? []
    : Array.isArray(userAnswer)
      ? userAnswer.filter((id) => id)
      : [userAnswer].filter((id) => id);

  const correctAnswers = question.answers.filter((a) => a.correct);
  const correctIds = correctAnswers.map((a) => a.id);

  const isCorrect =
    question.questionType === "SINGLE_CHOICE"
      ? userAnswerIds.length === 1 && correctIds.includes(userAnswerIds[0])
      : userAnswerIds.length === correctIds.length &&
        userAnswerIds.every((id) => correctIds.includes(id));

  return isCorrect ? question.points || 1 : 0;
}

/**
 * Calculate total scores from questionScores object
 */
export function calculateTotalFromQuestionScores(
  questionScores: QuestionScores,
): { earnedPoints: number; totalPoints: number } {
  let earnedPoints = 0;
  let totalPoints = 0;

  Object.values(questionScores).forEach((score) => {
    earnedPoints += score.score;
    totalPoints += score.maxScore;
  });

  return { earnedPoints, totalPoints };
}

/**
 * Update or create questionScores with auto-calculated scores for multiple choice
 */
export function updateQuestionScores(
  questions: Question[],
  userAnswers: Map<string, any>,
  existingScores?: QuestionScores,
): QuestionScores {
  const questionScores: QuestionScores = { ...existingScores };

  questions.forEach((question) => {
    const maxScore = question.points || 1;
    const userAnswer = userAnswers.get(question.id);

    if (question.questionType === "ESSAY") {
      // Keep existing essay scores or set to 0
      if (!questionScores[question.id]) {
        questionScores[question.id] = {
          score: 0,
          maxScore,
          feedback: "",
        };
      }
    } else {
      // Auto-calculate for multiple choice
      const autoScore = calculateAutoScore(question, userAnswer);
      questionScores[question.id] = {
        score: autoScore,
        maxScore,
        feedback: existingScores?.[question.id]?.feedback || "",
      };
    }
  });

  return questionScores;
}
