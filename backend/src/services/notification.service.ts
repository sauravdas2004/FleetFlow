import { Notification, INotification } from '../models';
import { NotificationType } from '../types/enums';
import { publishEvent } from '../configs/redis';

export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: NotificationType = NotificationType.SYSTEM,
  data?: Record<string, unknown>
): Promise<INotification> => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    data,
  });

  await publishEvent('notifications', {
    userId,
    notification: {
      id: notification._id,
      title,
      message,
      type,
      data,
      createdAt: notification.createdAt,
    },
  });

  return notification;
};

export const getUserNotifications = async (
  userId: string,
  page: number,
  limit: number,
  unreadOnly = false
) => {
  const filter: Record<string, unknown> = { user: userId };
  if (unreadOnly) filter.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: userId, isRead: false }),
  ]);

  return { notifications, total, unreadCount };
};

export const markAsRead = async (notificationId: string, userId: string) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
};

export const markAllAsRead = async (userId: string) => {
  return Notification.updateMany({ user: userId, isRead: false }, { isRead: true });
};
