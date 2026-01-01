// services/clientService.js
import { apiRequest } from './apiConfig';

/**
 * Service pour gérer les clients
 * Toutes les fonctions retournent une Promise avec { success: boolean, data: any }
 */
const clientService = {
  
  /**
   * Récupérer tous les clients
   * @returns Promise<{ success: true, data: Client[] }>
   */
  getAll: async () => {
    return await apiRequest('/clients');
  },

  /**
   * Récupérer un client par ID
   * @param {number} id - ID du client
   * @returns Promise<{ success: true, data: Client }>
   */
  getById: async (id) => {
    return await apiRequest(`/clients/${id}`);
  },

  /**
   * Créer un nouveau client
   * @param {Object} clientData - Données du client
   * @returns Promise<{ success: true, data: Client }>
   */
  create: async (clientData) => {
    return await apiRequest('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  },

  /**
   * Mettre à jour un client
   * @param {number} id - ID du client
   * @param {Object} clientData - Nouvelles données
   * @returns Promise<{ success: true, data: Client }>
   */
  update: async (id, clientData) => {
    // Toujours retirer le CLI- si présent
    const numericId = id.toString().replace(/^CLI-/, "");

    return await apiRequest(`/clients/${numericId}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    });
  },

  /**
   * Supprimer un client
   * @param {number} id - ID du client
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/clients/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Récupérer les crédits d'un client
   * @param {number} id - ID du client
   * @returns Promise<{ success: true, data: CreditClient }>
   */
  getCredits: async (id) => {
    return await apiRequest(`/clients/${id}/credits`);
  },

  /**
   * Récupérer tous les types de clients distincts
   * @returns Promise<{ success: true, data: Array<{ TypeC: string }> }>
   */
  getTypes: async () => {
    return await apiRequest('/clients/types');
  },

  /**
   * Chercher un client par son nom
   * @param {string} nom - Nom du client
   * @returns Promise<{ success: true, data: Client | null }>
   */
  getByNom: async (nom) => {
    const response = await apiRequest('/clients');
    const client = response.data.find(c => 
      c.nom && c.nom.toLowerCase().trim() === nom.toLowerCase().trim()
    );
    return {
      success: true,
      data: client || null
    };
  },
};

export default clientService;