import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { isEmail } from 'class-validator';
import nodemailer, { Transporter } from 'nodemailer';
import { PrismaService } from '../prisma/prisma.service';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';

type EmailRecipient = {
  email: string;
  fullName?: string | null;
};

type FailedRecipient = {
  email: string;
  reason: string;
};

const BULK_SEND_DELAY_MS = 200;

type BulkSendPayload = {
  subject: string;
  htmlContent: string;
  recipients: EmailRecipient[];
  transporter: Transporter;
};

export type SendBulkEmailAcceptedResponse = {
  status: 'accepted';
  totalRecipients: number;
  message: string;
};

@Injectable()
export class EmailsService {
  private readonly logger = new Logger(EmailsService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly prisma: PrismaService) { }

  async sendBulk(dto: SendBulkEmailDto): Promise<SendBulkEmailAcceptedResponse> {
    const subject = dto.subject.trim();
    const markdownContent = dto.markdownContent.trim();
    if (!subject || !markdownContent) {
      throw new BadRequestException('Tieu de va noi dung email khong duoc de trong.');
    }

    const recipients = await this.resolveRecipients(dto.targetEmails);
    if (recipients.length === 0) {
      throw new BadRequestException('Khong co nguoi nhan hop le.');
    }

    const htmlContent = this.toEmailHtml(subject, markdownContent);
    const transporter = this.getTransporter();
    this.startBackgroundSend({
      subject,
      htmlContent,
      recipients,
      transporter,
    });

    return {
      status: 'accepted',
      totalRecipients: recipients.length,
      message: `Dang gui email cho ${recipients.length} nguoi...`,
    };
  }

  private startBackgroundSend(payload: BulkSendPayload): void {
    setImmediate(() => {
      void this.executeBackgroundSend(payload);
    });
  }

  private async executeBackgroundSend(payload: BulkSendPayload): Promise<void> {
    const failedRecipients: FailedRecipient[] = [];
    let sentCount = 0;

    for (const recipient of payload.recipients) {
      try {
        await payload.transporter.sendMail({
          from: this.getFromAddress(),
          to: recipient.email,
          subject: payload.subject,
          html: payload.htmlContent,
        });
        sentCount += 1;
      } catch (error: unknown) {
        const reason = this.extractErrorMessage(error);
        failedRecipients.push({
          email: recipient.email,
          reason,
        });
        this.logger.warn(`Gui email that bai cho ${recipient.email}: ${reason}`);
      }

      await this.sleep(BULK_SEND_DELAY_MS);
    }

    this.logger.log(
      `Bulk email hoan tat: ${sentCount} thanh cong, ${failedRecipients.length} that bai / ${payload.recipients.length} tong`,
    );
  }

  private async resolveRecipients(
    targetEmails: SendBulkEmailDto['targetEmails'],
  ): Promise<EmailRecipient[]> {
    if (targetEmails === 'ALL') {
      return this.prisma.user.findMany({
        where: { role: Role.STUDENT },
        select: {
          email: true,
          fullName: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!Array.isArray(targetEmails) || targetEmails.length === 0) {
      throw new BadRequestException(
        'targetEmails phai la "ALL" hoac danh sach email khong rong.',
      );
    }

    const normalized = this.normalizeCustomEmails(targetEmails);
    if (normalized.length === 0) {
      throw new BadRequestException('Danh sach email khong hop le.');
    }

    return normalized.map((email) => ({ email }));
  }

  private normalizeCustomEmails(targetEmails: string[]): string[] {
    const unique = new Set<string>();

    for (const rawEmail of targetEmails) {
      const normalized = rawEmail.trim().toLowerCase();
      if (!normalized) {
        continue;
      }
      if (!isEmail(normalized)) {
        throw new BadRequestException(`Email khong hop le: ${rawEmail}`);
      }
      unique.add(normalized);
    }

    return Array.from(unique);
  }

  private toEmailHtml(subject: string, markdownContent: string): string {
    const contentHtml = this.renderMarkdownToHtml(markdownContent);

    return `
      <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:20px 24px;background:linear-gradient(90deg,#111827,#1f2937);color:#f8fafc;">
              <div style="font-size:18px;font-weight:700;">Ôn Thi cho Azubi</div>
              <div style="margin-top:4px;font-size:12px;opacity:0.85;">Thông báo mới từ azubivn.de!</div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px;">
              <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111827;">${this.escapeHtml(subject)}</h1>
              <div style="font-size:14px;line-height:1.7;color:#111827;">${contentHtml}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;">
              Email này được gửi từ hệ thống ôn thi Abschlussprüfung ngành Fachkarft für Gastronomie tại azubivn.de .
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  private renderMarkdownToHtml(markdownContent: string): string {
    const lines = markdownContent.replaceAll('\r\n', '\n').split('\n');
    const htmlParts: string[] = [];
    let inList = false;

    const closeList = () => {
      if (!inList) {
        return;
      }
      htmlParts.push('</ul>');
      inList = false;
    };

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        closeList();
        continue;
      }

      const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        closeList();
        const level = headingMatch[1].length;
        const text = this.applyInlineMarkdown(headingMatch[2]);
        htmlParts.push(
          `<h${level} style="margin:0 0 12px;font-size:${24 - level * 2}px;line-height:1.35;">${text}</h${level}>`,
        );
        continue;
      }

      const listItemMatch = line.match(/^[-*]\s+(.+)$/);
      if (listItemMatch) {
        if (!inList) {
          htmlParts.push('<ul style="margin:0 0 12px 20px;padding:0;">');
          inList = true;
        }
        htmlParts.push(`<li style="margin:0 0 8px;">${this.applyInlineMarkdown(listItemMatch[1])}</li>`);
        continue;
      }

      closeList();
      htmlParts.push(
        `<p style="margin:0 0 12px;">${this.applyInlineMarkdown(line)}</p>`,
      );
    }

    closeList();
    return htmlParts.join('');
  }

  private applyInlineMarkdown(input: string): string {
    let html = this.escapeHtml(input);

    html = html.replaceAll(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url) => {
      const safeUrl = this.sanitizeLinkUrl(url);
      if (!safeUrl) {
        return match;
      }
      return `<a href="${safeUrl}" style="color:#2563eb;text-decoration:underline;" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    html = html.replaceAll(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replaceAll(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replaceAll(
      /`([^`]+)`/g,
      '<code style="padding:2px 4px;border-radius:4px;background:#e2e8f0;font-family:monospace;">$1</code>',
    );

    return html;
  }

  private sanitizeLinkUrl(rawUrl: string): string | null {
    const normalized = rawUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      return null;
    }

    try {
      const parsed = new URL(normalized);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return null;
      }
      return this.escapeHtml(parsed.toString());
    } catch {
      return null;
    }
  }

  private getTransporter(): Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS ?? process.env.SMTP_PASSWORD;

    if (!Number.isFinite(port) || port <= 0) {
      throw new ServiceUnavailableException('SMTP_PORT khong hop le.');
    }
    if (!user || !pass) {
      throw new ServiceUnavailableException(
        'Thieu cau hinh SMTP_USER/SMTP_PASS cho tinh nang gui email.',
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    const fromName = process.env.SMTP_FROM_NAME || 'AzubiVN Learning';
    const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

    if (!fromEmail) {
      throw new ServiceUnavailableException('Thieu SMTP_FROM_EMAIL hoac SMTP_USER.');
    }

    return `"${fromName}" <${fromEmail}>`;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private extractErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return 'Gui email that bai';
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
