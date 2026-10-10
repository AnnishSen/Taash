import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';
import { Trophy, RotateCcw, Flame, Play, Skull, Laugh, Sparkles } from 'lucide-react';

interface GameOverModalProps {
  winnerTeam: 'A' | 'B' | 'draw';
  teamAMindis: number;
  teamBMindis: number;
  teamATricks: number;
  teamBTricks: number;
  isCoat?: boolean;
  coatTeam?: 'A' | 'B' | null;
  isTariya?: boolean;
  tariyaTeam?: 'A' | 'B' | null;
  tariyaVictimTeam?: 'A' | 'B' | null;
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
  isCoat: propIsCoat,
  coatTeam: propCoatTeam,
  isTariya: propIsTariya,
  tariyaTeam: propTariyaTeam,
  roundNumber,
  mySeat,
  onReturnToLobby,
  onNextRound,
}) => {
  const isMyTeamWinner =
    mySeat !== null &&
    ((winnerTeam === 'A' && (mySeat === 1 || mySeat === 3)) ||
      (winnerTeam === 'B' && (mySeat === 2 || mySeat === 4)));

  const myTeam = mySeat === 1 || mySeat === 3 ? 'A' : mySeat === 2 || mySeat === 4 ? 'B' : null;

  // Coat condition: Any team takes all 4 tens (Mindis)
  const isCoat = propIsCoat || teamAMindis === 4 || teamBMindis === 4;
  const coatTeam = propCoatTeam || (teamAMindis === 4 ? 'A' : teamBMindis === 4 ? 'B' : null);
  const isMyTeamCoat = myTeam !== null && coatTeam === myTeam;

  // Tariya condition: Any team wins all 13 hands / tricks (13-0 whitewash)
  const isTariya = propIsTariya || teamATricks === 13 || teamBTricks === 13;
  const tariyaTeam = propTariyaTeam || (teamATricks === 13 ? 'A' : teamBTricks === 13 ? 'B' : null);
  const isMyTeamTariyaWinner = myTeam !== null && tariyaTeam === myTeam;
  const isMyTeamTariyaVictim = myTeam !== null && tariyaTeam !== null && tariyaTeam !== myTeam;

  useEffect(() => {
    if (isTariya) {
      sound.playTariya();
    } else if (isCoat) {
      sound.playCoat();
    } else {
      sound.playVictory();
    }

    try {
      confetti({
        particleCount: isTariya ? 220 : isCoat ? 180 : 120,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#fbbf24', '#ffffff', '#a855f7'],
      });
    } catch {}
  }, [isCoat, isTariya]);

  return (
    <div className="modal-overlay">
      <div className="modal-content game-over-modal-box" style={{ maxWidth: '640px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {roundNumber && roundNumber > 1 && (
          <div
            style={{
              display: 'inline-block',
              padding: '4px 14px',
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

        {/* ========================================================
            LEGENDARY COMBO: BOTH COAT + TARIYA (4 10s + 13 HANDS)
        ======================================================== */}
        {isCoat && isTariya && (
          <div className="epic-combo-banner">
            <div className="epic-combo-badge">
              <Flame size={18} />
              <span>👑 MAHA COAT + TARIYA COMBO! 👑</span>
              <Skull size={18} />
            </div>
            <p className="epic-combo-sub">
              4 Dehle bhi capture kar liye aur 13 ke 13 haath bhi! Pure match ka historic whitewash!
            </p>
          </div>
        )}

        {/* ========================================================
            BIG MESSAGE OF COAT (4 TENS / DEHLE)
        ======================================================== */}
        {isCoat && !isTariya && (
          <div className="coat-celebration-card">
            <div className="coat-header-badge">
              <Flame size={20} className="flame-flicker" />
              <span>🔥 COAT! MINDI COAT! 🔥</span>
              <Sparkles size={18} />
            </div>
            <h3 className="coat-title-text">
              {isMyTeamCoat ? "AAPKI TEAM NE KIYA COAT! 🔥" : `TEAM ${coatTeam} NE KIYA COAT!`}
            </h3>
            <p className="coat-subtitle-text">
              Charon ke Charon 10s (Dehle) ek hi team ke paas! Absolute Mastery of Mindis!
            </p>
          </div>
        )}

        {/* ========================================================
            FUNNY & TAUNTING MESSAGE OF TARIYA (13 HANDS CLEAN SWEEP)
        ======================================================== */}
        {isTariya && (
          <div className={`tariya-taunt-container ${isMyTeamTariyaWinner ? 'is-winner-taunt' : isMyTeamTariyaVictim ? 'is-victim-taunt' : 'is-neutral-taunt'}`}>
            <div className="tariya-headline-badge">
              <Skull size={22} className="skull-shake" />
              <span>💀 13 - 0 TARIYA HO GAYA! 💀</span>
              <Laugh size={22} />
            </div>

            <div className="tariya-taunt-speech-bubble">
              {isMyTeamTariyaWinner ? (
                <>
                  <div className="tariya-roast-quote">
                    "Bhai tum log taash khelne aaye the ya sirf baith ke card dekhne? Ek bhi haath nahi mila! 😂"
                  </div>
                  <div className="tariya-roast-sub">
                    13-0 ka sukha Tariya! Samne wali team ka khata bhi nahi khula! Chappal utaar ke taliyaan bajao! 👏💀
                  </div>
                </>
              ) : isMyTeamTariyaVictim ? (
                <>
                  <div className="tariya-roast-quote">
                    "Oof! Ek bhi trick nahi lagi? 13-0 ka Tariya lag gaya! 😭"
                  </div>
                  <div className="tariya-roast-sub">
                    Pure game mein Zero hands! Koyi baat nahi, haar ke jeetne wale ko baazigar kehte hain... Agle round mein badla lo! 🦾🔥
                  </div>
                </>
              ) : (
                <>
                  <div className="tariya-roast-quote">
                    `"Team ${tariyaTeam} ne kar diya 13-0 ka pura Tariya Safaya!"`
                  </div>
                  <div className="tariya-roast-sub">
                    Zero tricks to the opponents! A brutal 13-trick masterclass! 🪦🤣
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Trophy Icon */}
        <div
          style={{
            display: 'inline-flex',
            padding: '18px',
            borderRadius: '50%',
            background:
              winnerTeam === 'draw'
                ? 'rgba(148, 163, 184, 0.2)'
                : isMyTeamWinner
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(5, 150, 105, 0.18))'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.35), rgba(217, 119, 6, 0.18))',
            color: isMyTeamWinner ? '#10b981' : '#f59e0b',
            marginBottom: '14px',
            boxShadow: isMyTeamWinner
              ? '0 0 40px rgba(16, 185, 129, 0.4)'
              : '0 0 35px rgba(245, 158, 11, 0.35)',
          }}
        >
          <Trophy size={50} />
        </div>

        <h1 style={{ fontSize: '30px', fontWeight: 900, marginBottom: '6px', letterSpacing: '-0.5px' }}>
          {winnerTeam === 'draw'
            ? 'Match Drawn!'
            : isMyTeamWinner
            ? '🎉 VICTORY! Your Team Won!'
            : `Team ${winnerTeam} Won the Round!`}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '22px' }}>
          {winnerTeam === 'draw'
            ? 'A dead heat! Both teams secured equal dehle and tricks.'
            : isMyTeamWinner
            ? isCoat
              ? 'Incredible performance! All 4 tens under lock and key!'
              : 'Outstanding play! Your partnership captured the key tricks.'
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
            marginBottom: '26px',
          }}
        >
          {/* Team A */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: winnerTeam === 'A' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: winnerTeam === 'A' ? '2px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-glass)',
              position: 'relative',
            }}
          >
            {teamAMindis === 4 && (
              <span className="mini-coat-badge">🔥 COAT</span>
            )}
            {teamATricks === 13 && (
              <span className="mini-tariya-badge">💀 TARIYA</span>
            )}
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#93c5fd', letterSpacing: '0.5px' }}>
              TEAM A (1 & 3)
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', margin: '6px 0 2px' }}>
              🂪 {teamAMindis} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Dehle</span>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>
              {teamATricks} / 13 Tricks Won
            </div>
          </div>

          {/* Team B */}
          <div
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: winnerTeam === 'B' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.02)',
              border: winnerTeam === 'B' ? '2px solid rgba(16, 185, 129, 0.6)' : '1px solid var(--border-glass)',
              position: 'relative',
            }}
          >
            {teamBMindis === 4 && (
              <span className="mini-coat-badge">🔥 COAT</span>
            )}
            {teamBTricks === 13 && (
              <span className="mini-tariya-badge">💀 TARIYA</span>
            )}
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#fde047', letterSpacing: '0.5px' }}>
              TEAM B (2 & 4)
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: '#f59e0b', margin: '6px 0 2px' }}>
              🂪 {teamBMindis} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>Dehle</span>
            </div>
            <div style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 700 }}>
              {teamBTricks} / 13 Tricks Won
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

