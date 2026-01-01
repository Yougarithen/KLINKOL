// ============================================================
// SERVICE PRODUCTION - VERSION CORRIGÉE
// ============================================================

// services/productionService.js
import { apiRequest } from './apiConfig';

/**
 * Service pour gérer la production
 * Toutes les fonctions retournent une Promise avec { success: boolean, data: any }
 */
const productionService = {
  
  /**
   * Récupérer toutes les productions
   * @returns Promise<{ success: true, data: Production[] }>
   */
  getAll: async () => {
    return await apiRequest('/production');
  },

  /**
   * Récupérer une production par ID
   * @param {number} id - ID de la production
   * @returns Promise<{ success: true, data: Production }>
   */
  getById: async (id) => {
    return await apiRequest(`/production/${id}`);
  },

  /**
   * Récupérer les productions d'un produit spécifique
   * @param {number} id_produit - ID du produit
   * @returns Promise<{ success: true, data: Production[] }>
   */
  getByProduit: async (id_produit) => {
    return await apiRequest(`/production/produit/${id_produit}`);
  },

  /**
   * Créer une entrée de production simple (sans logique)
   * @param {Object} productionData
   * @param {number} productionData.id_produit - ID du produit
   * @param {number} productionData.quantite_produite - Quantité produite
   * @param {string} productionData.operateur - Nom de l'opérateur
   * @param {string} productionData.date_production - Date (ISO format)
   * @param {string} productionData.commentaire - Commentaire
   * @returns Promise<{ success: true, data: Production }>
   */
  create: async (productionData) => {
    return await apiRequest('/production', {
      method: 'POST',
      body: JSON.stringify(productionData),
    });
  },

  /**
   * Produire un produit (avec logique complète)
   * Cette fonction :
   * - Vérifie la disponibilité des matières premières
   * - Déduit automatiquement les matières du stock
   * - Ajoute le produit fini au stock
   * - Enregistre la production
   * 
   * @param {number} id_produit - ID du produit à produire
   * @param {number} quantite_produite - Quantité à produire
   * @param {string} operateur - Nom de l'opérateur
   * @param {string} commentaire - Commentaire optionnel
   * @returns Promise<{ success: true, data: Production, message: string }>
   */
  produire: async (id_produit, quantite_produite, operateur, commentaire = null) => {
    return await apiRequest('/production/produire', {
      method: 'POST',
      body: JSON.stringify({
        id_produit,
        quantite_produite,
        operateur,
        commentaire,
      }),
    });
  },

  /**
   * NOUVELLE MÉTHODE : Vérifier le stock avant production
   * @param {number} id_produit - ID du produit à produire
   * @param {number} quantite - Quantité à produire
   * @returns Promise<{ success: true, data: VerificationStock }>
   * Exemple de data: {
   *   possible: true,
   *   matieres_ok: [{matiere: "Farine", necessaire: 45, disponible: 100, unite: "kg"}],
   *   matieres_manquantes: []
   * }
   */
  verifierStock: async (id_produit, quantite) => {
    return await apiRequest(`/production/verifier-stock/${id_produit}?quantite=${quantite}`);
  },

  /**
   * Supprimer une production
   * @param {number} id - ID de la production
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/production/${id}`, {
      method: 'DELETE',
    });
  },
};

export default productionService;