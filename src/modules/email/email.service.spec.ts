import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock('nodemailer');

describe('EmailService', () => {
  let service: EmailService;
  let mockTransporter: any;

  beforeEach(async () => {
    // Create mock transporter
    mockTransporter = {
      sendMail: jest.fn(),
      verify: jest.fn(),
    };

    // Mock nodemailer.createTransport
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailService],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendDigest', () => {
    it('should send email successfully', async () => {
      const mockMessageId = 'test-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId: mockMessageId });

      const result = await service.sendDigest('test@example.com', 'Test Subject', '<p>Test HTML</p>');

      expect(result).toBe(mockMessageId);
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: '954bc2001@smtp-brevo.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });
    });

    it('should handle email send failure', async () => {
      const error = new Error('SMTP connection failed');
      mockTransporter.sendMail.mockRejectedValue(error);

      await expect(service.sendDigest('test@example.com', 'Test Subject', '<p>Test HTML</p>'))
        .rejects.toThrow('SMTP connection failed');
    });

    it('should use custom SMTP_FROM when provided', async () => {
      const originalFrom = process.env.SMTP_FROM;
      process.env.SMTP_FROM = 'custom@example.com';
      
      const mockMessageId = 'test-message-id';
      mockTransporter.sendMail.mockResolvedValue({ messageId: mockMessageId });

      await service.sendDigest('test@example.com', 'Test Subject', '<p>Test HTML</p>');

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'custom@example.com',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
      });

      // Restore original value
      process.env.SMTP_FROM = originalFrom;
    });
  });

  describe('sendTestToGmail', () => {
    it('should send Gmail test email successfully', async () => {
      const mockMessageId = 'gmail-test-message-id';
      const mockGmailTransporter = {
        sendMail: jest.fn().mockResolvedValue({ messageId: mockMessageId }),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(mockGmailTransporter);

      const result = await service.sendTestToGmail('test@gmail.com', 'Gmail Test', '<p>Test HTML</p>');

      expect(result).toBe(mockMessageId);
      expect(mockGmailTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.GMAIL_USER,
        to: 'test@gmail.com',
        subject: 'Gmail Test',
        html: '<p>Test HTML</p>',
      });
    });

    it('should handle Gmail test email failure', async () => {
      const error = new Error('Gmail authentication failed');
      const mockGmailTransporter = {
        sendMail: jest.fn().mockRejectedValue(error),
      };

      (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(mockGmailTransporter);

      await expect(service.sendTestToGmail('test@gmail.com', 'Gmail Test', '<p>Test HTML</p>'))
        .rejects.toThrow('Gmail authentication failed');
    });
  });

  describe('testConfiguration', () => {
    it('should return success when configuration is valid', async () => {
      mockTransporter.verify.mockResolvedValue(undefined);

      const result = await service.testConfiguration();

      expect(result).toEqual({
        status: 'success',
        message: 'Email service configuration is valid',
      });
      expect(mockTransporter.verify).toHaveBeenCalled();
    });

    it('should return error when configuration is invalid', async () => {
      const error = new Error('Invalid SMTP configuration');
      mockTransporter.verify.mockRejectedValue(error);

      const result = await service.testConfiguration();

      expect(result).toEqual({
        status: 'error',
        message: 'Email service configuration test failed: Invalid SMTP configuration',
      });
      expect(mockTransporter.verify).toHaveBeenCalled();
    });
  });

  describe('transporter configuration', () => {
    it('should create transporter with correct configuration', () => {
      // The transporter should be created in the constructor
      expect(nodemailer.createTransport).toHaveBeenCalledWith({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: false,
        auth: process.env.SMTP_USER
          ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          : undefined,
      });
    });
  });
});
