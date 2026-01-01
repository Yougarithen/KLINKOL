// ============================================================
// SERVICE FACTURE
// ============================================================

// services/factureService.js
import { apiRequest } from './apiConfig';
import { corrigerMontantsFacture, corrigerFactures } from '@/util/facture-utils';

/**
 * Service pour gérer les factures et les créances
 * Une facture peut être payée en plusieurs fois
 * 
 * ⚠️ IMPORTANT: Le backend retourne les montants AVANT remise.
 * Ce service applique automatiquement les corrections via corrigerMontantsFacture()
 */
const factureService = {
  
  /**
   * Récupérer toutes les factures avec leurs totaux
   * @returns Promise<{ success: true, data: Facture[] }>
   * Les montants sont automatiquement corrigés (remise appliquée)
   */
  getAll: async () => {
    const response = await apiRequest('/factures');
    return {
      ...response,
      data: corrigerFactures(response.data)
    };
  },

  /**
   * Récupérer une facture par ID avec ses lignes
   * @param {number} id - ID de la facture
   * @returns Promise<{ success: true, data: FactureComplete }>
   * Les montants sont automatiquement corrigés (remise appliquée)
   */
  getById: async (id) => {
    const response = await apiRequest(`/factures/${id}`);
    return {
      ...response,
      data: corrigerMontantsFacture(response.data)
    };
  },

  /**
   * Créer une nouvelle facture
   * @param {Object} factureData
   * @param {number} factureData.id_client - ID du client (REQUIS)
   * @param {number} factureData.id_devis - ID du devis source (optionnel)
   * @param {string} factureData.date_facture - Date de la facture
   * @param {string} factureData.date_echeance - Date d'échéance
   * @param {string} factureData.statut - Statut
   * @param {string} factureData.type_facture - Type (STANDARD, AVOIR, PROFORMA)
   * @param {number} factureData.remise_globale - Remise globale %
   * @param {string} factureData.conditions_paiement - Conditions
   * @param {string} factureData.notes - Notes
   * @returns Promise<{ success: true, data: Facture }>
   * 
   * Le numéro de facture est généré automatiquement (FAC-001, FAC-002...)
   */
  create: async (factureData) => {
    const response = await apiRequest('/factures', {
      method: 'POST',
      body: JSON.stringify(factureData),
    });
    return {
      ...response,
      data: corrigerMontantsFacture(response.data)
    };
  },

  /**
   * Mettre à jour une facture
   * @param {number} id - ID de la facture
   * @param {Object} factureData - Nouvelles données
   * @returns Promise<{ success: true, data: Facture }>
   */
  update: async (id, factureData) => {
    const response = await apiRequest(`/factures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(factureData),
    });
    return {
      ...response,
      data: corrigerMontantsFacture(response.data)
    };
  },

  /**
   * Supprimer une facture
   * @param {number} id - ID de la facture
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/factures/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Ajouter une ligne à la facture
   * @param {number} id_facture - ID de la facture
   * @param {Object} ligneData
   * @returns Promise<{ success: true, data: Facture }>
   */
  ajouterLigne: async (id_facture, ligneData) => {
    const response = await apiRequest(`/factures/${id_facture}/lignes`, {
      method: 'POST',
      body: JSON.stringify(ligneData),
    });
    return {
      ...response,
      data: corrigerMontantsFacture(response.data)
    };
  },

  /**
   * Valider une facture
   * ⚠️ IMPORTANT: La validation déduit automatiquement le stock des produits
   * Une fois validée, la facture ne peut plus être modifiée
   * 
   * @param {number} id - ID de la facture
   * @returns Promise<{ success: true, data: Facture }>
   */
  valider: async (id) => {
    const response = await apiRequest(`/factures/${id}/valider`, {
      method: 'POST',
    });
    return {
      ...response,
      data: corrigerMontantsFacture(response.data)
    };
  },

  /**
   * Récupérer toutes les factures en crédit (impayées ou partiellement payées)
   * @returns Promise<{ success: true, data: FactureCredit[] }>
   * Les montants sont automatiquement corrigés (remise appliquée)
   */
  getFacturesCredit: async () => {
    const response = await apiRequest('/factures/credit');
    return {
      ...response,
      data: corrigerFactures(response.data)
    };
  },

  /**
   * Récupérer les factures d'un client spécifique
   * @param {number} id_client - ID du client
   * @returns Promise<{ success: true, data: Facture[] }>
   * Les montants sont automatiquement corrigés (remise appliquée)
   */
  getByClient: async (id_client) => {
    const response = await apiRequest('/factures');
    const facturesClient = response.data.filter(f => f.id_client === id_client);
    return {
      success: true,
      data: corrigerFactures(facturesClient)
    };
  },

  /**
   * Calculer le crédit total d'un client
   * @param {number} id_client - ID du client
   * @returns Promise<{ success: true, data: CreditClient }>
   * Exemple de data: {
   *   id_client: 1,
   *   client: "Entreprise ABC",
   *   nb_factures_credit: 3,
   *   total_achats: 50000.00,
   *   total_paye: 30000.00,
   *   credit_restant: 20000.00,
   *   prochaine_echeance: "2026-01-15"
   * }
   */
  getCreditClient: async (id_client) => {
    const response = await apiRequest(`/clients/${id_client}/credits`);
    // Le backend calcule déjà les totaux correctement
    return response;
  },

  /**
   * Envoyer une facture par email (à implémenter côté backend)
   * @param {number} id - ID de la facture
   * @param {string} email - Email du destinataire
   * @returns Promise<{ success: true, message: string }>
   */
  envoyerParEmail: async (id, email) => {
    // À implémenter selon ton système d'emailing
    console.log(`Envoyer facture ${id} à ${email}`);
    return { success: true, message: 'Email envoyé' };
  },
};

export default factureService;