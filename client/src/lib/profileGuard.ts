import { User } from '@/stores/auth.store';

export function isProfileComplete(user: User | null): boolean {
  if (!user) return false;
  const hasPhone = Boolean(user.phoneNumber && user.phoneNumber.trim().length >= 8);
  const hasCode = Boolean((user.userCode && user.userCode.trim().length > 0) || (user.mssv && user.mssv.trim().length > 0));
  const hasCategory = Boolean(user.userCategory);
  return hasPhone && hasCode && hasCategory;
}
