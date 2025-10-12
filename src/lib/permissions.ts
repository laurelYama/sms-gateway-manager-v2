import { UserToken } from '@/types';

export const canEdit = (user: UserToken | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canDelete = (user: UserToken | null): boolean => {
  return user?.role === 'SUPER_ADMIN';
};

export const canCreate = (user: UserToken | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canSuspend = (user: UserToken | null): boolean => {
  return user?.role === 'SUPER_ADMIN';
};

export const canManageUsers = (user: UserToken | null): boolean => {
  return user?.role === 'SUPER_ADMIN';
};

export const canApprove = (user: UserToken | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canReject = (user: UserToken | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canCreateTickets = (user: UserToken | null): boolean => {
  return user?.role !== 'AUDITEUR';
};

export const canUpdateTickets = (user: UserToken | null): boolean => {
  return user?.role !== 'AUDITEUR';
};
