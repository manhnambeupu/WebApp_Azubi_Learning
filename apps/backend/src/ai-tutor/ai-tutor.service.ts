import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ChatRole, type Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AiChatHistoryQueryDto } from './dto/ai-chat-history-query.dto';

const AI_MODEL = 'gemma-4-31b-it';
const CHAT_HISTORY_LIMIT = 20;
const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 200;

const SOCRATIC_SYSTEM_PROMPT = `
Bạn là Gia sư AI của Azubi, dùng phương pháp Socratic.
- Chỉ đặt câu hỏi gợi mở, phân tích từng bước, và đưa gợi ý.
- Tuyệt đối KHÔNG cung cấp đáp án trực tiếp.
- Nếu học viên yêu cầu đáp án thẳng, hãy từ chối lịch sự và chuyển sang gợi ý từng bước.
- Luôn bám sát ngữ cảnh bài học được cung cấp.
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

@Injectable()
export class AiTutorService {
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

  async *streamLessonResponse(
    input: StreamLessonResponseInput,
  ): AsyncGenerator<string, void, void> {
    const lesson = await this.getStudentLessonContextOrThrow(
      input.studentId,
      input.lessonId,
    );

    await this.resolveUserChatEntry(input);
    const conversation = await this.getConversation(input.studentId, input.lessonId);

    const genAI = this.getGenAIClientOrThrow();
    const responseStream = await genAI.models.generateContentStream({
      model: AI_MODEL,
      contents: conversation.map((entry) => ({
        role: entry.role === ChatRole.USER ? 'user' : 'model',
        parts: [{ text: entry.content }],
      })),
      config: {
        systemInstruction: this.buildSystemInstruction(lesson),
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
        tools: [{ codeExecution: {} }, { googleSearch: {} }],
      },
    });

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

  private getGenAIClientOrThrow(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException('AI Tutor chưa được cấu hình.');
    }

    return new GoogleGenAI({ apiKey });
  }

  private buildSystemInstruction(lesson: LessonContext): string {
    return `${SOCRATIC_SYSTEM_PROMPT}\n\nNgữ cảnh bài học "${lesson.title}":\n${lesson.contentMd}`;
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
