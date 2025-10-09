import { User } from '@/lib/auth';

type Role = 'ADMIN' | 'SUPER_ADMIN' | 'AUDITEUR';

export const canEdit = (user: User | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canDelete = (user: User | null): boolean => {
  return user?.role === 'SUPER_ADMIN';
};

export const canCreate = (user: User | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canSuspend = (user: User | null): boolean => {
  return user?.role === 'SUPER_ADMIN';
};

export const canManageUsers = (user: User | null): boolean => {
  return user?.role === 'SUPER_ADMIN';
};

export const canApprove = (user: User | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canReject = (user: User | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canCreateTickets = (user: User | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canUpdateTickets = (user: User | null): boolean => {
  return user?.role !== 'AUDITEUR';
};
