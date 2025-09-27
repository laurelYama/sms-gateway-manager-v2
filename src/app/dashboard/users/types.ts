export type UserStatus = 'ACTIF' | 'SUSPENDU' | 'ARCHIVE';

export interface Manager {
    idManager: string;
    nomManager: string;
    prenomManager: string;
    email: string;
    numeroTelephoneManager: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
    etat: UserStatus;
}

export interface CreateManagerDto {
    nomManager: string;
    prenomManager: string;
    email: string;
    numeroTelephoneManager: string;
    motDePasseManager: string;
    role: 'ADMIN' | 'SUPER_ADMIN';
}

export interface UsersTableProps {
    managers: Manager[];
    loading: boolean;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}

export interface UserFormData {
    nomManager: string;
    prenomManager: string;
    email: string;
    numeroTelephoneManager: string;
    role: 'ADMIN' | 'MANAGER' | 'USER';
    password?: string;
}
