import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  createPartFromText,
  createPartFromUri,
  GoogleGenAI,
  ThinkingLevel,
  type Content,
  type Part,
} from '@google/genai';
import { ChatRole, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AiChatHistoryQueryDto } from './dto/ai-chat-history-query.dto';

const MODEL_PRIORITY = [
  // === TIER 1: Gemma 4 - Thông minh nhất & TPM Vô hạn ===
  'gemma-4-31b-it',
  'gemma-4-26b-it',

  // === TIER 2: Gemma 3 Series - RPM cao (30), RPD cực lớn (14.4K) ===
  'gemma-3-27b-it',
  'gemma-3-12b-it',
  'gemma-3-4b-it',
  'gemma-3-2b-it',
  'gemma-3-1b-it',

  // === TIER 3: Gemini Flash Series - Tốc độ cao, Vision tốt ===
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-3-flash',
] as const;
const CHAT_HISTORY_LIMIT = 20;
const STUDENT_HISTORY_LIMIT = 50;
const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 200;

const SOCRATIC_SYSTEM_PROMPT = `
Bạn là Gia sư AI của nền tảng Azubi - chuyên đào tạo nghề ngành nhà hàng/khách sạn tại Đức.

## QUY TẮC CỐT LÕI
- Luôn dùng phương pháp Socratic: đặt câu hỏi gợi mở và dẫn dắt từng bước.
- TUYỆT ĐỐI KHÔNG cung cấp đáp án trực tiếp cho câu hỏi bài tập.
- Nếu học viên hỏi đáp án thẳng, hãy từ chối lịch sự bằng câu như "Mình không thể nói thẳng đáp án, nhưng mình sẽ giúp bạn tự tìm ra..."
- Khi phân tích hình ảnh được cung cấp, hãy mô tả những gì bạn thấy và đặt câu hỏi gợi ý về ý nghĩa của chúng.

## QUY TẮC ĐỊNH DẠNG & PHONG CÁCH VIẾT
- TUYỆT ĐỐI KHÔNG dùng cú pháp Toán học LaTeX. Chỉ dùng ký hiệu Unicode (->, •,...).
- **Cấu trúc đoạn văn**: Sử dụng dấu xuống dòng kép (\n\n) giữa các đoạn văn để tạo khoảng và dễ đọc. Tránh viết một khối văn bản quá dài.
- **Phân cấp thông tin**: Sử dụng tiêu đề nhỏ (Bold text) hoặc Danh sách (Bullet points) để phân tách các ý chính.
- **Sự chuyên nghiệp**: Trình bày như một chuyên gia sư phạm. Luôn có cấu trúc:
  1. Lời mở đầu thân thiện (Chào hỏi/Công nhận nỗ lực).
  2. Đoạn dẫn dắt/Phân tích (Chia nhỏ các ý bằng danh sách).
  3. Một câu hỏi Socratic chốt hạ ở cuối cùng (Xếp riêng ra một dòng mới).
- Trả lời bằng tiếng Việt, trừ khi học sinh hỏi bằng tiếng khác.
`;

type StreamLessonResponseInput = {
  studentId: string;
  lessonId: string;
  chatId?: string;
  message?: string;
};

type LessonContext = {
  id: string;
  title: string;
  contentMd: string;
  imageUrl: string | null;
  questions: {
    orderIndex: number;
    text: string;
    explanation: string | null;
    imageUrl: string | null;
    type: string;
    answers: {
      text: string;
      isCorrect: boolean;
      explanation: string | null;
    }[];
  }[];
};

