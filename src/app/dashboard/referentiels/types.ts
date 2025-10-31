export interface Referentiel {
  refID: number;
  keyValue: string;
  value1: string;
  value2: string;
  value3: string;
  value4: string;
  refCategory: string;
  createdAt?: string;
  updatedAt?: string;
  // Propriété id maintenue pour la rétrocompatibilité
  id?: number;
}

export interface ReferentielCategory {
  code: string;
  label: string;
}

export const REFERENTIEL_CATEGORIES: Record<string, string> = {
  '001': 'Ciudad',
  '002': 'Sector de actividad',
  '003': 'Operador',
  '004': 'País',
  '005': 'Motivos de rechazo'
} as const;

// Pour la création, refID est optionnel car généré côté serveur
export type ReferentielFormData = Omit<Referentiel, 'id' | 'createdAt' | 'updatedAt' | 'refID'> & {
  refID?: number;
};
