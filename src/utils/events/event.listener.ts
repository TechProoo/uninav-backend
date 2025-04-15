import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EVENTS } from 'src/utils/events/events.enum';
import { EmailService } from 'src/utils/email/email.service';
import {
  EmailPaths,
  EmailSubjects,
} from 'src/utils/config/constants/email.enum';
import { UserRoleEnum } from 'src/utils/types/db.types';
import { ConfigService } from '@nestjs/config';
import { cryptoService } from 'src/utils/crypto/crypto.service';
import { JwtService } from '@nestjs/jwt';
import { ENV } from 'src/utils/config/env.enum';

@Injectable()
export class EventsListeners {
  private logger = new Logger(EventsListeners.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  @OnEvent(EVENTS.USER_REGISTERED)
  async handleUserRegisteredEvent(payload: {
    email: string;
    firstName: string;
    lastName: string;
    departmentName: string;
    role: UserRoleEnum;
  }) {
    try {
      // Select the appropriate template based on user role
      let template: EmailPaths;

      switch (payload.role) {
        case UserRoleEnum.ADMIN:
          template = EmailPaths.WELCOME_ADMIN;
          break;
        case UserRoleEnum.MODERATOR:
          template = EmailPaths.WELCOME_MODERATOR;
          break;
        case UserRoleEnum.STUDENT:
        default:
          template = EmailPaths.WELCOME_STUDENT;
          break;
      }

      await this.emailService.sendMail({
        to: payload.email,
        subject: EmailSubjects.WELCOME,
        options: { template, data: payload },
      });
      this.logger.log(`Welcome email sent to ${payload.email}`);
    } catch (error) {
      this.logger.error('Failed to send welcome message:', error.message);
    }
  }

  @OnEvent(EVENTS.EMAIL_VERIFICATION_REQUESTED)
  async handleEmailVerificationRequest(payload: {
    email: string;
    firstName: string;
    lastName: string;
    verificationCode: string;
    verificationUrl: string;
  }) {
    try {
      await this.emailService.sendMail({
        to: payload.email,
        subject: EmailSubjects.EMAIL_VERIFICATION,
        options: {
          template: EmailPaths.EMAIL_VERIFICATION,
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            verificationCode: payload.verificationCode,
            verificationUrl: payload.verificationUrl,
          },
        },
      });
      this.logger.log(`Verification email sent to ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${payload.email}:`,
        error,
      );
    }
  }

  @OnEvent(EVENTS.EMAIL_VERIFICATION_SUCCESS)
  async handleEmailVerificationSuccess(payload: {
    email: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      await this.emailService.sendMail({
        to: payload.email,
        subject: EmailSubjects.EMAIL_VERIFICATION_SUCCESS,
        options: {
          template: EmailPaths.USER_VERIFICATION_SUCCESS,
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
          },
        },
      });
      this.logger.log(`Verification success email sent to ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send verification success email to ${payload.email}:`,
        error,
      );
    }
  }

  @OnEvent(EVENTS.EMAIL_VERIFICATION_RESEND)
  async handleEmailVerificationResend(payload: {
    email: string;
    firstName: string;
    lastName: string;
    verificationCode: string;
    userId: string;
  }) {
    try {
      // Generate verification token as backup
      const token = await this.generateVerificationToken(
        payload.email,
        payload.verificationCode,
      );

      // Create verification URL
      const frontendUrl = this.configService.get(ENV.FRONTEND_URL);
      const verificationUrl = `${frontendUrl}/auth/verify-email?token=${encodeURIComponent(token)}`;

      await this.emailService.sendMail({
        to: payload.email,
        subject: EmailSubjects.EMAIL_VERIFICATION,
        options: {
          template: EmailPaths.EMAIL_VERIFICATION,
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            verificationCode: payload.verificationCode,
            verificationUrl,
          },
        },
      });
      this.logger.log(`Verification email resent to ${payload.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to resend verification email to ${payload.email}:`,
        error,
      );
    }
  }

  @OnEvent(EVENTS.MATERIAL_REJECTED)
  async handleMaterialRejection(payload: {
    materialId: string;
    creatorEmail: string;
    creatorName: string;
    materialLabel: string;
    comment: string;
  }) {
    await this.emailService.sendMaterialRejectionEmail(
      payload.creatorEmail,
      payload.creatorName,
      payload.materialLabel,
      payload.comment,
    );
  }

  @OnEvent(EVENTS.BLOG_REJECTED)
  async handleBlogRejection(payload: {
    blogId: string;
    creatorEmail: string;
    creatorName: string;
    blogTitle: string;
    comment: string;
  }) {
    await this.emailService.sendBlogRejectionEmail(
      payload.creatorEmail,
      payload.creatorName,
      payload.blogTitle,
      payload.comment,
    );
  }

  @OnEvent(EVENTS.MODERATOR_REQUEST_REJECTED)
  async handleModeratorRejection(payload: { userId: string; comment: string }) {
    await this.emailService.sendModeratorRejectionEmail(
      payload.userId,
      payload.comment,
    );
  }

  @OnEvent(EVENTS.COURSE_REJECTED)
  async handleCourseRejection(payload: {
    courseId: string;
    creatorEmail: string;
    creatorName: string;
    courseName: string;
    comment: string;
  }) {
    await this.emailService.sendCourseRejectionEmail(
      payload.creatorEmail,
      payload.creatorName,
      payload.courseName,
      payload.comment,
    );
  }

  @OnEvent(EVENTS.DLC_REJECTED)
  async handleDLCRejection(payload: {
    departmentId: string;
    courseId: string;
    level: number;
    creatorEmail: string;
    creatorName: string;
    courseName: string;
    comment: string;
  }) {
    await this.emailService.sendDLCRejectionEmail(
      payload.creatorEmail,
      payload.creatorName,
      payload.courseName,
      payload.level,
      payload.comment,
    );
  }

  @OnEvent(EVENTS.PASSWORD_RESET_REQUESTED)
  async handlePasswordResetRequest(payload: {
    email: string;
    firstName: string;
    lastName: string;
    resetUrl: string;
  }) {
    try {
      await this.emailService.sendMail({
        to: payload.email,
        subject: EmailSubjects.PASSWORD_RESET,
        options: {
          template: EmailPaths.PASSWORD_RESET,
          data: {
            firstName: payload.firstName,
            lastName: payload.lastName,
            resetUrl: payload.resetUrl,
          },
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${payload.email}:`,
        error,
      );
      throw error;
    }
  }

  // Helper method to generate verification token
  private async generateVerificationToken(
    email: string,
    code: string,
  ): Promise<string> {
    const payload = { email, code, type: 'email_verification' };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '15m',
    });
    return cryptoService.encrypt(token);
  }
}
