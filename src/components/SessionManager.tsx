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
    if (isLoginPage) {
      log('Sur la page login, pas de gestion de session');
      return;
    }

    const token = localStorage.getItem('erp_auth_token');
    if (!token) {
      log('Pas de token, pas de gestion de session');
      return;
    }

    const storedExpiry = localStorage.getItem('erp_session_expires');
    
    if (storedExpiry) {
      const expiryDate = new Date(storedExpiry);
      log('Session expiry récupérée:', expiryDate);
      setSessionExpiry(expiryDate);
    } else {
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

      if (minutesRemaining <= warningMinutes && minutesRemaining > 0 && !showWarning) {
        log('🟡 AFFICHAGE AVERTISSEMENT');
        setShowWarning(true);
      }

      if (msRemaining <= 0) {
        log('🔴 SESSION EXPIRÉE');
        setShowWarning(false);
        setShowExpiredModal(true);
        clearInterval(checkInterval);
      }
    }, 3000);

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
    log('Fermeture de la notification');
    setShowWarning(false);
  };

  const handleLogout = async () => {
    log('Déconnexion manuelle');
    try {
      await fetch('http://192.168.1.160:3000/api/auth/logout', {
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

  if (isLoginPage) return null;

  // Modal de session expirée - Design épuré
  if (showExpiredModal) {
    return (
      <>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.2s ease-out'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Header minimaliste */}
            <div style={{
              padding: '2rem 2rem 1rem 2rem',
              textAlign: 'center',
              borderBottom: '1px solid #F3F4F6'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                backgroundColor: '#FEF2F2',
                borderRadius: '50%',
                margin: '0 auto 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem'
              }}>
                🔒
              </div>
              <h2 style={{ 
                margin: 0,
                color: '#111827',
                fontSize: '1.25rem',
                fontWeight: '600'
              }}>
                Session expirée
              </h2>
            </div>

            {/* Contenu */}
            <div style={{ padding: '1.5rem 2rem 2rem 2rem' }}>
              <p style={{
                color: '#6B7280',
                fontSize: '0.9375rem',
                lineHeight: '1.6',
                textAlign: 'center',
                margin: '0 0 1.5rem 0'
              }}>
                Votre session a expiré pour des raisons de sécurité. Veuillez vous reconnecter.
              </p>

              <button
                onClick={handleExpiredModalClose}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: '#E53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.9375rem',
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
          @keyframes slideUp {
            from { 
              opacity: 0; 
              transform: translateY(20px); 
            }
            to { 
              opacity: 1; 
              transform: translateY(0); 
            }
          }
        `}</style>
      </>
    );
  }

  // Notification d'avertissement - Design épuré et moderne
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
          borderRadius: '10px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
          minWidth: '340px',
          border: '1px solid #E5E7EB'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #F3F4F6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem' 
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                backgroundColor: '#FEF3C7',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.125rem'
              }}>
                ⏱️
              </div>
              <h3 style={{ 
                margin: 0,
                color: '#111827',
                fontSize: '0.9375rem',
                fontWeight: '600'
              }}>
                Session active
              </h3>
            </div>
            <button
              onClick={handleDismissWarning}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                fontSize: '1.25rem',
                padding: '0',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
                e.currentTarget.style.color = '#6B7280';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#9CA3AF';
              }}
            >
              ×
            </button>
          </div>

          {/* Contenu */}
          <div style={{ padding: '1.25rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: (timeRemaining ?? 0) <= 2 ? '#DC2626' : '#F59E0B',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                lineHeight: '1'
              }}>
                {timeRemaining}
              </div>
              <div>
                <div style={{
                  color: '#111827',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  {timeRemaining} minute{(timeRemaining ?? 0) > 1 ? 's' : ''} restante{(timeRemaining ?? 0) > 1 ? 's' : ''}
                </div>
                <div style={{
                  color: '#6B7280',
                  fontSize: '0.8125rem'
                }}>
                  Pensez à sauvegarder votre travail
                </div>
              </div>
            </div>

            {/* Barre de progression */}
            <div style={{
              height: '4px',
              backgroundColor: '#F3F4F6',
              borderRadius: '2px',
              overflow: 'hidden',
              marginBottom: '1rem'
            }}>
              <div style={{
                height: '100%',
                backgroundColor: (timeRemaining ?? 0) <= 2 ? '#DC2626' : '#F59E0B',
                width: `${((timeRemaining ?? 0) / warningMinutes) * 100}%`,
                transition: 'width 1s linear'
              }} />
            </div>

            {/* Boutons */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem'
            }}>
              <button
                onClick={handleDismissWarning}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  backgroundColor: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E5E7EB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
              >
                Compris
              </button>

              <button
                onClick={handleLogout}
                style={{
                  flex: 1,
                  padding: '0.625rem',
                  backgroundColor: '#E53935',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.8125rem',
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
            transform: translateX(100%);
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