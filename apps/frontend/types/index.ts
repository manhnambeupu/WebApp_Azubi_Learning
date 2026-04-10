export type UserRole = "ADMIN" | "STUDENT";
export type QuestionType =
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "ESSAY"
  | "IMAGE_ESSAY"
  | "ORDERING"
  | "MATCHING";

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
  isPrivate: boolean;
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
  orderIndex: number | null;
  matchText: string | null;
};

export type QuestionDetail = {
  id: string;
  lessonId: string;
  type: QuestionType;
  text: string;
  explanation: string | null;
  imageUrl?: string | null;
  isPrivate: boolean;
  orderIndex: number;
  answers: AnswerDetail[];
};

export type QuestionAnswerPayload = {
  text: string;
  isCorrect: boolean;
  explanation?: string;
  orderIndex?: number;
  matchText?: string;
};

export type CreateQuestionPayload = {
  text: string;
  type: QuestionType;
  explanation?: string;
  imageUrl?: string;
  isPrivate?: boolean;
  answers: QuestionAnswerPayload[];
};

export type UpdateQuestionPayload = {
  text?: string;
  type?: QuestionType;
  explanation?: string;
  imageUrl?: string;
  isPrivate?: boolean;
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

export type MarkdownImageUploadResponse = {
  imageUrl: string;
  originalWidth: number;
  originalHeight: number;
  optimizedWidth: number;
  optimizedHeight: number;
  originalBytes: number;
  optimizedBytes: number;
};

export type LessonDetail = {
  id: string;
  title: string;
  summary: string;
  contentMd: string;
  imageUrl: string | null;
  isPrivate: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: Pick<Category, "id" | "name">;
  files: LessonFile[];
  questions: LessonQuestion[];
};

export type LessonAccessEntry = {
  id: string;
  userId: string;
  lessonId: string;
  grantedAt: string;
  user: Pick<User, "id" | "email" | "fullName">;
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
  imageUrl?: string | null;
  orderIndex: number;
  isLocked: boolean;
  answers: StudentAnswer[];
  matchingOptions?: string[];
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
    matches?: {
      answerId: string;
      matchText: string;
    }[];
  }[];
};

export type QuizResultAnswer = {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string | null;
  orderIndex: number | null;
  matchText: string | null;
};

export type QuizResultSelectedMatch = {
  answerId: string;
  matchText: string;
};

export type QuizResultQuestion = {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string | null;
  explanation: string | null;
  answers: QuizResultAnswer[];
  selectedAnswerIds: string[];
  selectedAnswerId: string | null;
  selectedMatches: QuizResultSelectedMatch[];
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

export type AiChatRole = "USER" | "AI";

export type CreateAiChatPayload = {
  lessonId: string;
  message: string;
};

export type CreateAiChatResponse = {
  id: string;
  studentId: string;
  lessonId: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
};

export type GetAiHistoriesFilters = {
  studentName?: string;
  lessonTitle?: string;
  limit?: number;
};

export type AiHistoryItem = {
  id: string;
  studentId: string;
  lessonId: string;
  role: AiChatRole;
  content: string;
  createdAt: string;
  student: {
    id: string;
    email: string;
    fullName: string;
  };
  lesson: {
    id: string;
    title: string;
  };
};
