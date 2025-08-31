import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  
  private transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });

  async sendDigest(to: string, subject: string, html: string, text?: string) {
    const from = process.env.SMTP_FROM;
    
    try {
      this.logger.log(`Sending digest email to ${to}`);
      const mailOptions: any = { from, to, subject, html };
      if (text) {
        mailOptions.text = text;
      }
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return info.messageId as string;
    } catch (error) {
      this.logger.error(`Email send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }
}


