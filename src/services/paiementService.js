// ============================================================
// SERVICE PAIEMENT - VERSION CORRIGÉE
// ============================================================

// services/paiementService.js
import { apiRequest } from './apiConfig';
import { corrigerMontantsFacture } from '@/util/facture-utils';

/** Bonjour je fais un test ici pour voir à peu près comment tout mlarh
 * Service pour gérer les paiements
 * Gère les paiements partiels et complets des factures
 */
const paiementService = {
  
  /**
   * Récupérer tous les paiements
   * @returns Promise<{ success: true, data: Paiement[] }>
   */
  getAll: async () => {
    return await apiRequest('/paiements');
  },

  /**
   * Récupérer un paiement par ID
   * @param {number} id - ID du paiement
   * @returns Promise<{ success: true, data: Paiement }>
   */
  getById: async (id) => {
    return await apiRequest(`/paiements/${id}`);
  },

  /**
   * Récupérer tous les paiements d'une facture
   * @param {number} id_facture - ID de la facture
   * @returns Promise<{ success: true, data: Paiement[] }>
   */
  getByFacture: async (id_facture) => {
    return await apiRequest(`/paiements/facture/${id_facture}`);
  },

  /**
   * Enregistrer un nouveau paiement
   * ⚠️ IMPORTANT: Met à jour automatiquement:
   * - Le montant payé de la facture
   * - Le statut de la facture (Payée si complet, Partiellement payée sinon)
   * 
   * @param {Object} paiementData
   * @param {number} paiementData.id_facture - ID de la facture (REQUIS)
   * @param {number} paiementData.montant_paye - Montant du paiement (REQUIS)
   * @param {string} paiementData.date_paiement - Date du paiement
   * @param {string} paiementData.mode_paiement - Mode (Espèces, Chèque, Virement, Carte, etc.)
   * @param {string} paiementData.reference - Référence (n° chèque, n° virement, etc.)
   * @param {string} paiementData.responsable - Nom du responsable
   * @param {string} paiementData.commentaire - Commentaire
   * @returns Promise<{ success: true, data: Paiement, message: string }>
   */
  create: async (paiementData) => {
    return await apiRequest('/paiements', {
      method: 'POST',
      body: JSON.stringify(paiementData),
    });
  },

  /**
   * Supprimer un paiement
   * ⚠️ Attention: Recalcule automatiquement le montant payé de la facture
   * @param {number} id - ID du paiement
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/paiements/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Enregistrer un paiement complet pour une facture
   * Calcule automatiquement le montant restant et crée le paiement
   * 
   * ✅ CORRECTION: Applique corrigerMontantsFacture pour avoir le bon montant_restant
   * 
   * @param {number} id_facture - ID de la facture
   * @param {string} mode_paiement - Mode de paiement
   * @param {string} reference - Référence
   * @param {string} responsable - Responsable
   * @returns Promise<{ success: true, data: Paiement }>
   */
  payerCompletement: async (id_facture, mode_paiement, reference, responsable) => {
    // ✅ Récupérer la facture ET appliquer la correction des montants
    const factureResponse = await apiRequest(`/factures/${id_facture}`);
    
    // ✅ CORRECTION: Appliquer corrigerMontantsFacture pour avoir le VRAI montant_restant
    const factureCorrigee = corrigerMontantsFacture(factureResponse.data);
    const montantRestant = factureCorrigee.montant_restant;

    // ✅ Vérification de sécurité
    if (montantRestant <= 0) {
      throw new Error('Cette facture est déjà entièrement payée');
    }

    return await paiementService.create({
      id_facture,
      montant_paye: montantRestant,
      mode_paiement,
      reference,
      responsable,
      commentaire: 'Paiement complet'
    });
  },

  /**
   * Récupérer l'historique des paiements d'un client
   * @param {number} id_client - ID du client
   * @returns Promise<{ success: true, data: Paiement[] }>
   */
  getHistoriqueClient: async (id_client) => {
    const response = await apiRequest('/paiements');
    // Filtrer côté client (ou ajouter un endpoint backend dédié)
    return {
      success: true,
      data: response.data // À filtrer selon id_client
    };
  },

  /**
   * Calculer le total des paiements sur une période
   * @param {string} date_debut - Date de début (ISO format)
   * @param {string} date_fin - Date de fin (ISO format)
   * @returns Promise<{ success: true, data: { total: number, count: number } }>
   */
  getTotalPeriode: async (date_debut, date_fin) => {
    const response = await apiRequest('/paiements');
    const paiementsPeriode = response.data.filter(p => {
      const datePaiement = new Date(p.date_paiement);
      return datePaiement >= new Date(date_debut) && datePaiement <= new Date(date_fin);
    });

    const total = paiementsPeriode.reduce((acc, p) => acc + p.montant_paye, 0);

    return {
      success: true,
      data: {
        total,
        count: paiementsPeriode.length,
        paiements: paiementsPeriode
      }
    };
  },
};

export default paiementService;