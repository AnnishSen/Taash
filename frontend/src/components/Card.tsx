import React from 'react';

export type Suit = 'S' | 'H' | 'D' | 'C';

interface CardProps {
  card?: string; // e.g. "10H", "AS", "KD" or undefined for face-down
  isFaceDown?: boolean;
  isPlayable?: boolean;
  isInvalid?: boolean;
  isSelected?: boolean;
  isTrump?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  rotation?: number; // degrees for hand fan
  elevation?: number; // translateY px
}

// Crisp Vector SVG Suits
export const SuitIcon: React.FC<{ suit: string; size?: number; className?: string }> = ({
  suit,
  size = 18,
  className = '',
}) => {
  switch (suit) {
    case 'S': // Spades
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2C11 5 6 9 6 13.5C6 16.5 8.5 18.5 11 18.5C11.5 18.5 12 18.3 12 18.3V21H10C9.4 21 9 21.4 9 22C9 22.6 9.4 23 10 23H14C14.6 23 15 22.6 15 22C15 21.4 14.6 21 14 21H12V18.3C12 18.3 12.5 18.5 13 18.5C15.5 18.5 18 16.5 18 13.5C18 9 13 5 12 2Z" />
        </svg>
      );
    case 'H': // Hearts
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z" />
        </svg>
      );
    case 'D': // Diamonds
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2L3.5 12L12 22L20.5 12L12 2Z" />
        </svg>
      );
    case 'C': // Clubs
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
          <path d="M12 2C9.8 2 8 3.8 8 6C8 6.8 8.2 7.5 8.7 8.1C6.6 8.5 5 10.3 5 12.5C5 15 7 17 9.5 17C10.5 17 11.4 16.6 12 16V21H10C9.4 21 9 21.4 9 22C9 22.6 9.4 23 10 23H14C14.6 23 15 22.6 15 22C15 21.4 14.6 21 14 21H12V16C12.6 16.6 13.5 17 14.5 17C17 17 19 15 19 12.5C19 10.3 17.4 8.5 15.3 8.1C15.8 7.5 16 6.8 16 6C16 3.8 14.2 2 12 2Z" />
        </svg>
      );
    default:
      return null;
  }
};

export const SUIT_NAMES: Record<string, string> = {
  S: 'Hukum',
  H: 'Pan',
  D: 'It',
  C: 'Chiri',
};

export const Card: React.FC<CardProps> = ({
  card,
  isFaceDown = false,
  isPlayable = false,
  isInvalid = false,
  isSelected = false,
  isTrump = false,
  onClick,
  className = '',
  size = 'md',
  rotation = 0,
  elevation = 0,
}) => {
  const dynamicStyle: React.CSSProperties = {
    transform: `translateY(${elevation}px) rotate(${rotation}deg)`,
  };

  if (isFaceDown || !card) {
    return (
      <div
        className={`card-item card-back size-${size} ${className}`}
        style={dynamicStyle}
        onClick={onClick}
        title="Hidden Card"
      >
        <div className="card-pattern">
          <div className="card-inner-crest">
            <svg width={size === 'sm' ? 20 : size === 'lg' ? 36 : 28} height={size === 'sm' ? 20 : size === 'lg' ? 36 : 28} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C11 5 6 9 6 13.5C6 16.5 8.5 18.5 11 18.5C11.5 18.5 12 18.3 12 18.3V21H10C9.4 21 9 21.4 9 22C9 22.6 9.4 23 10 23H14C14.6 23 15 22.6 15 22C15 21.4 14.6 21 14 21H12V18.3C12 18.3 12.5 18.5 13 18.5C15.5 18.5 18 16.5 18 13.5C18 9 13 5 12 2Z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const suit = card.slice(-1);
  const rank = card.slice(0, -1);
  const isRed = suit === 'H' || suit === 'D';
  const isDehla = rank === '10';

  const sizeClasses = {
    sm: 'size-sm',
    md: 'size-md',
    lg: 'size-lg',
  }[size];

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 15;
  const centerIconSize = size === 'sm' ? 24 : size === 'lg' ? 44 : 34;

  return (
    <div
      className={`card-item ${sizeClasses} ${isRed ? 'card-red' : 'card-black'} ${
        isPlayable ? 'playable' : ''
      } ${isInvalid ? 'is-invalid-chaal' : ''} ${isSelected ? 'selected' : ''} ${isTrump ? 'is-trump' : ''} ${
        isDehla ? 'is-mindi' : ''
      } ${className}`}
      style={dynamicStyle}
      onClick={onClick}
      title={`${rank} of ${SUIT_NAMES[suit] || suit}${isDehla ? ' (Dehla!)' : ''}${isInvalid ? ' (Cannot play on this Chaal)' : ''}`}
    >
      {/* Top Left Corner */}
      <div className="card-corner top-left">
        <span className="card-rank">{rank}</span>
        <SuitIcon suit={suit} size={iconSize} className="card-corner-icon" />
      </div>

      {/* Center Graphic */}
      <div className="card-center">
        {isDehla ? (
          <div className="mindi-badge">
            <div className="mindi-crown">👑</div>
            <SuitIcon suit={suit} size={centerIconSize} />
            <span className="mindi-label">DEHLA</span>
          </div>
        ) : ['J', 'Q', 'K', 'A'].includes(rank) ? (
          <div className="royal-badge">
            <span className="royal-letter">{rank}</span>
            <SuitIcon suit={suit} size={Math.round(centerIconSize * 0.75)} />
          </div>
        ) : (
          <div className="standard-center-icon">
            <SuitIcon suit={suit} size={centerIconSize} />
          </div>
        )}
      </div>

      {/* Bottom Right Corner (Inverted) */}
      <div className="card-corner bottom-right">
        <span className="card-rank">{rank}</span>
        <SuitIcon suit={suit} size={iconSize} className="card-corner-icon" />
      </div>

      {/* Subtle Trump Accent */}
      {isTrump && (
        <div className="trump-corner-accent" title="Trump (Rang) Card">
          <span className="trump-mini-gem">◆</span>
        </div>
      )}
    </div>
  );
};

