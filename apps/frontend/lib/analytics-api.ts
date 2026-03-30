import { api } from "@/lib/api";

// === Session Tracking ===
export type StartSessionPayload = {
  lessonId: string;
  sessionType: "LESSON_VIEW" | "QUIZ_ATTEMPT";
};

export type StartSessionResponse = {
  sessionId: string;
};

// === Admin Analytics ===
export type AnalyticsOverview = {
  activeStudentsThisWeek: number;
  avgActiveTimeSeconds: number;
  avgScore: number;
  improvementRate: number;
};

export type StudentSummary = {
  id: string;
  fullName: string;
  email: string;
  lessonsCompleted: number;
  avgActiveTimeSeconds: number;
  avgScore: number;
  lastActiveAt: string | null;
};

export type LessonBreakdown = {
  lessonId: string;
  lessonTitle: string;
  totalAttempts: number;
  bestScore: number;
  latestScore: number;
  firstScore: number;
  improvementDelta: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
};

export type WeakQuestion = {
  questionId: string;
  questionText: string;
  lessonTitle: string;
  incorrectRate: number;
};

export type ScoreTrendItem = {
  lessonId: string;
  lessonTitle: string;
  attempts: { attemptNumber: number; score: number }[];
};

export type StudentDetail = {
  student: { id: string; fullName: string; email: string };
  lessons: LessonBreakdown[];
  weakQuestions: WeakQuestion[];
  scoreTrend: ScoreTrendItem[];
};

// --- Student Session Tracking ---
export const startSession = (payload: StartSessionPayload) =>
  api
    .post<StartSessionResponse>("/student/analytics/session", payload)
    .then((r) => r.data);

export const sendHeartbeat = (sessionId: string) =>
  api
    .post("/student/analytics/session/heartbeat", { sessionId })
    .then((r) => r.data);

export const endSession = (sessionId: string) =>
  api.post("/student/analytics/session/end", { sessionId }).then((r) => r.data);

// --- Admin Analytics ---
export const fetchAnalyticsOverview = () =>
  api.get<AnalyticsOverview>("/admin/analytics/overview").then((r) => r.data);

export const fetchStudentsSummary = () =>
  api.get<StudentSummary[]>("/admin/analytics/students").then((r) => r.data);

export const fetchStudentDetail = (studentId: string) =>
  api.get<StudentDetail>(`/admin/analytics/students/${studentId}`).then((r) => r.data);

export const deleteStudentAnalytics = (studentId: string) =>
  api.delete(`/admin/analytics/students/${studentId}`).then((r) => r.data);
