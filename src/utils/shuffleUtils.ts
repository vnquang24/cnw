/**
 * Shuffle array using Fisher-Yates algorithm with timestamp-based randomness
 * This ensures different shuffle results each time the function is called
 */
export function shuffleArray<T>(array: T[]): T[] {
  if (array.length <= 1) return [...array];

  const shuffled = [...array];

  // Use timestamp + iteration as additional entropy
  const baseSeed = Date.now();

  for (let i = shuffled.length - 1; i > 0; i--) {
    // Add iteration-based entropy to Math.random()
    const entropy = ((baseSeed + i) % 1000) / 1000;
    const random = (Math.random() + entropy) % 1;
    const j = Math.floor(random * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Shuffle questions while preserving correct answer mapping
 */
export function shuffleQuestions<T extends { id: string }>(
  questions: T[],
): T[] {
  return shuffleArray(questions);
}

/**
 * Shuffle answers for a question while tracking correct answer
 */
export interface ShuffledAnswer {
  id: string;
  content: string;
  correct: boolean;
  originalIndex?: number;
}

export function shuffleAnswers(answers: ShuffledAnswer[]): ShuffledAnswer[] {
  return shuffleArray(answers);
}

/**
 * Shuffle all answers in all questions
 */
export interface QuestionWithAnswers {
  id: string;
  content: string;
  answers: ShuffledAnswer[];
  [key: string]: any;
}

export function shuffleAllAnswersInQuestions(
  questions: QuestionWithAnswers[],
): QuestionWithAnswers[] {
  return questions.map((q) => ({
    ...q,
    answers: shuffleAnswers(q.answers),
  }));
}

/**
 * Shuffle questions and optionally their answers
 */
export function shuffleTestContent(
  questions: QuestionWithAnswers[],
  shuffleQuestions: boolean,
  shuffleAnswers: boolean,
): QuestionWithAnswers[] {
  let result = questions;

  if (shuffleQuestions) {
    result = shuffleArray(result);
  }

  if (shuffleAnswers) {
    result = shuffleAllAnswersInQuestions(result);
  }

  return result;
}
