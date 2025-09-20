import { ReactNode, ReactElement } from 'react';

// Types de base pour les toasts
export type ToastVariant = 'default' | 'destructive';

export interface ToastProps {
  className?: string;
  variant?: ToastVariant;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
}

export interface ToastActionProps {
  altText: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export type ToastActionElement = ReactElement<ToastActionProps>;

export interface ToasterToast extends ToastProps {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
}

export interface ToastState {
  toasts: ToasterToast[];
}

export type ToastAction = 
  | { type: 'ADD_TOAST'; toast: ToasterToast }
  | { type: 'UPDATE_TOAST'; toast: Partial<ToasterToast> }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string };
