// services/matierePremiereService.js
import { apiRequest } from './apiConfig';

/**
 * Service pour gérer les matières premières
 */
const matierePremiereService = {
  
  /**
   * Récupérer toutes les matières premières
   * @returns Promise<{ success: true, data: MatierePremiere[] }>
   */
  getAll: async () => {
    return await apiRequest('/matieres');
  },

  /**
   * Récupérer une matière par ID
   * @param {number} id - ID de la matière
   * @returns Promise<{ success: true, data: MatierePremiere }>
   */
  getById: async (id) => {
    return await apiRequest(`/matieres/${id}`);
  },

  /**
   * Récupérer les matières par type
   * @param {string} type - Type de matière (ex: EMBALLAGE, CHIMIQUE, MINERALE)
   * @returns Promise<{ success: true, data: MatierePremiere[] }>
   */
  getByType: async (type) => {
    return await apiRequest(`/matieres/type/${type}`);
  },

  /**
   * Récupérer les statistiques par type
   * @returns Promise<{ success: true, data: StatsType[] }>
   */
  getStatsByType: async () => {
    return await apiRequest('/matieres/stats/by-type');
  },

  /**
   * Créer une nouvelle matière première
   * @param {Object} matiereData
   * @param {string} matiereData.nom - Nom de la matière (REQUIS)
   * @param {string} matiereData.typeM - Type de matière (REQUIS)
   * @param {string} matiereData.unite - Unité (REQUIS)
   * @param {number} matiereData.stock_actuel - Stock actuel
   * @param {number} matiereData.stock_minimum - Stock minimum
   * @param {number} matiereData.prix_unitaire - Prix unitaire
   * @returns Promise<{ success: true, data: MatierePremiere }>
   */
  create: async (matiereData) => {
    return await apiRequest('/matieres', {
      method: 'POST',
      body: JSON.stringify(matiereData),
    });
  },

  /**
   * Mettre à jour une matière première
   * @param {number} id - ID de la matière
   * @param {Object} matiereData - Nouvelles données
   * @returns Promise<{ success: true, data: MatierePremiere }>
   */
  update: async (id, matiereData) => {
    return await apiRequest(`/matieres/${id}`, {
      method: 'PUT',
      body: JSON.stringify(matiereData),
    });
  },

  /**
   * Supprimer une matière première
   * @param {number} id - ID de la matière
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/matieres/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Récupérer les alertes de stock
   * @returns Promise<{ success: true, data: AlerteStock[] }>
   */
  getAlertes: async () => {
    return await apiRequest('/matieres/alertes');
  },

  /**
   * Ajuster le stock d'une matière première
   * @param {number} id - ID de la matière
   * @param {number} quantite - Quantité (+ pour ajout, - pour retrait)
   * @param {string} responsable - Nom du responsable
   * @param {string} motif - Motif de l'ajustement
   * @returns Promise<{ success: true, data: MatierePremiere }>
   */
  ajusterStock: async (id, quantite, responsable, motif) => {
    return await apiRequest(`/matieres/${id}/ajuster`, {
      method: 'POST',
      body: JSON.stringify({ quantite, responsable, motif }),
    });
  },
};

export default matierePremiereService;