type AdminAiChatHistoryItem = {
  id: string;
  studentId: string;
  lessonId: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
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

type StudentAiChatHistoryItem = {
  id: string;
  role: ChatRole;
  content: string;
};

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createStudentMessage(studentId: string, lessonId: string, message: string) {
    await this.getStudentLessonContextOrThrow(studentId, lessonId);

    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      throw new BadRequestException('Nội dung câu hỏi không được để trống.');
    }

    const chatEntry = await this.prisma.aiChatHistory.create({
      data: {
        studentId,
        lessonId,
        role: ChatRole.USER,
        content: normalizedMessage,
      },
      select: {
        id: true,
        studentId: true,
        lessonId: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return chatEntry;
  }

  async getStudentLessonHistory(
    studentId: string,
    lessonId: string,
  ): Promise<StudentAiChatHistoryItem[]> {
    await this.getStudentLessonContextOrThrow(studentId, lessonId);

    return this.prisma.aiChatHistory.findMany({
      where: { studentId, lessonId },
      orderBy: { createdAt: 'asc' },
      take: STUDENT_HISTORY_LIMIT,
      select: { id: true, role: true, content: true },
    });
  }

  async clearStudentLessonHistory(
    studentId: string,
    lessonId: string,
  ): Promise<{ success: true; message: string }> {
    await this.getStudentLessonContextOrThrow(studentId, lessonId);

    await this.prisma.aiChatHistory.deleteMany({
      where: { studentId, lessonId },
    });

    return { success: true, message: 'Đã xóa lịch sử trò chuyện.' };
  }

  async *streamLessonResponse(
    input: StreamLessonResponseInput,
  ): AsyncGenerator<string, void, void> {
    const lesson = await this.getStudentLessonContextOrThrow(
      input.studentId,
      input.lessonId,
    );

    await this.resolveUserChatEntry(input);
    const conversation = await this.getConversation(input.studentId, input.lessonId);

    const apiKeys = this.getApiKeysOrThrow();
    const lessonContextParts = this.buildLessonContextParts(lesson);
    const contextSeedMessage: Content = {
      role: 'user',
      parts: [createPartFromText('Đây là tài liệu bài học của chúng ta.'), ...lessonContextParts],
    };
    const contextAckMessage: Content = {
      role: 'model',
      parts: [
        createPartFromText(
          'Tôi đã đọc và hiểu toàn bộ nội dung bài học. Sẵn sàng hỗ trợ học viên!',
        ),
      ],
    };
    const conversationMessages: Content[] = conversation.map((entry) => ({
      role: entry.role === ChatRole.USER ? 'user' : 'model',
      parts: [createPartFromText(entry.content)],
    }));

    let responseStream: Awaited<
      ReturnType<GoogleGenAI['models']['generateContentStream']>
    > | null = null;

    for (const modelId of MODEL_PRIORITY) {
      let isModelConnected = false;

      for (const [keyIndex, apiKey] of apiKeys.entries()) {
        const genAI = new GoogleGenAI({ apiKey });

        try {
          const isThinkingSupported = modelId.includes('31b') || modelId.includes('26b');

          responseStream = await genAI.models.generateContentStream({
            model: modelId,
            contents: [contextSeedMessage, contextAckMessage, ...conversationMessages],
            config: {
              systemInstruction: this.buildSystemInstruction(lesson),
              ...(isThinkingSupported
                ? {
                    thinkingConfig: {
                      thinkingLevel: ThinkingLevel.HIGH,
                    },
                  }
                : {}),
            },
          });

          this.logger.log(
            `[AI Tutor] ✅ Thành công Model: ${modelId} | API Key số ${keyIndex + 1}`,
          );
          isModelConnected = true;
          break;
        } catch (error: unknown) {
          const statusCode = this.extractStatusCode(error);

          if (statusCode === 429) {
            this.logger.warn(
              `[AI Tutor] ⚠️ Model ${modelId} quá tải ở Key số ${keyIndex + 1}. Thử Key tiếp theo...`,
            );
            continue;
          }

          if (statusCode === 400 || (statusCode !== null && statusCode >= 500)) {
            this.logger.warn(
              `[AI Tutor] ⚠️ Model ${modelId} bị lỗi nòng cốt (Mã: ${statusCode}). Rút lui sang Model khác...`,
            );
            break;
          }

          throw error;
        }
      }

      if (isModelConnected) {
        break;
      }
    }

    if (!responseStream) {
      throw new ServiceUnavailableException(
        'Toàn bộ đường truyền AI và Models dự phòng đều đang bận. Vui lòng thử lại sau 10 giây.',
      );
    }

    let fullAiResponse = '';

    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (!textChunk) {
        continue;
      }

      fullAiResponse += textChunk;
      yield textChunk;
    }

    const normalizedAiResponse = fullAiResponse.trim();
    if (normalizedAiResponse) {
      await this.prisma.aiChatHistory.create({
        data: {
          studentId: input.studentId,
          lessonId: input.lessonId,
          role: ChatRole.AI,
          content: normalizedAiResponse,
        },
      });
    }
  }

  async getAdminHistory(
    query: AiChatHistoryQueryDto,
  ): Promise<AdminAiChatHistoryItem[]> {
    const where = this.buildAdminHistoryWhere(query);
    const take = query.limit ?? DEFAULT_HISTORY_LIMIT;

    return this.prisma.aiChatHistory.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(take, MAX_HISTORY_LIMIT),
      select: {
        id: true,
        studentId: true,
        lessonId: true,
        role: true,
        content: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        lesson: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  async deleteHistoryById(id: string): Promise<{ deleted: true; id: string }> {
    const existingRecord = await this.prisma.aiChatHistory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingRecord) {
      throw new NotFoundException('Không tìm thấy lịch sử trò chuyện AI.');
    }

    await this.prisma.aiChatHistory.delete({
      where: { id },
    });

    return { deleted: true, id };
  }

  private getApiKeysOrThrow(): string[] {
    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY_2,
      process.env.GEMINI_API_KEY_3,
    ]
      .map((apiKey) => apiKey?.trim())
      .filter((apiKey): apiKey is string => Boolean(apiKey));

    const uniqueApiKeys = Array.from(new Set(apiKeys));

    if (uniqueApiKeys.length === 0) {
      throw new ServiceUnavailableException('AI Tutor chưa được cấu hình API Keys.');
    }

    return uniqueApiKeys;
  }

  private buildSystemInstruction(lesson: LessonContext): string {
    let instruction = `${SOCRATIC_SYSTEM_PROMPT}\n\nNgữ cảnh bài học "${lesson.title}":\n${lesson.contentMd}`;

    if (lesson.questions.length > 0) {
      instruction += '\n\n--- CÂU HỎI TRONG BÀI ---\n';
      for (const q of lesson.questions) {
        instruction += `\nCâu ${q.orderIndex + 1} (${q.type}): ${q.text}`;
        if (q.explanation) {
          instruction += `\n  Giải thích: ${q.explanation}`;
        }
        for (const a of q.answers) {
          instruction += `\n  - ${a.text} ${a.isCorrect ? '(Đáp án đúng)' : ''}`;
          if (a.explanation) {
            instruction += ` | Giải thích: ${a.explanation}`;
          }
        }
      }
      instruction +=
        '\n\nQuan trọng: Bạn BIẾT đáp án nhưng KHÔNG ĐƯỢC tiết lộ trực tiếp. Chỉ được dẫn dắt học viên tự tìm ra câu trả lời.';
    }

    return instruction;
  }

  private extractStatusCode(error: unknown): number | null {
    if (typeof error !== 'object' || error === null) {
      return null;
    }

    const candidate = error as { status?: unknown; code?: unknown };
    if (typeof candidate.status === 'number') {
      return candidate.status;
    }
    if (typeof candidate.code === 'number') {
      return candidate.code;
    }

    return null;
  }

  // Tạo "ảnh chụp màn hình" đầu kỳ của bài học cho AI.
  private buildLessonContextParts(lesson: LessonContext): Part[] {
    const parts: Part[] = [];

    parts.push(
      createPartFromText(`--- NỘI DUNG BÀI HỌC: ${lesson.title} ---\n${lesson.contentMd}`),
    );

    if (lesson.imageUrl) {
      parts.push(createPartFromUri(lesson.imageUrl, 'image/jpeg'));
    }

    if (lesson.questions.length > 0) {
      parts.push(createPartFromText('\n--- CÁC CÂU HỎI TRONG BÀI ---'));
      for (const q of lesson.questions) {
        parts.push(createPartFromText(`\nCâu ${q.orderIndex + 1} (${q.type}): ${q.text}`));
        if (q.imageUrl) {
          parts.push(createPartFromUri(q.imageUrl, 'image/jpeg'));
        }
        for (const a of q.answers) {
          const answerLine = `  - ${a.text}${a.isCorrect ? ' [ĐÚNG]' : ''}${a.explanation ? ` | Gợi ý: ${a.explanation}` : ''}`;
          parts.push(createPartFromText(answerLine));
        }
      }
      parts.push(
        createPartFromText(
          '\n[QUAN TRỌNG: Bạn biết đáp án nhưng KHÔNG ĐƯỢC tiết lộ. Chỉ dẫn dắt từng bước.]',
        ),
      );
    }

    return parts;
  }

  private async resolveUserChatEntry(input: StreamLessonResponseInput) {
    if (input.chatId) {
      const userChat = await this.prisma.aiChatHistory.findFirst({
        where: {
          id: input.chatId,
          studentId: input.studentId,
          lessonId: input.lessonId,
          role: ChatRole.USER,
        },
        select: {
          id: true,
        },
      });

      if (!userChat) {
        throw new NotFoundException('Không tìm thấy câu hỏi của học viên.');
      }

      return userChat;
    }

    const message = input.message?.trim();
    if (!message) {
      throw new BadRequestException('Thiếu nội dung câu hỏi để bắt đầu stream.');
    }

    return this.prisma.aiChatHistory.create({
      data: {
        studentId: input.studentId,
        lessonId: input.lessonId,
        role: ChatRole.USER,
        content: message,
      },
      select: {
        id: true,
      },
    });
  }

  private async getConversation(studentId: string, lessonId: string) {
    const histories = await this.prisma.aiChatHistory.findMany({
      where: {
        studentId,
        lessonId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: CHAT_HISTORY_LIMIT,
      select: {
        role: true,
        content: true,
      },
    });

    return histories.reverse();
  }

  private async getStudentLessonContextOrThrow(
    studentId: string,
    lessonId: string,
  ): Promise<LessonContext> {
    const lesson = await this.prisma.lesson.findFirst({
      where: {
        id: lessonId,
        OR: [
          {
            isPrivate: false,
          },
          {
            studentAccesses: {
              some: {
                userId: studentId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        contentMd: true,
        imageUrl: true,
        questions: {
          where: {
            isPrivate: false,
          },
          orderBy: {
            orderIndex: 'asc',
          },
          select: {
            orderIndex: true,
            text: true,
            explanation: true,
            imageUrl: true,
            type: true,
            answers: {
              select: {
                text: true,
                isCorrect: true,
                explanation: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Không tìm thấy bài học.');
    }

    return lesson;
  }

  private buildAdminHistoryWhere(
    query: AiChatHistoryQueryDto,
  ): Prisma.AiChatHistoryWhereInput {
    const where: Prisma.AiChatHistoryWhereInput = {};

    if (query.studentName?.trim()) {
      where.student = {
        fullName: {
          contains: query.studentName.trim(),
          mode: 'insensitive',
        },
      };
    }

    if (query.lessonTitle?.trim()) {
      where.lesson = {
        title: {
          contains: query.lessonTitle.trim(),
          mode: 'insensitive',
        },
      };
    }

    return where;
  }
}
