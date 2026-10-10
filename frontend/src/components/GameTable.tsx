import React, { useState, useEffect, useRef } from 'react';
import type { GameStateView, User, RoomPlayer } from '../types';
import { Card, SuitIcon } from './Card';
import { socketService } from '../services/socket';
import { voiceService } from '../services/voice';
import type { LocalVoiceState, VoicePeerStatus } from '../services/voice';
import { VoiceWidget } from './VoiceWidget';
import { sound } from '../utils/audio';
import type { TraatMode } from '../utils/audio';
import { Eye, Sparkles, Flame, LogOut, Maximize, UserPlus, Copy, Check, Mic, MicOff, VolumeX, Volume1, Volume2, Zap } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import type { EmojiReactionEvent } from './EmojiPicker';

interface GameTableProps {
  gameState: GameStateView;
  currentUser: User;
  roomPlayers: RoomPlayer[];
  lastTrickWinner?: string | null;
  onOpenTrump: () => void;
  roomCode?: string;
  onLeaveRoom?: () => void;
  onInviteFriends?: () => void;
}

const SUIT_NAMES: Record<string, string> = {
  S: 'Hukum',
  H: 'Pan',
  D: 'It',
  C: 'Chiri',
};

const SUIT_ORDER: Record<string, number> = { S: 0, H: 1, C: 2, D: 3 };
const RANK_ORDER: Record<string, number> = {
  A: 14,
  K: 13,
  Q: 12,
  J: 11,
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  '2': 2,
};

