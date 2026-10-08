import React, { useState } from 'react';
import { Card } from './Card';
import { socketService } from '../services/socket';
import { sound } from '../utils/audio';
import { Sparkles } from 'lucide-react';

interface TrumpModalProps {
  hand: string[];
  onChosen: (card: string) => void;
}

export const TrumpModal: React.FC<TrumpModalProps> = ({ hand, onChosen }) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);

  const handleSelect = (card: string) => {
    setSelectedCard(card);
    sound.playCardPlay();
  };

  const handleConfirm = () => {
    if (!selectedCard) return;
    socketService.chooseTrump(selectedCard);
    onChosen(selectedCard);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '660px', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            padding: '14px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.15))',
            color: '#f59e0b',
            marginBottom: '16px',
            boxShadow: '0 0 25px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Sparkles size={36} />
        </div>

        <h2 style={{ fontSize: '28px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
          You are the Raangi! 👑
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', maxWidth: '480px', margin: '0 auto 28px' }}>
          Select one card from your first 5 cards to establish the <strong>Bandh Rang (Hidden Trump)</strong>.
          Its suit remains a secret until revealed in battle!
        </p>

        {/* 5 Cards Selection Velvet Tray */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.1) 0%, rgba(0, 0, 0, 0.3) 100%)',
            padding: '24px 16px',
            borderRadius: '20px',
            border: '1px solid var(--border-gold)',
            boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)',
            marginBottom: '28px',
          }}
        >
          {hand.map((card) => (
            <Card
              key={card}
              card={card}
              size="md"
              isPlayable={true}
              isSelected={selectedCard === card}
              onClick={() => handleSelect(card)}
            />
          ))}
        </div>

        <button
          className="btn btn-primary btn-lg"
          disabled={!selectedCard}
          onClick={handleConfirm}
          style={{ minWidth: '260px' }}
        >
          {selectedCard ? `Confirm Rang (${selectedCard})` : 'Choose a card above'}
        </button>
      </div>
    </div>
  );
};
