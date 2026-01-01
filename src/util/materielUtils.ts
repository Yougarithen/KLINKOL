// utils/matiereUtils.ts
export type TypeMatiere = 'MINERAL' | 'CHIMIQUE' | 'EMBALLAGE';

export const TYPE_MATIERE_CONFIG = {
  MINERAL: {
    label: 'Matière Minérale',
    prefix: 'MIN',
    couleur: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  CHIMIQUE: {
    label: 'Produit Chimique',
    prefix: 'CHI',
    couleur: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  EMBALLAGE: {
    label: 'Emballage',
    prefix: 'EMB',
    couleur: 'bg-green-100 text-green-800 border-green-300'
  }
};

/**
 * Générer un code matière basé sur le type
 * Exemple: MIN-001, CHI-023, EMB-005
 */
export const genererCodeMatiere = (type: TypeMatiere, numero: number): string => {
  const prefix = TYPE_MATIERE_CONFIG[type].prefix;
  return `${prefix}-${String(numero).padStart(3, '0')}`;
};

/**
 * Extraire le type depuis un code matière
 */
export const extraireTypeDepuisCode = (code: string): TypeMatiere | null => {
  if (code.startsWith('MIN-')) return 'MINERAL';
  if (code.startsWith('CHI-')) return 'CHIMIQUE';
  if (code.startsWith('EMB-')) return 'EMBALLAGE';
  return null;
};
