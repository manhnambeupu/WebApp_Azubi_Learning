import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import nodemailer from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from './emails.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('EmailsService', () => {
  let service: EmailsService;
  let setImmediateSpy: jest.SpyInstance;
  let prismaService: {
    user: {
      findMany: jest.Mock;
    };
  };
  let sendMailMock: jest.Mock;
  const flushBackgroundJob = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(async () => {
    setImmediateSpy = jest
      .spyOn(global, 'setImmediate')
      .mockImplementation((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
        callback(...args);
        return {} as NodeJS.Immediate;
      });
    sendMailMock = jest.fn();

    prismaService = {
      user: {
        findMany: jest.fn(),
      },
    };

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: sendMailMock,
    });

    process.env.SMTP_HOST = 'smtp.gmail.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'admin@example.com';
    process.env.SMTP_PASS = 'app-password';

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        EmailsService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = moduleRef.get(EmailsService);
    jest
      .spyOn(
        service as unknown as { sleep: (ms: number) => Promise<void> },
        'sleep',
      )
      .mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    setImmediateSpy.mockRestore();
  });

  it('gui ALL students theo che do fire-and-forget', async () => {
    prismaService.user.findMany.mockResolvedValue([
      { email: 'student1@example.com', fullName: 'Student One' },
      { email: 'student2@example.com', fullName: 'Student Two' },
    ]);
    sendMailMock.mockResolvedValue({ messageId: 'ok' });

    const result = await service.sendBulk({
      subject: 'Thong bao',
      markdownContent: 'Xin chao **hoc vien**',
      targetEmails: 'ALL',
    });
    await flushBackgroundJob();

    expect(prismaService.user.findMany).toHaveBeenCalledWith({
      where: { role: 'STUDENT' },
      select: { email: true, fullName: true },
      orderBy: { createdAt: 'desc' },
    });
    expect(setImmediateSpy).toHaveBeenCalled();
    expect(sendMailMock).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      status: 'accepted',
      totalRecipients: 2,
      message: 'Dang gui email cho 2 nguoi...',
    });
  });

  it('custom target co email khong hop le -> throw BadRequestException', async () => {
    await expect(
      service.sendBulk({
        subject: 'Thong bao',
        markdownContent: 'Noi dung',
        targetEmails: ['student@example.com', 'invalid-email'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('mot so email gui that bai van tiep tuc gui email khac', async () => {
    sendMailMock
      .mockResolvedValueOnce({ messageId: 'ok-1' })
      .mockRejectedValueOnce(new Error('SMTP timeout'));

    const result = await service.sendBulk({
      subject: 'Thong bao',
      markdownContent: 'Noi dung',
      targetEmails: ['student1@example.com', 'student2@example.com'],
    });
    await flushBackgroundJob();

    expect(sendMailMock).toHaveBeenCalledTimes(2);
    expect(result.status).toBe('accepted');
    expect(result.totalRecipients).toBe(2);
  });

  it('thieu SMTP config -> throw ServiceUnavailableException', async () => {
    delete process.env.SMTP_USER;

    await expect(
      service.sendBulk({
        subject: 'Thong bao',
        markdownContent: 'Noi dung',
        targetEmails: ['student1@example.com'],
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
