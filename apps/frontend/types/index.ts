export type UserRole = "ADMIN" | "STUDENT";
export type QuestionType = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type Category = {
  id: string;
  name: string;
  lessonCount: number;
};

export type LessonCount = {
  questions: number;
  files: number;
};

export type LessonListItem = {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  imageUrl: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name">;
  _count: LessonCount;
};

export type AnswerDetail = {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
};

export type QuestionDetail = {
  id: string;
  lessonId: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  orderIndex: number;
  answers: AnswerDetail[];
};

export type QuestionAnswerPayload = {
  text: string;
  isCorrect: boolean;
  explanation?: string;
};

export type CreateQuestionPayload = {
  text: string;
  type: QuestionType;
  explanation?: string;
  answers: QuestionAnswerPayload[];
};

export type UpdateQuestionPayload = {
  text?: string;
  type?: QuestionType;
  explanation?: string;
  orderIndex?: number;
  answers?: QuestionAnswerPayload[];
};

export type LessonAnswer = AnswerDetail;
export type LessonQuestion = QuestionDetail;

export type LessonFile = {
  id: string;
  lessonId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
};

export type LessonDetail = {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  imageUrl: string | null;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name">;
  files: LessonFile[];
  questions: LessonQuestion[];
};

export type Student = {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
};

export type StudentLessonListItem = {
  id: string;
  title: string;
  summary: string;
  imageUrl: string | null;
  category: Pick<Category, "id" | "name">;
  _count: {
    questions: number;
  };
  isCompleted: boolean;
};

export type StudentAnswer = {
  id: string;
  text: string;
};

export type StudentQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  orderIndex: number;
  answers: StudentAnswer[];
};

export type StudentLessonDetail = {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  imageUrl: string | null;
  category: Pick<Category, "id" | "name">;
  files: LessonFile[];
  questions: StudentQuestion[];
  isCompleted: boolean;
};

export type SubmitQuizPayload = {
  answers: {
    questionId: string;
    answerIds: string[];
  }[];
};

export type QuizResultAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
};

export type QuizResultQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  answers: QuizResultAnswer[];
  selectedAnswerIds: string[];
  selectedAnswerId: string | null;
  isCorrect: boolean;
};

export type QuizResult = {
  attemptId: string;
  attemptNumber: number;
  totalQuestions: number;
  correctCount: number;
  score: number;
  questions: QuizResultQuestion[];
};

export type AttemptHistoryItem = {
  id: string;
  attemptNumber: number;
  score: number;
  correctCount: number;
  submittedAt: string;
};
