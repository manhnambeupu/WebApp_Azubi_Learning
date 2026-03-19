"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmissionsService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const MISSING_ANSWERS_MESSAGE = 'Vui lòng trả lời tất cả câu hỏi.';
const SINGLE_CHOICE_LIMIT_MESSAGE = 'Mỗi câu hỏi chỉ được chọn một đáp án.';
const ESSAY_CHOICE_LIMIT_MESSAGE = 'Câu hỏi tự luận chỉ chấp nhận tối đa 1 đáp án tham chiếu.';
const ORDERING_REQUIRED_ALL_ANSWERS_MESSAGE = 'Câu hỏi sắp xếp phải gửi đủ tất cả đáp án theo thứ tự.';
const MATCHING_REQUIRED_ALL_PAIRS_MESSAGE = 'Câu hỏi ghép đôi phải gửi đầy đủ các cặp ghép.';
const MATCHING_DUPLICATED_PAIR_MESSAGE = 'Mỗi đáp án chỉ được ghép một lần.';
const MATCHING_EMPTY_TEXT_MESSAGE = 'Nội dung ghép không được để trống.';
let SubmissionsService = class SubmissionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async submitQuiz(userId, lessonId, dto) {
        const lessonQuestions = await this.getLessonQuestions(lessonId);
        const submittedAnswersByQuestion = this.validateSubmittedAnswers(lessonQuestions, dto.answers);
        const evaluationsByQuestion = this.evaluateQuestions(lessonQuestions, submittedAnswersByQuestion);
        const questionsResult = this.buildQuestionsResult(lessonQuestions, submittedAnswersByQuestion, evaluationsByQuestion);
        const totalQuestions = this.countGradableQuestions(lessonQuestions);
        const correctCount = this.calculateCorrectCount(evaluationsByQuestion);
        const score = this.calculateScore(correctCount, totalQuestions);
        const currentAttempts = await this.prisma.lessonAttempt.count({
            where: {
                userId,
                lessonId,
            },
        });
        const attemptNumber = currentAttempts + 1;
        const attempt = await this.prisma.$transaction(async (tx) => {
            const createdAttempt = await tx.lessonAttempt.create({
                data: {
                    userId,
                    lessonId,
                    attemptNumber,
                    score,
                    correctCount,
                },
            });
            const submissionRows = this.buildSubmissionRows(createdAttempt.id, questionsResult, submittedAnswersByQuestion);
            if (submissionRows.length > 0) {
                await tx.submission.createMany({
                    data: submissionRows,
                });
            }
            return createdAttempt;
        });
        return {
            attemptId: attempt.id,
            attemptNumber: attempt.attemptNumber,
            totalQuestions,
            correctCount,
            score,
            questions: questionsResult,
        };
    }
    getAttemptHistory(userId, lessonId) {
        return this.prisma.lessonAttempt.findMany({
            where: {
                userId,
                lessonId,
            },
            select: {
                id: true,
                attemptNumber: true,
                score: true,
                correctCount: true,
                submittedAt: true,
            },
            orderBy: {
                attemptNumber: 'desc',
            },
        });
    }
    async getAttemptDetail(userId, lessonId, attemptId) {
        const attempt = await this.prisma.lessonAttempt.findFirst({
            where: {
                id: attemptId,
                userId,
                lessonId,
            },
            select: {
                id: true,
                attemptNumber: true,
                score: true,
                correctCount: true,
                submissions: {
                    orderBy: [
                        {
                            orderIndex: 'asc',
                        },
                        {
                            answerId: 'asc',
                        },
                    ],
                    select: {
                        questionId: true,
                        answerId: true,
                        orderIndex: true,
                        matchText: true,
                    },
                },
            },
        });
        if (!attempt) {
            throw new common_1.NotFoundException('Attempt not found');
        }
        const lessonQuestions = await this.getLessonQuestions(lessonId);
        const submittedAnswersByQuestion = this.groupSubmittedAnswersByQuestion(attempt.submissions);
        const evaluationsByQuestion = this.evaluateQuestions(lessonQuestions, submittedAnswersByQuestion);
        const questions = this.buildQuestionsResult(lessonQuestions, submittedAnswersByQuestion, evaluationsByQuestion);
        const totalQuestions = this.countGradableQuestions(lessonQuestions);
        const correctCount = attempt.correctCount ?? this.calculateCorrectCount(evaluationsByQuestion);
        const score = attempt.score ?? this.calculateScore(correctCount, totalQuestions);
        return {
            attemptId: attempt.id,
            attemptNumber: attempt.attemptNumber,
            totalQuestions,
            correctCount,
            score,
            questions,
        };
    }
    async getLatestAttempt(userId, lessonId) {
        const latestAttempt = await this.prisma.lessonAttempt.findFirst({
            where: {
                userId,
                lessonId,
            },
            orderBy: {
                attemptNumber: 'desc',
            },
            select: {
                id: true,
            },
        });
        if (!latestAttempt) {
            return null;
        }
        return this.getAttemptDetail(userId, lessonId, latestAttempt.id);
    }
    async getLessonQuestions(lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                id: true,
                questions: {
                    orderBy: {
                        orderIndex: 'asc',
                    },
                    select: {
                        id: true,
                        type: true,
                        text: true,
                        imageUrl: true,
                        explanation: true,
                        orderIndex: true,
                        answers: {
                            orderBy: [{ orderIndex: 'asc' }, { id: 'asc' }],
                            select: {
                                id: true,
                                text: true,
                                isCorrect: true,
                                explanation: true,
                                orderIndex: true,
                                matchText: true,
                            },
                        },
                    },
                },
            },
        });
        if (!lesson || lesson.questions.length === 0) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        return lesson.questions;
    }
    validateSubmittedAnswers(lessonQuestions, submittedAnswers) {
        const submittedAnswersByQuestion = new Map();
        const questionById = new Map(lessonQuestions.map((question) => [question.id, question]));
        for (const submittedAnswer of submittedAnswers) {
            if (submittedAnswersByQuestion.has(submittedAnswer.questionId)) {
                throw new common_1.UnprocessableEntityException('Mỗi câu hỏi chỉ được gửi một lần.');
            }
            const question = questionById.get(submittedAnswer.questionId);
            if (!question) {
                throw new common_1.UnprocessableEntityException('Câu hỏi không thuộc bài học này.');
            }
            const submittedAnswerIds = submittedAnswer.answerIds;
            const submittedMatches = submittedAnswer.matches ?? [];
            const questionAnswerIds = new Set(question.answers.map((answer) => answer.id));
            if (question.type === client_1.QuestionType.SINGLE_CHOICE &&
                submittedAnswerIds.length > 1) {
                throw new common_1.UnprocessableEntityException(SINGLE_CHOICE_LIMIT_MESSAGE);
            }
            if ((question.type === client_1.QuestionType.ESSAY ||
                question.type === client_1.QuestionType.IMAGE_ESSAY) &&
                submittedAnswerIds.length > 1) {
                throw new common_1.UnprocessableEntityException(ESSAY_CHOICE_LIMIT_MESSAGE);
            }
            if (question.type !== client_1.QuestionType.ESSAY &&
                question.type !== client_1.QuestionType.IMAGE_ESSAY &&
                question.type !== client_1.QuestionType.MATCHING &&
                submittedAnswerIds.length === 0) {
                throw new common_1.UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
            }
            for (const answerId of submittedAnswerIds) {
                if (!questionAnswerIds.has(answerId)) {
                    throw new common_1.UnprocessableEntityException('Đáp án không thuộc câu hỏi tương ứng.');
                }
            }
            if (question.type === client_1.QuestionType.ORDERING) {
                if (submittedAnswerIds.length !== question.answers.length) {
                    throw new common_1.UnprocessableEntityException(ORDERING_REQUIRED_ALL_ANSWERS_MESSAGE);
                }
                for (const answer of question.answers) {
                    if (!submittedAnswerIds.includes(answer.id)) {
                        throw new common_1.UnprocessableEntityException(ORDERING_REQUIRED_ALL_ANSWERS_MESSAGE);
                    }
                }
            }
            const matchesByAnswerId = new Map();
            if (question.type === client_1.QuestionType.MATCHING) {
                if (submittedMatches.length !== question.answers.length) {
                    throw new common_1.UnprocessableEntityException(MATCHING_REQUIRED_ALL_PAIRS_MESSAGE);
                }
                for (const match of submittedMatches) {
                    if (!questionAnswerIds.has(match.answerId)) {
                        throw new common_1.UnprocessableEntityException('Đáp án không thuộc câu hỏi tương ứng.');
                    }
                    if (matchesByAnswerId.has(match.answerId)) {
                        throw new common_1.UnprocessableEntityException(MATCHING_DUPLICATED_PAIR_MESSAGE);
                    }
                    if (match.matchText.trim().length === 0) {
                        throw new common_1.UnprocessableEntityException(MATCHING_EMPTY_TEXT_MESSAGE);
                    }
                    matchesByAnswerId.set(match.answerId, match.matchText);
                }
                if (matchesByAnswerId.size !== question.answers.length) {
                    throw new common_1.UnprocessableEntityException(MATCHING_REQUIRED_ALL_PAIRS_MESSAGE);
                }
            }
            submittedAnswersByQuestion.set(submittedAnswer.questionId, {
                answerIds: question.type === client_1.QuestionType.MATCHING
                    ? submittedMatches.map((match) => match.answerId)
                    : submittedAnswerIds,
                matchesByAnswerId,
            });
        }
        if (submittedAnswersByQuestion.size !== lessonQuestions.length) {
            throw new common_1.UnprocessableEntityException(MISSING_ANSWERS_MESSAGE);
        }
        return submittedAnswersByQuestion;
    }
    buildQuestionsResult(lessonQuestions, submittedAnswersByQuestion, evaluationsByQuestion) {
        return lessonQuestions.map((question) => {
            const submittedAnswer = submittedAnswersByQuestion.get(question.id);
            const selectedAnswerIds = submittedAnswer?.answerIds ?? [];
            const evaluation = evaluationsByQuestion.get(question.id) ?? {
                earnedCorrectCount: 0,
                isCorrect: false,
            };
            return {
                id: question.id,
                type: question.type,
                text: question.text,
                imageUrl: question.imageUrl,
                explanation: question.explanation,
                answers: question.answers.map((answer) => ({
                    id: answer.id,
                    text: answer.text,
                    isCorrect: answer.isCorrect,
                    explanation: answer.explanation,
                    orderIndex: answer.orderIndex,
                    matchText: answer.matchText,
                })),
                selectedAnswerIds,
                selectedAnswerId: selectedAnswerIds[0] ?? null,
                selectedMatches: Array.from(submittedAnswer?.matchesByAnswerId.entries() ?? []).map(([answerId, matchText]) => ({ answerId, matchText })),
                isCorrect: evaluation.isCorrect,
            };
        });
    }
    groupSubmittedAnswersByQuestion(submissions) {
        const submittedAnswersByQuestion = new Map();
        const submissionsByQuestion = new Map();
        for (const submission of submissions) {
            const existingSubmissions = submissionsByQuestion.get(submission.questionId) ?? [];
            existingSubmissions.push({
                answerId: submission.answerId,
                orderIndex: submission.orderIndex,
                matchText: submission.matchText,
            });
            submissionsByQuestion.set(submission.questionId, existingSubmissions);
        }
        for (const [questionId, groupedSubmissions] of submissionsByQuestion.entries()) {
            groupedSubmissions.sort((left, right) => {
                if (left.orderIndex === null && right.orderIndex === null) {
                    return 0;
                }
                if (left.orderIndex === null) {
                    return 1;
                }
                if (right.orderIndex === null) {
                    return -1;
                }
                return left.orderIndex - right.orderIndex;
            });
            const matchesByAnswerId = new Map();
            for (const groupedSubmission of groupedSubmissions) {
                if (groupedSubmission.matchText !== null) {
                    matchesByAnswerId.set(groupedSubmission.answerId, groupedSubmission.matchText);
                }
            }
            submittedAnswersByQuestion.set(questionId, {
                answerIds: groupedSubmissions.map((groupedSubmission) => groupedSubmission.answerId),
                matchesByAnswerId,
            });
        }
        return submittedAnswersByQuestion;
    }
    evaluateQuestions(lessonQuestions, submittedAnswersByQuestion) {
        const evaluationsByQuestion = new Map();
        for (const question of lessonQuestions) {
            evaluationsByQuestion.set(question.id, this.evaluateQuestion(question, submittedAnswersByQuestion.get(question.id) ?? {
                answerIds: [],
                matchesByAnswerId: new Map(),
            }));
        }
        return evaluationsByQuestion;
    }
    evaluateQuestion(question, submittedAnswer) {
        const selectedAnswerIds = submittedAnswer.answerIds;
        if (question.type === client_1.QuestionType.ESSAY ||
            question.type === client_1.QuestionType.IMAGE_ESSAY) {
            return {
                earnedCorrectCount: 0,
                isCorrect: false,
            };
        }
        if (question.type === client_1.QuestionType.SINGLE_CHOICE) {
            const isCorrect = question.answers.some((answer) => answer.id === selectedAnswerIds[0] && answer.isCorrect);
            return {
                earnedCorrectCount: isCorrect ? 1 : 0,
                isCorrect,
            };
        }
        if (question.type === client_1.QuestionType.ORDERING) {
            const expectedAnswerIds = [...question.answers]
                .sort((left, right) => (left.orderIndex ?? Number.MAX_SAFE_INTEGER) -
                (right.orderIndex ?? Number.MAX_SAFE_INTEGER))
                .map((answer) => answer.id);
            const isCorrect = expectedAnswerIds.length === selectedAnswerIds.length &&
                expectedAnswerIds.every((expectedAnswerId, index) => expectedAnswerId === selectedAnswerIds[index]);
            return {
                earnedCorrectCount: isCorrect ? 1 : 0,
                isCorrect,
            };
        }
        if (question.type === client_1.QuestionType.MATCHING) {
            if (question.answers.length === 0) {
                return {
                    earnedCorrectCount: 0,
                    isCorrect: false,
                };
            }
            let correctPairCount = 0;
            for (const answer of question.answers) {
                const selectedMatchText = submittedAnswer.matchesByAnswerId.get(answer.id);
                if (selectedMatchText !== undefined &&
                    answer.matchText !== null &&
                    selectedMatchText === answer.matchText) {
                    correctPairCount += 1;
                }
            }
            const earnedCorrectCount = correctPairCount / question.answers.length;
            return {
                earnedCorrectCount,
                isCorrect: correctPairCount === question.answers.length,
            };
        }
        const correctAnswers = question.answers.filter((answer) => answer.isCorrect);
        if (correctAnswers.length === 0 || selectedAnswerIds.length === 0) {
            return {
                earnedCorrectCount: 0,
                isCorrect: false,
            };
        }
        const selectedAnswers = question.answers.filter((answer) => selectedAnswerIds.includes(answer.id));
        const hasWrongSelection = selectedAnswers.some((answer) => !answer.isCorrect);
        if (hasWrongSelection) {
            return {
                earnedCorrectCount: 0,
                isCorrect: false,
            };
        }
        const earnedCorrectCount = selectedAnswers.length / correctAnswers.length;
        return {
            earnedCorrectCount,
            isCorrect: selectedAnswers.length === correctAnswers.length,
        };
    }
    buildSubmissionRows(attemptId, questions, submittedAnswersByQuestion) {
        const submissionRows = [];
        for (const question of questions) {
            const matchesByAnswerId = submittedAnswersByQuestion.get(question.id)?.matchesByAnswerId ??
                new Map();
            for (const [index, answerId] of question.selectedAnswerIds.entries()) {
                submissionRows.push({
                    attemptId,
                    questionId: question.id,
                    answerId,
                    orderIndex: question.type === client_1.QuestionType.ORDERING ? index : null,
                    matchText: question.type === client_1.QuestionType.MATCHING
                        ? matchesByAnswerId.get(answerId) ?? null
                        : null,
                    isCorrect: question.isCorrect,
                });
            }
        }
        return submissionRows;
    }
    countGradableQuestions(lessonQuestions) {
        return lessonQuestions.filter((question) => question.type !== client_1.QuestionType.ESSAY &&
            question.type !== client_1.QuestionType.IMAGE_ESSAY).length;
    }
    calculateCorrectCount(evaluationsByQuestion) {
        let correctCount = 0;
        for (const evaluation of evaluationsByQuestion.values()) {
            correctCount += evaluation.earnedCorrectCount;
        }
        return Number(correctCount.toFixed(4));
    }
    calculateScore(correctCount, totalQuestions) {
        if (totalQuestions === 0) {
            return 0;
        }
        return Number(((correctCount / totalQuestions) * 100).toFixed(2));
    }
};
exports.SubmissionsService = SubmissionsService;
exports.SubmissionsService = SubmissionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubmissionsService);
//# sourceMappingURL=submissions.service.js.map