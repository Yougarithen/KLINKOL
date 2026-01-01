// src/services/apiConfig.js
// Configuration centrale de l'API avec gestion du token JWT

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.1.160:3000/api';
const TOKEN_KEY = 'erp_auth_token';

/**
 * Fonction helper pour gérer les requêtes HTTP avec authentification
 * @param {string} endpoint - Point de terminaison de l'API (ex: '/clients')
 * @param {Object} options - Options fetch
 * @returns Promise<{ success: boolean, data: any, error?: string }>
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Récupérer le token d'authentification
  const token = localStorage.getItem(TOKEN_KEY);
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }), // Ajouter le token si présent
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    // Gérer les erreurs d'authentification
    // Ne pas traiter les erreurs 401 sur la route de login comme une session expirée
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      // Token expiré ou invalide
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('erp_user_data');
      
      // Rediriger vers la page de login si pas déjà dessus
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }

    // Gérer les erreurs de permissions
    if (response.status === 403) {
      throw new Error(data.error || 'Vous n\'avez pas les permissions nécessaires.');
    }

    // Le backend retourne toujours { success: true/false, data: ..., error: ... }
    if (!data.success) {
      throw new Error(data.error || 'Une erreur est survenue');
    }

    return data; // Retourne { success: true, data: ... }
  } catch (error) {
    console.error(`Erreur API [${endpoint}]:`, error);
    throw error;
  }
}

/**
 * Fonction pour vérifier si l'utilisateur est authentifié
 * @returns {boolean}
 */
function isAuthenticated() {
  return !!localStorage.getItem(TOKEN_KEY);
}

/**
 * Fonction pour obtenir le token actuel
 * @returns {string|null}
 */
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export { API_BASE_URL, apiRequest, isAuthenticated, getToken };