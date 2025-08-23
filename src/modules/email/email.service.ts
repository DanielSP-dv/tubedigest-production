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
    // Try Gmail first if configured
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        this.logger.log(`Sending digest email via Gmail to ${to}`);
        const gmailTransporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        });

        const info = await gmailTransporter.sendMail({
          from: process.env.GMAIL_USER,
          to,
          subject,
          html,
          text
        });
        
        this.logger.log(`Email sent successfully via Gmail: ${info.messageId}`);
        return info.messageId as string;
      } catch (error) {
        this.logger.warn(`Gmail sending failed, falling back to Brevo: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fall through to Brevo
      }
    }

    // Fallback to Brevo SMTP
    const from = process.env.SMTP_FROM || '954bc2001@smtp-brevo.com';
    
    try {
      this.logger.log(`Sending digest email via Brevo to ${to}`);
      const mailOptions: any = { from, to, subject, html };
      if (text) {
        mailOptions.text = text;
      }
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email sent successfully via Brevo: ${info.messageId}`);
      return info.messageId as string;
    } catch (error) {
      this.logger.error(`Email send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  async sendTestToGmail(to: string, subject: string, html: string) {
    // Create a test transporter for Gmail
    const testTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    try {
      this.logger.log(`Sending Gmail test email to ${to}`);
      const info = await testTransporter.sendMail({ 
        from: process.env.GMAIL_USER, 
        to, 
        subject, 
        html 
      });
      this.logger.log(`Gmail test email sent successfully: ${info.messageId}`);
      return info.messageId as string;
    } catch (error) {
      this.logger.error(`Gmail test email failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async sendWithFallbackProvider(to: string, subject: string, html: string, from: string): Promise<string> {
    // TODO: Implement fallback providers (Postmark, SendGrid, etc.)
    // This is a stub for future implementation
    this.logger.warn(`Fallback email provider not implemented yet. Would send to ${to}`);
    return 'fallback-message-id';
  }

  async testConfiguration(): Promise<{ status: string; message: string }> {
    try {
      this.logger.log('Testing email service configuration...');
      
      // Test transporter configuration
      await this.transporter.verify();
      
      this.logger.log('Email service configuration is valid');
      return { 
        status: 'success', 
        message: 'Email service configuration is valid' 
      };
    } catch (error) {
      this.logger.error(`Email service configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { 
        status: 'error', 
        message: `Email service configuration test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }
}


