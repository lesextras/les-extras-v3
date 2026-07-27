import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';

jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue(true);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              if (key === 'SMTP_HOST') return 'smtp.example.com';
              if (key === 'SMTP_PORT') return 587;
              if (key === 'SMTP_USER') return 'user';
              if (key === 'SMTP_PASS') return 'pass';
              if (key === 'SMTP_FROM') return 'no-reply@example.com';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send welcome freelance email', async () => {
    await service.sendWelcomeFreelanceEmail('test@test.com', 'John');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@test.com',
        subject: 'Bienvenue chez Les Extras !',
        from: 'no-reply@example.com',
      }),
    );
  });

  it('should send welcome establishment email', async () => {
    await service.sendWelcomeEstablishmentEmail('estab@test.com', 'Le Bristol');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('should send mission confirmed email', async () => {
    await service.sendMissionConfirmedEmail('free@test.com', '10/10/2026', 'Le Bristol');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('should send mission completed email', async () => {
    await service.sendMissionCompletedEmail('free@test.com', '10/10/2026');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('should send workshop booking email', async () => {
    await service.sendWorkshopBookingEmail('free@test.com', 'Atelier mixologie', '12/10/2026');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it('should send message notification email', async () => {
    await service.sendMessageNotificationEmail('test@test.com', 'Alice');
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });
});
