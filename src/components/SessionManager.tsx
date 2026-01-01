// src/components/SessionManager.tsx
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SessionManagerProps {
  warningMinutes?: number;
  sessionDurationMinutes?: number;
  debug?: boolean;
}

/**
 * Composant pour gérer l'expiration de session
 * IMPORTANT: Ce composant doit être placé dans App.tsx ou un Layout qui reste monté
 */
export default function SessionManager({ 
  warningMinutes = 5, 
  sessionDurationMinutes = 60,
  debug = false
}: SessionManagerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showWarning, setShowWarning] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);

  // Log de débogage
  const log = useCallback((...args: any[]) => {
    if (debug) console.log('[SessionManager]', ...args);
  }, [debug]);

  // Vérifier si on est sur la page de login
  const isLoginPage = location.pathname.includes('/login') || location.pathname === '/';

  // Réinitialiser les états quand on arrive sur la page de login
  useEffect(() => {
    if (isLoginPage) {
      log('Sur la page login, réinitialisation des états');
      setShowWarning(false);
      setShowExpiredModal(false);
      setTimeRemaining(null);
      setSessionExpiry(null);
    }
  }, [isLoginPage, log]);

  // Initialiser ou récupérer la date d'expiration
  useEffect(() => {
    // Ne pas gérer la session sur la page de login
    if (isLoginPage) {
      log('Sur la page login, pas de gestion de session');
      return;
    }

    const token = localStorage.getItem('erp_auth_token');
    if (!token) {
      log('Pas de token, pas de gestion de session');
      return;
    }

    // Essayer de récupérer l'expiration depuis localStorage
    const storedExpiry = localStorage.getItem('erp_session_expires');
    
    if (storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      log('Session expiry récupérée:', expiryDate);
      setSessionExpiry(expiryDate);
    } else {
      // Si pas d'expiration stockée, en créer une nouvelle
      const loginTime = new Date();
      const expiryDate = new Date(loginTime.getTime() + sessionDurationMinutes * 60 * 1000);
      log('Nouvelle session expiry créée:', expiryDate);
      setSessionExpiry(expiryDate);
      localStorage.setItem('erp_session_expires', expiryDate.toISOString());
    }
  }, [sessionDurationMinutes, isLoginPage, log]);

  // Vérifier périodiquement le temps restant
  useEffect(() => {
    if (!sessionExpiry || isLoginPage) return;

    log('Timer activé, expiration:', sessionExpiry);

    const checkInterval = setInterval(() => {
      const now = new Date();
      const msRemaining = sessionExpiry.getTime() - now.getTime();
      const minutesRemaining = Math.floor(msRemaining / 1000 / 60);
      const secondsRemaining = Math.floor((msRemaining / 1000) % 60);

      log(`Temps restant: ${minutesRemaining}min ${secondsRemaining}s`);
      setTimeRemaining(minutesRemaining);

      // Afficher l'avertissement si moins de X minutes
      if (minutesRemaining <= warningMinutes && minutesRemaining > 0 && !showWarning) {
        log('🟡 AFFICHAGE AVERTISSEMENT');
        setShowWarning(true);
      }

      // Session expirée
      if (msRemaining <= 0) {
        log('🔴 SESSION EXPIRÉE');
        setShowWarning(false);
        setShowExpiredModal(true);
        clearInterval(checkInterval);
      }
    }, 3000); // Vérifier toutes les 3 secondes

    return () => {
      log('Nettoyage du timer');
      clearInterval(checkInterval);
    };
  }, [sessionExpiry, warningMinutes, isLoginPage, log, showWarning]);

  const handleExpiredModalClose = useCallback(() => {
    log('Fermeture modal expiration, redirection vers login');
    localStorage.removeItem('erp_auth_token');
    localStorage.removeItem('erp_user_data');
    localStorage.removeItem('erp_session_expires');
    
    navigate('/login', { 
      state: { 
        message: 'Votre session a expiré. Veuillez vous reconnecter.' 
      },
      replace: true
    });
  }, [navigate, log]);

  const handleDismissWarning = () => {
    log('Fermeture de la notification (le compteur continue)');
    setShowWarning(false);
  };

  const handleLogout = async () => {
    log('Déconnexion manuelle');
    try {
      // Appel API logout si besoin
      const response = await fetch('http://192.168.1.160:3000/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('erp_auth_token')}`
        }
      });
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    } finally {
      localStorage.removeItem('erp_auth_token');
      localStorage.removeItem('erp_user_data');
      localStorage.removeItem('erp_session_expires');
      navigate('/login', { replace: true });
    }
  };

  // Ne rien afficher sur la page de login
  if (isLoginPage) return null;

  // Modal de session expirée
  if (showExpiredModal) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            maxWidth: '420px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            animation: 'scaleIn 0.3s ease-out'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                backgroundColor: 'white',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                animation: 'bounceIn 0.5s ease-out'
              }}>
                🔒
              </div>
              <h2 style={{ 
                margin: 0,
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: '700'
              }}>
                Session expirée
              </h2>
            </div>

            <div style={{ padding: '2rem' }}>
              <p style={{
                color: '#4B5563',
                fontSize: '1rem',
                lineHeight: '1.6',
                textAlign: 'center',
                marginBottom: '1.5rem'
              }}>
                Votre session a expiré pour des raisons de sécurité. 
                Veuillez vous reconnecter pour continuer.
              </p>

              <div style={{
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <p style={{
                  color: '#92400E',
                  fontSize: '0.875rem',
                  margin: 0,
                  lineHeight: '1.5'
                }}>
                  💡 <strong>Conseil :</strong> Pour éviter les déconnexions, 
                  restez actif et surveillez la notification d'avertissement.
                </p>
              </div>

              <button
                onClick={handleExpiredModalClose}
                style={{
                  width: '100%',
                  padding: '0.875rem 1.5rem',
                  backgroundColor: '#E53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(229, 57, 53, 0.3)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C62828';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(229, 57, 53, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E53935';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(229, 57, 53, 0.3)';
                }}
              >
                Se reconnecter
              </button>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { opacity: 0; transform: scale(0.9); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes bounceIn {
            0% { opacity: 0; transform: scale(0.3); }
            50% { transform: scale(1.05); }
            100% { opacity: 1; transform: scale(1); }
          }
        `}</style>
      </>
    );
  }

  // Notification compacte d'avertissement
  if (!showWarning) return null;

  return (
    <>
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        animation: 'slideInRight 0.3s ease-out'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          minWidth: '320px',
          maxWidth: '380px',
          border: '2px solid #F59E0B'
        }}>
          {/* Header avec couleur */}
          <div style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⏰</span>
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                margin: 0,
                color: 'white',
                fontSize: '0.95rem',
                fontWeight: '600'
              }}>
                Session bientôt expirée
              </h3>
            </div>
            <button
              onClick={handleDismissWarning}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              ×
            </button>
          </div>

          {/* Contenu */}
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: (timeRemaining ?? 0) <= 2 ? '#DC2626' : '#F59E0B',
                fontFamily: 'monospace',
                minWidth: '60px'
              }}>
                {timeRemaining} min
              </div>
              <p style={{ 
                color: '#6B7280', 
                fontSize: '0.875rem', 
                margin: 0,
                lineHeight: '1.4'
              }}>
                Votre session expirera dans <strong>{timeRemaining} minute{(timeRemaining ?? 0) > 1 ? 's' : ''}</strong>
              </p>
            </div>

            <div style={{
              backgroundColor: '#FEF3C7',
              border: '1px solid #FCD34D',
              borderRadius: '6px',
              padding: '0.625rem',
              fontSize: '0.8rem',
              color: '#92400E',
              lineHeight: '1.4'
            }}>
              💡 Cette notification est informative. Sauvegardez votre travail.
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '0.75rem'
            }}>
              <button
                onClick={handleDismissWarning}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: '#E53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#C62828';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E53935';
                }}
              >
                J'ai compris
              </button>

              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: '#6B7280',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9CA3AF';
                  e.currentTarget.style.color = '#374151';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                  e.currentTarget.style.color = '#6B7280';
                }}
              >
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { 
            opacity: 0; 
            transform: translateX(100px);
          }
          to { 
            opacity: 1; 
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}