import React, { useState, useEffect } from 'react';
import type { Room, User, RoomPlayer } from '../types';
import { socketService } from '../services/socket';
import { voiceService } from '../services/voice';
import type { LocalVoiceState, VoicePeerStatus } from '../services/voice';
import { VoiceWidget } from './VoiceWidget';
import { Copy, Check, Play, LogOut, Crown, CheckCircle2, Circle, Users, Mic, MicOff } from 'lucide-react';

interface WaitingRoomProps {
  room: Room;
  players: RoomPlayer[];
  currentUser: User;
  onLeave: () => void;
  onOpenFriends: () => void;
  onToggleReady?: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  room,
  players,
  currentUser,
  onLeave,
  onOpenFriends,
  onToggleReady,
}) => {
  const [copied, setCopied] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);
  const [localVoice, setLocalVoice] = useState<LocalVoiceState>(voiceService.getLocalState());
  const [peerVoices, setPeerVoices] = useState<Record<string, VoicePeerStatus>>({});

  // Subscribe to voice state changes
  useEffect(() => {
    const unsub = voiceService.subscribe((local, peers) => {
      setLocalVoice(local);
      setPeerVoices({ ...peers });
    });
    return () => unsub();
  }, []);

  const myPlayer = players.find((p) => p.userId === currentUser.id);
  const isHost = room.hostId === currentUser.id;
  const isReady = myPlayer?.isReady || false;
  const allReady = players.length === 4 && players.every((p) => p.isReady);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleReady = () => {
    onToggleReady?.();
    socketService.toggleReady(room.roomCode);
  };

  const handleStartGame = () => {
    if (!allReady || !isHost) return;
    setLoadingStart(true);
    socketService.startGame(room.roomCode);
    setTimeout(() => setLoadingStart(false), 3000);
  };

  const seats = [1, 2, 3, 4].map((seatNum) => {
    const player = players.find((p) => p.seat === seatNum);
    return {
      seatNum,
      player,
    };
  });

  return (
    <div className="table-stage-wrapper">
      <div className="waiting-room-card">
        {/* Header */}
        <div className="waiting-room-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Private Arena Code
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 900,
                  letterSpacing: '3px',
                  fontFamily: 'JetBrains Mono, monospace',
                  color: 'var(--accent-gold)',
                  textShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                }}
              >
                {room.roomCode}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleCopyCode}
                title="Copy room code"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Copied Code!' : 'Copy Code'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <VoiceWidget
              roomCode={room.roomCode}
              currentUser={currentUser}
              roomPlayers={players}
            />
            <button className="btn btn-secondary" onClick={onOpenFriends}>
              <Users size={16} /> Invite Friends
            </button>
            <button className="btn btn-danger" onClick={onLeave}>
              <LogOut size={16} /> Leave Room
            </button>
          </div>
        </div>

        {/* 4 Seats Grid */}
        <div className="waiting-room-seats-grid">
          {seats.map(({ seatNum, player }) => {
            const isMe = player?.userId === currentUser.id;
            const isPlayerHost = player?.userId === room.hostId;
            const isTeamA = seatNum === 1 || seatNum === 3;
            const team = isTeamA ? 'Team A' : 'Team B';

            const isSpeaking = player ? (isMe ? localVoice.isSpeaking : !!peerVoices[player.userId]?.isSpeaking) : false;
            const isMuted = player ? (isMe ? localVoice.isMuted : !!peerVoices[player.userId]?.isMuted) : false;

            return (
              <div
                key={seatNum}
                style={{
                  padding: '24px 18px',
                  borderRadius: '20px',
                  background: player
                    ? 'rgba(255, 255, 255, 0.05)'
                    : 'rgba(255, 255, 255, 0.015)',
                  border: isSpeaking
                    ? '2px solid #22c55e'
                    : isMe
                    ? '2px solid var(--accent-gold)'
                    : '1px dashed var(--border-glass)',
                  boxShadow: isSpeaking
                    ? '0 0 25px rgba(34, 197, 94, 0.4)'
                    : isMe
                    ? '0 0 25px rgba(245, 158, 11, 0.25)'
                    : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  minHeight: '210px',
                  justifyContent: 'space-between',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              >
                {/* Team Tag */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      background: isTeamA ? 'rgba(59, 130, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: isTeamA ? '#93c5fd' : '#fde047',
                      border: `1px solid ${isTeamA ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
                    }}
                  >
                    Seat {seatNum} • {team}
                  </span>
                </div>

                {player ? (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '54px',
                          height: '54px',
                          borderRadius: '50%',
                          background: isMe
                            ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                            : isTeamA
                            ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
                            : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '20px',
                          color: '#fff',
                          position: 'relative',
                          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                        }}
                      >
                        {isSpeaking && <div className="avatar-speaking-halo" />}
                        {player.username?.charAt(0).toUpperCase() || 'P'}

                        {isPlayerHost && (
                          <div
                            style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '-8px',
                              background: '#f59e0b',
                              borderRadius: '50%',
                              padding: '4px',
                              color: '#0f172a',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)',
                              zIndex: 5,
                            }}
                            title="Room Host"
                          >
                            <Crown size={14} />
                          </div>
                        )}

                        {/* Voice Status Badge */}
                        {isSpeaking ? (
                          <div className="avatar-voice-badge status-speaking" title="Speaking">
                            <Mic size={10} />
                          </div>
                        ) : isMuted ? (
                          <div className="avatar-voice-badge status-muted" title="Muted">
                            <MicOff size={10} />
                          </div>
                        ) : null}
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isSpeaking && <Mic size={12} color="#4ade80" />}
                        <span>{player.username || (isMe ? currentUser.username : 'Player')}</span>
                      </div>
                    </div>

                    {/* Ready Badge */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: player.isReady ? '#10b981' : '#94a3b8',
                      }}
                    >
                      {player.isReady ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      {player.isReady ? 'READY' : 'WAITING'}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 1,
                      color: 'var(--text-muted)',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: '2px dashed rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                      }}
                    >
                      +
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Empty Slot</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Players ready: <strong>{players.filter((p) => p.isReady).length} / 4</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <button
              className={`btn ${isReady ? 'btn-danger' : 'btn-emerald'} btn-lg`}
              onClick={handleToggleReady}
            >
              {isReady ? 'Cancel Ready' : 'Ready Up!'}
            </button>

            {isHost && (
              <button
                className="btn btn-primary btn-lg"
                disabled={!allReady || loadingStart}
                onClick={handleStartGame}
                title={allReady ? 'Start match' : 'Waiting for 4 ready players'}
              >
                <Play size={18} /> {loadingStart ? 'Dealing Cards...' : 'Start Game'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
