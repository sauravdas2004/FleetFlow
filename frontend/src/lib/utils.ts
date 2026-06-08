import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
    assigned: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    picked_up: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    in_transit: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    delivered: 'bg-green-500/10 text-green-600 dark:text-green-400',
    cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400',
    online: 'bg-green-500/10 text-green-600 dark:text-green-400',
    offline: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    busy: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  };
  return colors[status] || 'bg-gray-500/10 text-gray-600';
}

export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
