import {
  User,
  Driver,
  Delivery,
  Session,
  Vehicle,
} from '../models';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  parseDuration,
} from '../utils/jwt';
import { generateToken } from '../utils/helpers';
import { AppError } from '../utils/apiResponse';
import { UserRole } from '../types/enums';
import { config } from '../configs';
import { sendVerificationEmail, sendPasswordResetEmail } from './email.service';
import crypto from 'crypto';

export const registerUser = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  licenseNumber?: string;
}) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError('Email already registered', 409);

  const verificationToken = generateToken();
  const user = await User.create({
    ...data,
    role: data.role || UserRole.CUSTOMER,
    verificationToken,
  });

  if (user.role === UserRole.DRIVER) {
    if (!data.licenseNumber) throw new AppError('License number required for drivers', 400);
    await Driver.create({
      user: user._id,
      licenseNumber: data.licenseNumber,
    });
  }

  await sendVerificationEmail(user.email, verificationToken);

  const tokens = await createSession(user._id.toString(), user.email, user.role);
  const userObj = user.toObject();
  delete (userObj as Record<string, unknown>).password;

  return { user: userObj, ...tokens };
};

export const loginUser = async (email: string, password: string, userAgent?: string, ip?: string) => {
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.isActive) throw new AppError('Account is deactivated', 403);

  const tokens = await createSession(user._id.toString(), user.email, user.role, userAgent, ip);
  const userObj = user.toObject();
  delete (userObj as Record<string, unknown>).password;

  return { user: userObj, ...tokens };
};

const createSession = async (
  userId: string,
  email: string,
  role: UserRole,
  userAgent?: string,
  ip?: string
) => {
  const payload = { userId, email, role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await Session.create({
    user: userId,
    refreshToken,
    userAgent,
    ipAddress: ip,
    expiresAt: new Date(Date.now() + parseDuration(config.jwt.refreshExpiresIn)),
  });

  return { accessToken, refreshToken };
};

export const refreshTokens = async (refreshToken: string) => {
  const session = await Session.findOne({ refreshToken, isValid: true });
  if (!session) throw new AppError('Invalid refresh token', 401);

  if (session.expiresAt < new Date()) {
    session.isValid = false;
    await session.save();
    throw new AppError('Refresh token expired', 401);
  }

  const decoded = verifyRefreshToken(refreshToken);
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) throw new AppError('User not found', 401);

  session.isValid = false;
  await session.save();

  return createSession(user._id.toString(), user.email, user.role);
};

export const logoutUser = async (refreshToken: string) => {
  await Session.findOneAndUpdate({ refreshToken }, { isValid: false });
};

export const verifyEmail = async (token: string) => {
  const user = await User.findOne({ verificationToken: token }).select('+verificationToken');
  if (!user) throw new AppError('Invalid verification token', 400);
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  return user;
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = new Date(Date.now() + 3600000);
  await user.save();

  await sendPasswordResetEmail(email, resetToken);
};

export const resetPassword = async (token: string, password: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw new AppError('Invalid or expired reset token', 400);

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await Session.updateMany({ user: user._id }, { isValid: false });
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  let profile: Record<string, unknown> = user.toObject();

  if (user.role === UserRole.DRIVER) {
    const driver = await Driver.findOne({ user: userId })
      .populate('vehicle')
      .populate('user', '-password');
    profile = { ...profile, driver };
  }

  return profile;
};

export const updateProfile = async (
  userId: string,
  data: { firstName?: string; lastName?: string; phone?: string }
) => {
  const user = await User.findByIdAndUpdate(userId, data, { new: true, runValidators: true });
  if (!user) throw new AppError('User not found', 404);
  return user;
};
