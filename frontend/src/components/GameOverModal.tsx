import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { Trophy, RotateCcw, Flame, Play } from 'lucide-react';

interface GameOverModalProps {
  winnerTeam: 'A' | 'B' | 'draw';
  teamAMindis: number;
  teamBMindis: number;
  teamATricks: number;
  teamBTricks: number;
  roundNumber?: number;
  mySeat: number | null;
  onReturnToLobby: () => void;
  onNextRound: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winnerTeam,
  teamAMindis,
  teamBMindis,
  teamATricks,
  teamBTricks,
  roundNumber,
  mySeat,
  onReturnToLobby,
  onNextRound,
}) => {
  const isMyTeamWinner =
    mySeat !== null &&
    ((winnerTeam === 'A' && (mySeat === 1 || mySeat === 3)) ||
      (winnerTeam === 'B' && (mySeat === 2 || mySeat === 4)));

  const isKot =
    (winnerTeam === 'A' && (teamATricks === 13 || teamAMindis === 4)) ||
    (winnerTeam === 'B' && (teamBTricks === 13 || teamBMindis === 4));

  useEffect(() => {
    sound.playVictory();

    try {
      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#fbbf24', '#ffffff'],
      });
    } catch (e) {
      // Confetti fallback
    }
  }, []);

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'center' }}>
        {roundNumber && roundNumber > 1 && (
          <div
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '1px',
              marginBottom: '12px',
            }}
          >
            ROUND {roundNumber} FINISHED
          </div>
        )}

        <div
          style={{
            display: 'inline-flex',
            padding: '18px',
            borderRadius: '50%',
            background:
              winnerTeam === 'draw'
                ? 'rgba(148, 163, 184, 0.2)'
                : isMyTeamWinner
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.15))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(217, 119, 6, 0.15))',
            color: isMyTeamWinner ? '#10b981' : '#f59e0b',
            marginBottom: '16px',
            boxShadow: '0 0 35px rgba(245, 158, 11, 0.3)',
          }}
        >
          <Trophy size={54} />
        </div>

        {isKot && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 900,
              letterSpacing: '1px',
              marginBottom: '10px',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)',
            }}
          >
            <Flame size={14} /> DEHLA KOT (WHITEWASH)!
          </div>
        )}

        <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.5px' }}>
          {winnerTeam === 'draw'
            ? 'Match Drawn!'
            : isMyTeamWinner
            ? '🎉 VICTORY! Your Team Won!'
            : `Team ${winnerTeam} Won the Round!`}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '24px' }}>
          {winnerTeam === 'draw'
            ? 'A dead heat! Both teams secured equal dehle and tricks.'
            : isMyTeamWinner
            ? 'Outstanding play! Your partnership captured the dehle and dominated the table.'
            : 'Hard fought battle! Better luck on the next round.'}
        </p>

        {/* Breakdown Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.04)',
            padding: '20px',
            borderRadius: '20px',
            border: '1px solid var(--border-glass-bright)',
            marginBottom: '28px',
          }}
        >
          {/* Team A */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: winnerTeam === 'A' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: winnerTeam === 'A' ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-glass)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#93c5fd', letterSpacing: '0.5px' }}>
              TEAM A (1 & 3)
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', margin: '6px 0 2px' }}>
              🂪 {teamAMindis} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Dehle</span>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>
              {teamATricks} Tricks Won
            </div>
          </div>

          {/* Team B */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: winnerTeam === 'B' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: winnerTeam === 'B' ? '2px solid rgba(16, 185, 129, 0.5)' : '1px solid var(--border-glass)',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fde047', letterSpacing: '0.5px' }}>
              TEAM B (2 & 4)
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', margin: '6px 0 2px' }}>
              🂪 {teamBMindis} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Dehle</span>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>
              {teamBTricks} Tricks Won
            </div>
          </div>
        </div>

        {/* Action Buttons: Return to Lobby & Next Round */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <button
            className="btn btn-secondary btn-lg"
            onClick={onReturnToLobby}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
            }}
          >
            <RotateCcw size={18} /> Return to Lobby
          </button>

          <button
            className="btn btn-primary btn-lg"
            onClick={onNextRound}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #10b981, #059669)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Play size={18} /> Next Round
          </button>
        </div>
      </div>
    </div>
  );
};
