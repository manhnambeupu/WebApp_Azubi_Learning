import { EmailsController } from './emails.controller';
import { SendBulkEmailDto } from './dto/send-bulk-email.dto';

describe('EmailsController', () => {
  let controller: EmailsController;
  let emailsService: {
    sendBulk: jest.Mock;
  };

  beforeEach(() => {
    emailsService = {
      sendBulk: jest.fn(),
    };
    controller = new EmailsController(emailsService as never);
  });

  it('sendBulk delegates to service', async () => {
    const dto: SendBulkEmailDto = {
      subject: 'Thong bao',
      markdownContent: 'Noi dung',
      targetEmails: 'ALL',
    };

    emailsService.sendBulk.mockResolvedValue({
      status: 'accepted',
      totalRecipients: 2,
      message: 'Dang gui email cho 2 nguoi...',
    });

    const result = await controller.sendBulk(dto);

    expect(emailsService.sendBulk).toHaveBeenCalledWith(dto);
    expect(result.status).toBe('accepted');
  });
});
