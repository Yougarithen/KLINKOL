// ============================================================
// SERVICE PRODUIT COMPLET
// ============================================================

// services/produitService.js
import { apiRequest } from './apiConfig';

/**
 * Service pour gérer les produits
 * Toutes les fonctions retournent une Promise avec { success: boolean, data: any }
 */
const produitService = {
  
  /**
   * Récupérer tous les produits
   * @returns Promise<{ success: true, data: Produit[] }>
   * Exemple de data: [
   *   {
   *     id_produit: 1,
   *     code_produit: "PAIN-001",
   *     nom: "Pain complet",
   *     description: "Pain complet artisanal",
   *     unite: "unité",
   *     poids: 0.5,
   *     unite_poids: "kg",
   *     stock_actuel: 100.00,
   *     prix_vente_suggere: 50.00,
   *     taux_tva: 19.00,
   *     soumis_taxe: 1,
   *     date_creation: "2025-12-23T10:30:00"
   *   }
   * ]
   */
  getAll: async () => {
    return await apiRequest('/produits');
  },

  /**
   * Récupérer un produit par ID
   * @param {number} id - ID du produit
   * @returns Promise<{ success: true, data: Produit }>
   */
  getById: async (id) => {
    return await apiRequest(`/produits/${id}`);
  },

  /**
   * Créer un nouveau produit
   * @param {Object} produitData
   * @param {string} produitData.nom - Nom du produit (REQUIS)
   * @param {string} produitData.unite - Unité de vente (REQUIS) - Ex: "unité", "kg", "litre"
   * @param {string} produitData.code_produit - Code produit unique
   * @param {string} produitData.description - Description du produit
   * @param {number} produitData.poids - Poids du produit
   * @param {string} produitData.unite_poids - Unité de poids (kg, g, L, ml...)
   * @param {number} produitData.stock_actuel - Stock initial (défaut: 0)
   * @param {number} produitData.prix_vente_suggere - Prix de vente suggéré
   * @param {number} produitData.taux_tva - Taux de TVA (défaut: 19.00)
   * @param {number} produitData.soumis_taxe - Soumis à la taxe (1 ou 0, défaut: 1)
   * @returns Promise<{ success: true, data: Produit }>
   * 
   * Exemple:
   * create({
   *   nom: "Pain complet",
   *   unite: "unité",
   *   code_produit: "PAIN-001",
   *   poids: 0.5,
   *   unite_poids: "kg",
   *   prix_vente_suggere: 50,
   *   taux_tva: 19
   * })
   */
  create: async (produitData) => {
    return await apiRequest('/produits', {
      method: 'POST',
      body: JSON.stringify(produitData),
    });
  },

  /**
   * Mettre à jour un produit
   * @param {number} id - ID du produit
   * @param {Object} produitData - Nouvelles données (même structure que create)
   * @returns Promise<{ success: true, data: Produit }>
   */
  update: async (id, produitData) => {
    return await apiRequest(`/produits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(produitData),
    });
  },

  /**
   * Supprimer un produit
   * @param {number} id - ID du produit
   * @returns Promise<{ success: true, message: string }>
   */
  delete: async (id) => {
    return await apiRequest(`/produits/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Récupérer la recette de production d'un produit
   * @param {number} id - ID du produit
   * @returns Promise<{ success: true, data: RecetteIngredient[] }>
   * Exemple de data: [
   *   {
   *     id_recette: 1,
   *     id_produit: 1,
   *     id_matiere: 1,
   *     quantite_necessaire: 0.45,
   *     nom_matiere: "Farine",
   *     unite: "kg"
   *   },
   *   {
   *     id_recette: 2,
   *     id_produit: 1,
   *     id_matiere: 2,
   *     quantite_necessaire: 0.05,
   *     nom_matiere: "Sucre",
   *     unite: "kg"
   *   }
   * ]
   */
  getRecette: async (id) => {
    return await apiRequest(`/produits/${id}/recette`);
  },

  /**
   * Ajouter un ingrédient à la recette d'un produit
   * @param {number} id_produit - ID du produit
   * @param {number} id_matiere - ID de la matière première
   * @param {number} quantite - Quantité nécessaire pour 1 unité de produit
   * @returns Promise<{ success: true, data: RecetteIngredient[] }>
   * 
   * Exemple:
   * Pour 1 pain il faut 0.45 kg de farine:
   * ajouterIngredient(1, 1, 0.45)
   */
  ajouterIngredient: async (id_produit, id_matiere, quantite) => {
    return await apiRequest(`/produits/${id_produit}/recette`, {
      method: 'POST',
      body: JSON.stringify({ id_matiere, quantite }),
    });
  },
};

export default produitService;

