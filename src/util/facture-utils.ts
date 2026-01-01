/**
 * Utilitaires pour corriger et calculer les montants des factures
 */

/**
 * Corrige le montant TTC d'une facture si nécessaire
 * Le backend retourne les montants AVANT remise, on calcule APRÈS remise
 */
export const corrigerMontantsFacture = (facture: any) => {
  const remise = Number(facture.remise_globale) || 0;
  
  // Montants AVANT remise (ce que le backend retourne)
  const montantHTAvantRemise = Number(facture.montant_ht) || 0;
  const montantTVAAvantRemise = Number(facture.montant_tva) || 0;
  const montantTTCAvantRemise = montantHTAvantRemise + montantTVAAvantRemise;
  
  // Calculer le montant de la remise en DZD
  const montantRemise = montantTTCAvantRemise * (remise / 100);
  
  // Calculer les montants APRÈS remise
  const montantTTC = montantTTCAvantRemise - montantRemise;
  const montantHT = montantHTAvantRemise * (1 - remise / 100);
  const montantTVA = montantTVAAvantRemise * (1 - remise / 100);
  
  const montant_paye = Number(facture.montant_paye) || 0;
  const montant_restant = Math.max(0, montantTTC - montant_paye);
  
  return {
    ...facture,
    montant_ht_avant_remise: montantHTAvantRemise,
    montant_tva_avant_remise: montantTVAAvantRemise,
    montant_ht: montantHT,
    montant_tva: montantTVA,
    montant_ttc: montantTTC,
    montant_remise: montantRemise,
    montant_paye: montant_paye,
    montant_restant: montant_restant,
    remise_globale: remise
  };
};

/**
 * Corrige un tableau de factures
 */
export const corrigerFactures = (factures: any[]) => {
  if (!Array.isArray(factures)) return [];
  return factures.map(corrigerMontantsFacture);
};

/**
 * Calcule les totaux d'un ensemble de factures
 */
export const calculerTotauxFactures = (factures: any[]) => {
  const facturesCorrigees = corrigerFactures(factures);
  
  return {
    totalAchats: facturesCorrigees.reduce((sum, f) => sum + (f.montant_ttc || 0), 0),
    totalPaye: facturesCorrigees.reduce((sum, f) => sum + (f.montant_paye || 0), 0),
    totalRestant: facturesCorrigees.reduce((sum, f) => sum + (f.montant_restant || 0), 0),
  };
};