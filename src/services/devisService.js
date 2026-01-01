// ============================================================
// SERVICE DEVIS
// ============================================================

// services/devisService.js
import { apiRequest } from './apiConfig';

/**
 * Service pour gérer les devis
 * Un devis peut être converti en facture une fois accepté
 */
const devisService = {
  
  /**
   * Récupérer tous les devis avec leurs totaux calculés
   * @returns Promise<{ success: true, data: Devis[] }>
   * Exemple de data: [
   *   {
   *     id_devis: 1,
   *     numero_devis: "DEV-001",
   *     id_client: 1,
   *     client: "Entreprise ABC",
   *     date_devis: "2025-12-23",
   *     date_validite: "2025-02-28",
   *     statut: "Brouillon", // Brouillon, Envoyé, Accepté, Refusé, Expiré
   *     montant_ht: 10000.00,
   *     montant_tva: 1900.00,
   *     montant_ttc: 11900.00,
   *     remise_globale: 0,
   *     conditions_paiement: "30 jours",
   *     notes: "Devis pour livraison mensuelle"
   *   }
   * ]
   */
  getAll: async () => {
    return await apiRequest('/devis');
  },

  /**
   * Récupérer un devis par ID avec ses lignes
   * @param {number} id - ID du devis
   * @returns Promise<{ success: true, data: DevisComplet }>
   * Exemple de data: {
   *   id_devis: 1,
   *   numero_devis: "DEV-001",
   *   client: "Entreprise ABC",
   *   montant_ht: 10000,
   *   montant_tva: 1900,
   *   montant_ttc: 11900,
   *   lignes: [
   *     {
   *       id_ligne: 1,
   *       id_produit: 1,
   *       produit_nom: "Pain complet",
   *       quantite: 100,
   *       prix_unitaire_ht: 100,
   *       taux_tva: 19,
   *       montant_ht: 10000,
   *       montant_tva: 1900,
   *       montant_ttc: 11900
   *     }
   *   ]
   * }
   */
  getById: async (id) => {
    return await apiRequest(`/devis/${id}`);
  },

  /**
   * Créer un nouveau devis
   * @param {Object} devisData
   * @param {number} devisData.id_client - ID du client (REQUIS)
   * @param {string} devisData.date_devis - Date du devis
   * @param {string} devisData.date_validite - Date de validité
   * @param {string} devisData.statut - Statut (Brouillon par défaut)
   * @param {number} devisData.remise_globale - Remise en % (0-100)
   * @param {string} devisData.conditions_paiement - Conditions de paiement
   * @param {string} devisData.notes - Notes
   * @returns Promise<{ success: true, data: Devis }>
   * 
   * Le numéro de devis est généré automatiquement (DEV-001, DEV-002...)
   */
  create: async (devisData) => {
    return await apiRequest('/devis', {
      method: 'POST',
      body: JSON.stringify(devisData),
    });
  },

  /**
   * Mettre à jour un devis
   * @param {number} id - ID du devis
   * @param {Object} devisData - Nouvelles données
   * @returns Promise<{ success: true, data: Devis }>
   */
  update: async (id, devisData) => {
    return await apiRequest(`/devis/${id}`, {
      method: 'PUT',
      body: JSON.stringify(devisData),
    });
  },

  /**
   * Supprimer un devis
   * @param {number} id - ID du devis
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/devis/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Ajouter une ligne au devis
   * @param {number} id_devis - ID du devis
   * @param {Object} ligneData
   * @param {number} ligneData.id_produit - ID du produit
   * @param {number} ligneData.quantite - Quantité
   * @param {string} ligneData.unite_vente - Unité de vente
   * @param {number} ligneData.prix_unitaire_ht - Prix HT
   * @param {number} ligneData.taux_tva - Taux TVA
   * @param {number} ligneData.remise_ligne - Remise ligne (0-100)
   * @param {string} ligneData.description - Description
   * @returns Promise<{ success: true, data: Devis }>
   */
  ajouterLigne: async (id_devis, ligneData) => {
    return await apiRequest(`/devis/${id_devis}/lignes`, {
      method: 'POST',
      body: JSON.stringify(ligneData),
    });
  },

  /**
   * Supprimer une ligne du devis
   * @param {number} id_ligne - ID de la ligne
   * @returns Promise<{ success: true, message: string }>
   */
  supprimerLigne: async (id_ligne) => {
    return await apiRequest(`/lignes-devis/${id_ligne}`, {
      method: 'DELETE',
    });
  },

  /**
   * Convertir un devis accepté en facture
   * Le devis doit être au statut "Accepté"
   * Crée automatiquement une facture avec toutes les lignes
   * 
   * @param {number} id_devis - ID du devis à convertir
   * @returns Promise<{ success: true, data: Facture }>
   * 
   * Exemple:
   * const facture = await devisService.convertirEnFacture(1);
   * // facture = { id_facture: 5, numero_facture: "FAC-005", ... }
   */
  convertirEnFacture: async (id_devis) => {
    return await apiRequest(`/devis/${id_devis}/convertir`, {
      method: 'POST',
    });
  },

  /**
   * Changer le statut d'un devis
   * @param {number} id - ID du devis
   * @param {string} statut - Nouveau statut (Brouillon, Envoyé, Accepté, Refusé, Expiré)
   * @returns Promise<{ success: true, data: Devis }>
   */
  changerStatut: async (id, statut) => {
    const devis = await devisService.getById(id);
    return await devisService.update(id, {
      ...devis.data,
      statut: statut
    });
  },
};

export default devisService;
