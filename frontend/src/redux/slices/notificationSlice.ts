import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Notification } from '@/types';

interface NotificationState {
  items: Notification[];
  unreadCount: number;
}

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { items: [], unreadCount: 0 } as NotificationState,
  reducers: {
    setNotifications: (state, action: PayloadAction<{ items: Notification[]; unreadCount: number }>) => {
      state.items = action.payload.items;
      state.unreadCount = action.payload.unreadCount;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action: PayloadAction<string>) => {
      const item = state.items.find((n) => n._id === action.payload);
      if (item && !item.isRead) {
        item.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const { setNotifications, addNotification, markRead } = notificationSlice.actions;
export default notificationSlice.reducer;
