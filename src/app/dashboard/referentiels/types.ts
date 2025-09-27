export interface Referentiel {
  id?: number;
  keyValue: string;
  value1: string;
  value2: string;
  value3: string;
  value4: string;
  refCategory: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReferentielCategory {
  code: string;
  label: string;
}

export const REFERENTIEL_CATEGORIES: Record<string, string> = {
  '001': 'Ville',
  '002': "Secteur d'activité",
  '003': 'Opérateur',
  '004': 'Pays'
} as const;

export type ReferentielFormData = Omit<Referentiel, 'id' | 'createdAt' | 'updatedAt'>;
