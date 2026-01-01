
// ============================================================
// SERVICE RECETTE PRODUCTION (COMPLÉMENTAIRE)
// ============================================================

// services/recetteProductionService.js
import { apiRequest } from './apiConfig';

/**
 * Service pour gérer les recettes de production
 */
const recetteProductionService = {
  
  /**
   * Récupérer toutes les recettes
   * @returns Promise<{ success: true, data: Recette[] }>
   */
  getAll: async () => {
    return await apiRequest('/recettes');
  },

  /**
   * Récupérer une recette par ID
   * @param {number} id - ID de la recette
   * @returns Promise<{ success: true, data: Recette }>
   */
  getById: async (id) => {
    return await apiRequest(`/recettes/${id}`);
  },

  /**
   * Récupérer la recette complète d'un produit
   * @param {number} id_produit - ID du produit
   * @returns Promise<{ success: true, data: Recette[] }>
   * Exemple de data: [
   *   {
   *     id_recette: 1,
   *     id_produit: 1,
   *     id_matiere: 1,
   *     quantite_necessaire: 0.45,
   *     matiere_nom: "Farine",
   *     matiere_unite: "kg",
   *     prix_unitaire: 150,
   *     cout_matiere: 67.5
   *   }
   * ]
   */
  getByProduit: async (id_produit) => {
    return await apiRequest(`/recettes/produit/${id_produit}`);
  },

  /**
   * Calculer le coût de production d'un produit
   * @param {number} id_produit - ID du produit
   * @param {number} quantite - Quantité à produire (défaut: 1)
   * @returns Promise<{ success: true, data: CoutProduction }>
   * Exemple de data: {
   *   id_produit: 1,
   *   quantite_produite: 100,
   *   cout_total: 5000,
   *   cout_unitaire: 50,
   *   details: [
   *     {
   *       matiere: "Farine",
   *       quantite_necessaire: 45,
   *       unite: "kg",
   *       prix_unitaire: 150,
   *       cout: 6750
   *     }
   *   ]
   * }
   */
  calculerCout: async (id_produit, quantite = 1) => {
    return await apiRequest(`/recettes/produit/${id_produit}/cout?quantite=${quantite}`);
  },

  /**
   * Vérifier la disponibilité des matières pour produire
   * @param {number} id_produit - ID du produit
   * @param {number} quantite - Quantité à produire
   * @returns Promise<{ success: true, data: Disponibilite }>
   * Exemple de data: {
   *   disponible: false,
   *   matieres_manquantes: [
   *     {
   *       matiere: "Farine",
   *       necessaire: 45,
   *       disponible: 30,
   *       manquant: 15,
   *       unite: "kg"
   *     }
   *   ]
   * }
   */
  verifierDisponibilite: async (id_produit, quantite) => {
    return await apiRequest(`/recettes/produit/${id_produit}/disponibilite?quantite=${quantite}`);
  },

  /**
   * Créer une nouvelle recette (lien produit-matière)
   * @param {Object} recetteData
   * @param {number} recetteData.id_produit - ID du produit
   * @param {number} recetteData.id_matiere - ID de la matière
   * @param {number} recetteData.quantite_necessaire - Quantité nécessaire
   * @returns Promise<{ success: true, data: Recette }>
   */
  create: async (recetteData) => {
    return await apiRequest('/recettes', {
      method: 'POST',
      body: JSON.stringify(recetteData),
    });
  },

  /**
   * Mettre à jour une recette
   * @param {number} id - ID de la recette
   * @param {Object} recetteData - Nouvelles données
   * @returns Promise<{ success: true, data: Recette }>
   */
  update: async (id, recetteData) => {
    return await apiRequest(`/recettes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recetteData),
    });
  },

  /**
   * Supprimer une recette (ingrédient)
   * @param {number} id - ID de la recette
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/recettes/${id}`, {
      method: 'DELETE',
    });
  },
};

export default recetteProductionService;