export const GameTable: React.FC<GameTableProps> = ({
  gameState,
  currentUser,
  roomPlayers,
  lastTrickWinner,
  onOpenTrump,
  roomCode,
  onLeaveRoom,
  onInviteFriends,
}) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [mindiCelebration, setMindiCelebration] = useState<boolean>(false);
  const [coatCelebration, setCoatCelebration] = useState<{ team: 'A' | 'B' } | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };
  const [localVoice, setLocalVoice] = useState<LocalVoiceState>(voiceService.getLocalState());
  const [peerVoices, setPeerVoices] = useState<Record<string, VoicePeerStatus>>({});
  const [traatMode, setTraatMode] = useState<TraatMode>('chaal');
  const [screenShaking, setScreenShaking] = useState<boolean>(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState<boolean>(false);
  const [activeReactions, setActiveReactions] = useState<Record<string, EmojiReactionEvent>>({});

  // Subscribe to Voice State
  useEffect(() => {
    const unsub = voiceService.subscribe((local, peers) => {
      setLocalVoice(local);
      setPeerVoices({ ...peers });
    });
    return () => unsub();
  }, []);

  // Listen for Room Emojis, Ningle & Chat Reactions
  useEffect(() => {
    const handleRoomEmoji = (data: any) => {
      if (!data.userId || !data.emoji) return;
      const event: EmojiReactionEvent = {
        id: `${data.userId}-${Date.now()}-${Math.random()}`,
        userId: data.userId,
        emoji: data.emoji,
        label: data.label,
        emojiType: data.emojiType || 'standard',
        timestamp: Date.now(),
      };
      setActiveReactions((prev) => ({ ...prev, [data.userId]: event }));

      if (data.emojiType === 'ningle') {
        sound.playNingleSound();
      } else if (data.emojiType === 'chat') {
        sound.playChatSound();
      } else {
        sound.playEmojiPop();
      }

      setTimeout(() => {
        setActiveReactions((prev) => {
          if (prev[data.userId]?.id === event.id) {
            const next = { ...prev };
            delete next[data.userId];
            return next;
          }
          return prev;
        });
      }, 3800);
    };

    socketService.on('room_emoji', handleRoomEmoji);
    return () => {
      socketService.off('room_emoji', handleRoomEmoji);
    };
  }, []);

  const handleSendEmoji = (
    emoji: string,
    label: string,
    emojiType: 'standard' | 'ningle' | 'chat' | 'text'
  ) => {
    if (roomCode) {
      socketService.sendEmoji(emoji, label, emojiType, roomCode);
    }
    const event: EmojiReactionEvent = {
      id: `${currentUser.id}-${Date.now()}-${Math.random()}`,
      userId: currentUser.id,
      emoji,
      label,
      emojiType,
      timestamp: Date.now(),
    };
    setActiveReactions((prev) => ({ ...prev, [currentUser.id]: event }));
    if (emojiType === 'ningle') {
      sound.playNingleSound();
    } else if (emojiType === 'chat') {
      sound.playChatSound();
    } else {
      sound.playEmojiPop();
    }
    setTimeout(() => {
      setActiveReactions((prev) => {
        if (prev[currentUser.id]?.id === event.id) {
          const next = { ...prev };
          delete next[currentUser.id];
          return next;
        }
        return prev;
      });
    }, 3800);
  };

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Mindi & Coat capture celebration banners
  const prevMindisRef = useRef((gameState.teamAMindis || 0) + (gameState.teamBMindis || 0));
  useEffect(() => {
    const total = (gameState.teamAMindis || 0) + (gameState.teamBMindis || 0);
    if (total > prevMindisRef.current) {
      if (gameState.teamAMindis === 4 || gameState.teamBMindis === 4) {
        const cTeam = gameState.teamAMindis === 4 ? 'A' : 'B';
        setCoatCelebration({ team: cTeam });
        sound.playCoat();
        const timer = setTimeout(() => setCoatCelebration(null), 4000);
        return () => clearTimeout(timer);
      } else {
        setMindiCelebration(true);
        sound.playMindiCapture();
        const timer = setTimeout(() => setMindiCelebration(false), 2200);
        return () => clearTimeout(timer);
      }
    }
    prevMindisRef.current = total;
  }, [gameState.teamAMindis, gameState.teamBMindis]);

  // Clear selected card and reset sound to default 'chaal' on each turn / trick
  useEffect(() => {
    setSelectedCard(null);
    setTraatMode('chaal');
  }, [gameState.currentTurnUserId, gameState.currentTrick]);

  // Find current user's seat number (1 to 4)
  const myPlayer = roomPlayers.find((p) => p.userId === currentUser.id);
  const mySeat = myPlayer?.seat || 1;
  const isMyTurn = gameState.currentTurnUserId === currentUser.id;
  const isRaangi = gameState.raangiUserId === currentUser.id;
  const isChoosingPhase = gameState.phase === 'CHOOSING_TRUMP';

  // Relative positions: Bottom (Me), Right, Top (Teammate), Left
  const getRelativePosition = (seatNum: number): 'bottom' | 'top' | 'left' | 'right' => {
    const diff = (seatNum - mySeat + 4) % 4;
    switch (diff) {
      case 0:
        return 'bottom';
      case 1:
        return 'right';
      case 2:
        return 'top';
      case 3:
        return 'left';
      default:
        return 'bottom';
    }
  };

  const getPlayerByUserId = (userId: string) => {
    return roomPlayers.find((p) => p.userId === userId);
  };

  // Suit following rules & Trump opener rule
  const hasLeadSuit =
    gameState.leadSuit !== null &&
    gameState.hand.some((c) => c.slice(-1) === gameState.leadSuit);

  const isTrumpOpener =
    gameState.trumpOpened &&
    !!gameState.trumpSuit &&
    gameState.trumpOpenerUserId === currentUser.id;

  const hasTrumpSuit =
    gameState.trumpOpened &&
    !!gameState.trumpSuit &&
    gameState.hand.some((c) => c.slice(-1) === gameState.trumpSuit);

  const isCardLegal = (card: string): boolean => {
    // 1. Follow lead suit if you have it in hand
    if (gameState.currentTrick.length > 0 && gameState.leadSuit && hasLeadSuit) {
      return card.slice(-1) === gameState.leadSuit;
    }

    // 2. If you asked for trump: must play trump suit if in hand, else can play any card
    if (isTrumpOpener && hasTrumpSuit && gameState.trumpSuit) {
      return card.slice(-1) === gameState.trumpSuit;
    }

    return true;
  };

  const canOpenTrump =
    isMyTurn &&
    !gameState.trumpOpened &&
    gameState.currentTrick.length > 0 &&
    !hasLeadSuit;

  // Double-tap to play card:
  // First tap = lift card up; Second tap on same lifted card = throw card
  const handleCardClick = (card: string) => {
    // A. Raangi choosing hidden trump phase
    if (isChoosingPhase && isRaangi) {
      if (selectedCard === card) {
        // Second tap: confirms choosing this card as hidden trump
        setSelectedCard(null);
        socketService.chooseTrump(card);
      } else {
        // First tap: lifts card to preview
        setSelectedCard(card);
      }
      return;
    }

    // B. Normal play phase: check if it is player turn
    if (!isMyTurn || isChoosingPhase) {
      // Allow previewing / inspecting card
      setSelectedCard((prev) => (prev === card ? null : card));
      return;
    }

    // Verify card is legal
    if (!isCardLegal(card)) {
      setSelectedCard(null);
      return;
    }

    // C. Single tap: lifts card; Second tap: throws card
    if (selectedCard === card) {
      // Second tap on already lifted card -> Throw to table!
      const isTraat = traatMode === 'traat' || traatMode === 'full';
      const traatVol = isTraat ? 100 : 20;
      sound.playTraatCardPlay(traatMode);
      if (isTraat) {
        setScreenShaking(true);
        setTimeout(() => setScreenShaking(false), 750);
      }
      socketService.playCard(card, traatVol);
      setSelectedCard(null);
      setTraatMode('chaal');
    } else {
      // First tap -> Lift this card up
      setSelectedCard(card);
    }
  };

  // Organize trick cards by relative seat position
  const trickCardsByPos: Record<string, string> = {};
  gameState.currentTrick.forEach((played) => {
    const player = getPlayerByUserId(played.userId);
    const seat = player?.seat || gameState.seats?.find(s => s.userId === played.userId)?.seat || 1;
    const pos = getRelativePosition(seat);
    trickCardsByPos[pos] = played.card;
  });

  const winnerPlayer = lastTrickWinner ? getPlayerByUserId(lastTrickWinner) : null;

  // Calculate WE and THEM stats
  const isMyTeamA = mySeat % 2 !== 0;
  const weTricks = isMyTeamA ? gameState.teamATricks : gameState.teamBTricks;
  const weMindis = isMyTeamA ? gameState.teamAMindis : gameState.teamBMindis;
  const themTricks = isMyTeamA ? gameState.teamBTricks : gameState.teamATricks;
  const themMindis = isMyTeamA ? gameState.teamBMindis : gameState.teamAMindis;

  // Sort user's hand by suit and rank
  const sortedHand = [...gameState.hand].sort((a, b) => {
    const suitA = a.slice(-1);
    const suitB = b.slice(-1);
    if (suitA !== suitB) {
      return (SUIT_ORDER[suitA] ?? 99) - (SUIT_ORDER[suitB] ?? 99);
    }
    const rankA = a.slice(0, -1);
    const rankB = b.slice(0, -1);
    return (RANK_ORDER[rankB] ?? 0) - (RANK_ORDER[rankA] ?? 0);
  });

  return (
    <div className={`table-stage-wrapper ${screenShaking ? 'traat-shaking' : ''}`}>
      {/* Top In-Game Quick Action Bar */}
      <div className="game-table-top-actions">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary btn-sm btn-fullscreen-toggle"
            onClick={toggleFullscreen}
            title="Fullscreen Mode"
          >
            <Maximize size={13} />
          </button>

          {onLeaveRoom && (
            <button
              className="btn btn-danger btn-sm"
              onClick={onLeaveRoom}
              title="Leave Room and return to Lobby"
            >
              <LogOut size={14} /> Leave Table
            </button>
          )}

          {roomCode && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopyCode}
              title="Copy Room Code"
              style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1px' }}
            >
              {copiedCode ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copiedCode ? 'Copied' : `Room: ${roomCode}`}</span>
            </button>
          )}

          {/* PUBG Squad Voice Chat Widget */}
          <VoiceWidget
            roomCode={roomCode || ''}
            currentUser={currentUser}
            roomPlayers={roomPlayers}
          />
        </div>

        {onInviteFriends && (
          <button
            className="btn btn-emerald btn-sm"
            onClick={onInviteFriends}
            title="Invite Friends to Table"
          >
            <UserPlus size={14} /> Invite Friends
          </button>
        )}
      </div>

      <div className="felt-table" onClick={(e) => { if (e.target === e.currentTarget && selectedCard) setSelectedCard(null); }}>
        {/* Table Felt Watermark */}
        <div className="table-center-mode-label">
          1 Deck Hide Mode
        </div>

        {/* ========================================================
            TOP LEFT BANDH RANG WIDGET
        ======================================================== */}
        <div className="top-left-trump-bar">
          <div className="trump-deck-pill">
            <span style={{ fontSize: '12px', fontWeight: 900, color: 'var(--accent-gold)' }}>
              {gameState.trumpOpened ? 'RANG:' : 'BANDH RANG'}
            </span>
            {gameState.trumpOpened ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {gameState.trumpSuit && <SuitIcon suit={gameState.trumpSuit} size={16} />}
                <span style={{ fontWeight: 900, fontSize: '13px', color: '#fff' }}>
                  {gameState.trumpSuit ? SUIT_NAMES[gameState.trumpSuit] : 'Rang'}
                </span>
                {gameState.hiddenTrumpCard && (
                  <Card card={gameState.hiddenTrumpCard} size="sm" isPlayable={false} />
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Card isFaceDown={true} size="sm" />
                {canOpenTrump && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={onOpenTrump}
                    style={{ animation: 'turn-pulse 1.4s infinite', padding: '4px 10px', fontSize: '12px' }}
                  >
                    <Eye size={12} /> Open Rang!
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            "WE" FELT SCOREBOARD (LEFT FELT)
        ======================================================== */}
        <div className="felt-team-score-we">
          <div className="mindi-mini-fan">
            {[1, 2, 3, 4].map((idx) => {
              const hasDehla = weMindis >= idx;
              return (
                <div
                  key={`we-dehla-${idx}`}
                  className={`mindi-mini-card ${hasDehla ? 'active-mindi' : ''}`}
                  style={{ transform: `rotate(${(idx - 2.5) * 8}deg)` }}
                >
                  {hasDehla ? '10' : '0'}
                </div>
              );
            })}
          </div>
          <div className="felt-score-counts">
            <span className="felt-trick-num">{weTricks}</span>
            <span className="felt-team-title">WE</span>
          </div>
        </div>

        {/* ========================================================
            "THEM" FELT SCOREBOARD (RIGHT FELT)
        ======================================================== */}
        <div className="felt-team-score-them">
          <div className="mindi-mini-fan">
            {[1, 2, 3, 4].map((idx) => {
              const hasDehla = themMindis >= idx;
              return (
                <div
                  key={`them-dehla-${idx}`}
                  className={`mindi-mini-card ${hasDehla ? 'active-mindi' : ''}`}
                  style={{ transform: `rotate(${(idx - 2.5) * 8}deg)` }}
                >
                  {hasDehla ? '10' : '0'}
                </div>
              );
            })}
          </div>
          <div className="felt-score-counts">
            <span className="felt-trick-num">{themTricks}</span>
            <span className="felt-team-title">THEM</span>
          </div>
        </div>

        {/* ========================================================
            4 PLAYER SEAT STATIONS (AROUND THE FELT)
        ======================================================== */}
        {[1, 2, 3, 4].map((seatNum) => {
          const roomP = roomPlayers.find((p) => p.seat === seatNum);
          const seatUser = gameState.seats?.find((s) => s.seat === seatNum);
          const userId = roomP?.userId || seatUser?.userId || (seatNum === mySeat ? currentUser.id : `seat-${seatNum}`);
          const pos = getRelativePosition(seatNum);
          const isTurn = gameState.currentTurnUserId === userId;
          const isDealer = gameState.dealerUserId === userId || gameState.dealerSeat === seatNum;
          const isPlayerRaangi = gameState.raangiUserId === userId || gameState.raangiSeat === seatNum;
          const isMe = (userId === currentUser.id) || (seatNum === mySeat);
          const username = isMe ? `${currentUser.username || 'You'}` : (roomP?.username || `Player ${seatNum}`);
          const initial = isMe ? (currentUser.username?.charAt(0) || 'Y') : (roomP?.username?.charAt(0) || `P`);

          // Voice Status for this player
          const isSpeaking = isMe ? localVoice.isSpeaking : !!peerVoices[userId]?.isSpeaking;
          const isMuted = isMe ? localVoice.isMuted : !!peerVoices[userId]?.isMuted;
          const isDeafened = isMe ? localVoice.isDeafened : !!peerVoices[userId]?.isDeafened;

          const reaction = userId ? activeReactions[userId] : null;

          return (
            <div
              key={`station-${seatNum}-${pos}`}
              className={`player-station station-${pos} ${isTurn ? 'is-turn' : ''} ${isSpeaking ? 'is-speaking' : ''}`}
            >
              {/* Floating Live Emoji / Ningle / Chat Reaction */}
              {reaction && (
                <div className={`player-floating-reaction reaction-pos-${pos} reaction-type-${reaction.emojiType}`}>
                  {reaction.emojiType === 'ningle' ? (
                    <div className="reaction-special-badge ningle-reaction-anim">
                      <span className="reaction-special-icon">🐍🍽️</span>
                      <div className="reaction-special-texts">
                        <span className="reaction-special-name">NINGLE!</span>
                        <span className="reaction-special-sub">निगल गया!</span>
                      </div>
                    </div>
                  ) : reaction.emojiType === 'chat' ? (
                    <div className="reaction-special-badge chat-reaction-anim">
                      <span className="reaction-special-icon">⚡👅</span>
                      <div className="reaction-special-texts">
                        <span className="reaction-special-name">CHAT!</span>
                        <span className="reaction-special-sub">चट कर दिया!</span>
                      </div>
                    </div>
                  ) : reaction.emojiType === 'text' ? (
                    <div className="reaction-chat-bubble">
                      <span className="reaction-chat-text">{reaction.label || reaction.emoji}</span>
                    </div>
                  ) : (
                    <div className="reaction-standard-bubble">
                      <span className="reaction-standard-char">{reaction.emoji}</span>
                      {reaction.label && <span className="reaction-standard-label">{reaction.label}</span>}
                    </div>
                  )}
                </div>
              )}
              {/* Name above avatar for top, left, right */}
              {pos !== 'bottom' && (
                <div className="player-station-name">
                  {isSpeaking && <Mic size={11} className="voice-mic-icon" color="#4ade80" />}
                  {username}
                </div>
              )}

              <div className="avatar-timer-wrapper">
                {/* Live Speaking Halo Ripple */}
                {isSpeaking && <div className="avatar-speaking-halo" />}

                {/* Current Turn Active Indicator & Radiant Halo */}
                {isTurn && (
                  <>
                    <div className="turn-timer-ring" />
                    <div className="turn-pulse-glow" />
                    <div className="avatar-turn-indicator-badge">
                      <span className="turn-indicator-dot" />
                      <span>CHAAL</span>
                    </div>
                  </>
                )}
                <div
                  className="player-avatar-main"
                  style={{
                    background: isMe
                      ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                      : seatNum % 2 !== 0
                      ? 'linear-gradient(135deg, #0284c7, #0369a1)'
                      : 'linear-gradient(135deg, #9333ea, #7e22ce)',
                  }}
                >
                  <span className="avatar-letter">{initial.toUpperCase()}</span>
                  <div className="avatar-inner-ring" />
                </div>

                {/* Voice Status Badge */}
                {isSpeaking ? (
                  <div className="avatar-voice-badge status-speaking" title="Speaking">
                    <Mic size={10} />
                  </div>
                ) : isMuted ? (
                  <div className="avatar-voice-badge status-muted" title="Muted">
                    <MicOff size={10} />
                  </div>
                ) : isDeafened ? (
                  <div className="avatar-voice-badge status-deafened" title="Deafened">
                    <VolumeX size={10} />
                  </div>
                ) : null}

                {isDealer && (
                  <div className="chip-badge chip-dealer chip-peeshu" title="Peeshu (Dealer)">
                    P
                  </div>
                )}
                {isPlayerRaangi && (
                  <div className="chip-badge chip-raangi" title="Raangi (Rang Chooser)">
                    R
                  </div>
                )}

                {/* Opponent face-down hand fan */}
                {!isMe && (
                  <div className="opponent-mini-fan">
                    <Card isFaceDown={true} size="sm" className="shadow-sm" />
                    <span className="opponent-card-count-badge">
                      {13 - Math.max(0, (gameState.trickNumber || 1) - 1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Name below avatar for bottom (You) */}
              {pos === 'bottom' && (
                <div className="player-station-name">
                  {isSpeaking && <Mic size={11} className="voice-mic-icon" color="#4ade80" />}
                  {username}
                </div>
              )}
            </div>
          );
        })}

        {/* ========================================================
            CENTER 4-WAY CROSS TRICK ARENA
        ======================================================== */}
        <div className="center-trick-cross-arena">
          <div className="center-hide-badge">
            <span style={{ fontSize: '9px', opacity: 0.7 }}>HIDE</span>
            <span style={{ fontSize: '11px', color: '#f59e0b' }}>♦️</span>
          </div>

          {/* Dehla Celebration Popup Banner */}
          {mindiCelebration && !coatCelebration && (
            <div className="mindi-banner-popup">
              <Sparkles size={20} />
              <span>1 DEHLA!</span>
            </div>
          )}

          {/* Big In-Game Coat Banner */}
          {coatCelebration && (
            <div className="coat-table-popup">
              <div className="coat-popup-badge">
                <Flame size={20} className="flame-flicker" />
                <span>🔥 COAT! MINDI COAT! 🔥</span>
                <Flame size={20} className="flame-flicker" />
              </div>
              <div className="coat-popup-text">
                TEAM {coatCelebration.team} CAPTURED ALL 4 DEHLE (10s)!
              </div>
            </div>
          )}

          {/* Cards currently placed into the trick cross */}
          {trickCardsByPos.top && (
            <div className="trick-cross-slot pos-top">
              <Card card={trickCardsByPos.top} size="md" isPlayable={false} />
            </div>
          )}
          {trickCardsByPos.bottom && (
            <div className="trick-cross-slot pos-bottom">
              <Card card={trickCardsByPos.bottom} size="md" isPlayable={false} />
            </div>
          )}
          {trickCardsByPos.left && (
            <div className="trick-cross-slot pos-left">
              <Card card={trickCardsByPos.left} size="md" isPlayable={false} />
            </div>
          )}
          {trickCardsByPos.right && (
            <div className="trick-cross-slot pos-right">
              <Card card={trickCardsByPos.right} size="md" isPlayable={false} />
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          USER HAND TRAY (BOTTOM FANNED OUT)
      ======================================================== */}
      <div className="hand-tray-container" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', position: 'relative' }}>
        {/* Turn prompt message & Traan (Traat) Slam Button Beside Playing Player */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap', textAlign: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: isMyTurn ? 'var(--accent-gold)' : 'var(--text-muted)' }}>
            {isChoosingPhase
              ? isRaangi
                ? selectedCard
                  ? `👑 Tap ${selectedCard} again to confirm as Bandh Rang!`
                  : '👑 You are Raangi: Tap a card to lift & choose as hidden Rang'
                : 'Waiting for Raangi to choose Rang...'
              : isMyTurn
              ? isTrumpOpener
                ? hasTrumpSuit && gameState.trumpSuit
                  ? selectedCard
                    ? `⚡ Tap ${selectedCard} again to throw Rang!`
                    : `⚡ You asked for Rang: Tap a ${SUIT_NAMES[gameState.trumpSuit]} card to lift it`
                  : selectedCard
                    ? `⚡ Tap ${selectedCard} again to throw!`
                    : '⚡ No Rang cards: Tap any card to lift it'
                : selectedCard
                  ? `⚡ Tap ${selectedCard} again to throw!`
                  : '⚡ YOUR TURN: Tap a card to lift it'
              : winnerPlayer
              ? `Trick won by ${winnerPlayer.userId === currentUser.id ? 'You' : winnerPlayer.username}`
              : 'Waiting for other players to play...'}
          </span>
          {gameState.leadSuit && !isChoosingPhase && !isTrumpOpener && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '8px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Must follow:</span>
              <SuitIcon suit={gameState.leadSuit} size={14} />
              <strong>{SUIT_NAMES[gameState.leadSuit]}</strong>
            </div>
          )}
          {isTrumpOpener && isMyTurn && gameState.trumpSuit && hasTrumpSuit && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.5)', padding: '2px 8px', borderRadius: '8px', fontSize: '12px', color: 'var(--accent-gold)' }}>
              <span>Must play Rang:</span>
              <SuitIcon suit={gameState.trumpSuit} size={14} />
              <strong>{SUIT_NAMES[gameState.trumpSuit]}</strong>
            </div>
          )}
        </div>

        {/* Hand Cards with Enlarged TRAAT button on the right */}
        <div className="player-hand-row-with-traat">
          {/* Player Hand Cards */}
          <div className="player-hand-tray" onClick={(e) => { if (e.target === e.currentTarget && selectedCard) setSelectedCard(null); }}>
            {sortedHand.map((card, idx) => {
              const isLegal = isCardLegal(card);
              const isPlayable = isMyTurn && !isChoosingPhase && isLegal;
              const isInvalid = isMyTurn && !isChoosingPhase && !isLegal;
              const isTrump = gameState.trumpOpened && gameState.trumpSuit ? card.slice(-1) === gameState.trumpSuit : false;

              // Fanning calculation: curve angle and vertical offset
              const isSelected = selectedCard === card;
              const total = sortedHand.length;
              const offset = idx - (total - 1) / 2;
              const rot = isSelected ? 0 : offset * 2.0;
              const elev = (Math.abs(offset) * 2.5) + (isSelected ? -28 : 0);

              return (
                <div key={card} className="hand-card-wrapper">
                  <Card
                    card={card}
                    size="md"
                    isPlayable={isPlayable}
                    isInvalid={isInvalid}
                    isSelected={isSelected}
                    isTrump={isTrump}
                    rotation={rot}
                    elevation={elev}
                    onClick={() => handleCardClick(card)}
                  />
                </div>
              );
            })}
          </div>

          {/* Combined Action Controls: TRAAT Sound & Emojis */}
          <div className="table-controls-dock">
            {/* TRAAT 2-Mode Sound Selector (Docked to the Right of Hand Cards) */}
          <div className="traat-dock-right" title="Card Play Sound: Chaal or Traat">
            <div className="traat-label-pill">
              <span className="traat-label-text">SOUND</span>
            </div>
            <div className="traat-mode-buttons-stack">
              <button
                type="button"
                className={`traat-sound-btn ${traatMode === 'chaal' ? 'active-chaal' : ''}`}
                onClick={() => setTraatMode('chaal')}
                title="Chaal: Standard soft card drop (Default)"
              >
                <Volume2 size={15} />
                <span>Chaal</span>
              </button>
              <button
                type="button"
                className={`traat-sound-btn ${traatMode === 'halki' ? 'active-halki' : ''}`}
                onClick={() => setTraatMode('halki')}
                title="Halki: Snappy & distinct card slap"
              >
                <Volume1 size={15} />
                <span>Halki</span>
              </button>
              <button
                type="button"
                className={`traat-sound-btn ${traatMode === 'traat' || traatMode === 'full' ? 'active-traat' : ''}`}
                onClick={() => setTraatMode('traat')}
                title="Traat: 3-Second Thunderous Desi Table Slam! 💥"
              >
                <Zap size={15} />
                <span>Traat 💥</span>
              </button>
            </div>

            {/* Emojis, Ningle & Chat Drawer */}
            <EmojiPicker
              isOpen={emojiPickerOpen}
              onToggle={() => setEmojiPickerOpen((prev) => !prev)}
              onSelectEmoji={handleSendEmoji}
            />
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};




