// src/pages/Login.jsx
import { useState } from "react";
import { apiRequest } from "@/services/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import Logo from "@/components/Logo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Message de session expirée depuis la navigation
  const sessionMessage = location.state?.message;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifiant: email, mot_de_passe: password }),
      });

      // Sauvegarde du token et des infos utilisateur
      localStorage.setItem("erp_auth_token", response.data.token);
      localStorage.setItem("erp_user_data", JSON.stringify(response.data.user));
      localStorage.setItem("erp_session_expires", response.data.expiresAt);

      // Redirection vers le dashboard
      navigate("/clients");
    } catch (err) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #E53935 0%, #C62828 50%, #B71C1C 100%)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        width: '100%',
        maxWidth: '440px',
        animation: 'slideIn 0.3s ease-out'
      }}>
        {/* Header avec logo */}
        <div style={{
          background: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <Logo size="large" color="white" />
          <p style={{
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.95rem',
            margin: '1rem 0 0 0'
          }}>
            Système de Gestion ERP
          </p>
        </div>

        {/* Corps du formulaire */}
        <div style={{ padding: '2.5rem 2rem' }}>
          {/* Message de session expirée */}
          {sessionMessage && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <span style={{ fontSize: '1.25rem' }}>⏱️</span>
              <span style={{ 
                color: '#991B1B',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {sessionMessage}
              </span>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #F87171',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'shake 0.3s ease-out'
            }}>
              <span style={{ fontSize: '1.25rem' }}>❌</span>
              <span style={{ 
                color: '#991B1B',
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {error}
              </span>
            </div>
          )}

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1F2937',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Connexion
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Champ Email */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Email ou nom d'utilisateur
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Entrez votre email"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#E53935'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Champ Mot de passe */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Entrez votre mot de passe"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#E53935'}
                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
              />
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                backgroundColor: loading ? '#9CA3AF' : '#E53935',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(229, 57, 53, 0.3)',
                transform: loading ? 'none' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#C62828';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(229, 57, 53, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#E53935';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.3)';
                }
              }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Connexion...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div style={{
          backgroundColor: '#F9FAFB',
          padding: '1.5rem 2rem',
          textAlign: 'center',
          borderTop: '1px solid #E5E7EB'
        }}>
          <p style={{
            fontSize: '0.75rem',
            color: '#6B7280',
            margin: 0
          }}>
            © {new Date().getFullYear()} KLINKOL. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Styles d'animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        input:focus {
          box-shadow: 0 0 0 3px rgba(229, 57, 53, 0.1);
        }
      `}</style>
    </div>
  );
}