// src/components/Logo.jsx
/**
 * Composant Logo KLINKOL
 * Peut être utilisé dans toute l'application
 */
export default function Logo({ size = 'medium', color = 'red' }) {
  const sizes = {
    small: { fontSize: '1.5rem', iconSize: '28px' },
    medium: { fontSize: '3rem', iconSize: '48px' },
    large: { fontSize: '4rem', iconSize: '64px' }
  };

  const colors = {
    red: '#E53935',
    white: '#FFFFFF',
    dark: '#1F2937'
  };

  const currentSize = sizes[size] || sizes.medium;
  const currentColor = colors[color] || colors.red;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      justifyContent: 'center'
    }}>
      {/* Icône circulaire avec "EK" */}
      <div style={{
        width: currentSize.iconSize,
        height: currentSize.iconSize,
        borderRadius: '50%',
        border: `4px solid ${currentColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: `calc(${currentSize.iconSize} * 0.4)`,
        color: currentColor,
        fontFamily: 'Arial, sans-serif'
      }}>
        EK
      </div>

      {/* Texte KLINKOL */}
      <div style={{
        fontSize: currentSize.fontSize,
        fontWeight: 'bold',
        color: currentColor,
        fontFamily: 'Arial, sans-serif',
        letterSpacing: '2px'
      }}>
        KLINKOL
      </div>
    </div>
  );
}
