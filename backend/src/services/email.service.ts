import nodemailer from 'nodemailer';
import { config } from '../configs';
import { logger } from '../configs/logger';

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: false,
  auth: config.email.user ? { user: config.email.user, pass: config.email.pass } : undefined,
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  if (!config.email.user) {
    logger.info(`[Email Mock] To: ${to}, Subject: ${subject}`);
    return;
  }

  await transporter.sendMail({
    from: config.email.from,
    to,
    subject,
    html,
  });
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const url = `${config.clientUrl}/verify-email?token=${token}`;
  await sendEmail(
    email,
    'Verify your FleetFlow account',
    `<h2>Welcome to FleetFlow!</h2><p>Click <a href="${url}">here</a> to verify your email.</p>`
  );
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const url = `${config.clientUrl}/reset-password?token=${token}`;
  await sendEmail(
    email,
    'Reset your FleetFlow password',
    `<h2>Password Reset</h2><p>Click <a href="${url}">here</a> to reset your password. Link expires in 1 hour.</p>`
  );
};
