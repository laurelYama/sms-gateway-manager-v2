export interface ToasterToast {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    variant?: 'default' | 'destructive';
}

export type ToastState = {
    toasts: ToasterToast[];
};

export type ToastAction =
    | {
    type: 'ADD_TOAST';
    toast: ToasterToast;
}
    | {
    type: 'UPDATE_TOAST';
    toast: Partial<ToasterToast>;
}
    | {
    type: 'DISMISS_TOAST';
    toastId?: string;
}
    | {
    type: 'REMOVE_TOAST';
    toastId?: string;
};

export type Toast = Omit<ToasterToast, 'id'>;