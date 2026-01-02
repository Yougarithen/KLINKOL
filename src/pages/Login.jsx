// src/pages/Login.jsx
import { useState } from "react";
import { apiRequest } from "@/services/apiConfig";
import { useNavigate, useLocation } from "react-router-dom";
import KcimentImg from "@/assets/Kciment.jpg";
import LogoImg from "@/assets/Logo.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
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

      localStorage.setItem("erp_auth_token", response.data.token);
      localStorage.setItem("erp_user_data", JSON.stringify(response.data.user));
      localStorage.setItem("erp_session_expires", response.data.expiresAt);

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
      backgroundColor: '#FFFFFF'
    }}>
      {/* Partie gauche - Logo KLINKOL en grand */}
      <div style={{
        flex: '1',
        background: 'linear-gradient(135deg, #E53935 0%, #C62828 50%, #B71C1C 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        position: 'relative'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeIn 0.6s ease-out'
        }}>
          <img 
            src={LogoImg} 
            alt="KLINKOL Logo"
            style={{
              width: '100%',
              maxWidth: '400px',
              height: 'auto',
              filter: 'brightness(0) invert(1)',
              marginBottom: '2rem'
            }}
          />
          <div style={{
            color: 'white',
            fontSize: '1.5rem',
            fontWeight: '300',
            letterSpacing: '0.05em',
            opacity: '0.95'
          }}>
            Système de Gestion ERP
          </div>
        </div>
      </div>

      {/* Partie droite - Formulaire de connexion */}
      <div style={{
        flex: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#F9FAFB'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          animation: 'slideIn 0.4s ease-out'
        }}>
          {/* En-tête */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: '#1F2937',
              marginBottom: '0.5rem'
            }}>
              Bienvenue
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#6B7280',
              margin: 0
            }}>
              Connectez-vous à votre compte
            </p>
          </div>

          {/* Message de session expirée */}
          {sessionMessage && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              animation: 'slideDown 0.3s ease-out'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>⏱️</span>
              <span style={{ 
                color: '#991B1B',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {sessionMessage}
              </span>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              animation: 'shake 0.4s ease-out'
            }}>
              <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>❌</span>
              <span style={{ 
                color: '#991B1B',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {error}
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Champ Email */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Email ou nom d'utilisateur
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votreemail@exemple.com"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#F9FAFB'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#E53935';
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 57, 53, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Champ Mot de passe */}
            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  outline: 'none',
                  boxSizing: 'border-box',
                  backgroundColor: '#F9FAFB'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#E53935';
                  e.target.style.backgroundColor = '#FFFFFF';
                  e.target.style.boxShadow = '0 0 0 3px rgba(229, 57, 53, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E5E7EB';
                  e.target.style.backgroundColor = '#F9FAFB';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: loading ? '#9CA3AF' : '#E53935',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(229, 57, 53, 0.3)',
                transform: loading ? 'scale(1)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.target.style.backgroundColor = '#C62828';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(229, 57, 53, 0.4)';
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
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                  <span style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '0.875rem',
              color: '#9CA3AF',
              margin: 0
            }}>
              © {new Date().getFullYear()} KLINKOL. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Styles d'animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          body > div > div:first-child {
            display: none !important;
          }
          body > div > div:last-child {
            background: linear-gradient(135deg, #E53935 0%, #C62828 100%);
          }
          body > div > div:last-child > div {
            background: white;
            padding: 2rem;
            border-radius: 20px;
          }
        }
      `}</style>
    </div>
  );
}