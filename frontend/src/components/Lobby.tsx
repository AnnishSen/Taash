import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import type { Room } from '../types';
import { Plus, Hash, RefreshCw, Users, Shield, ArrowRight, Loader2 } from 'lucide-react';

interface LobbyProps {
  onRoomJoined: (roomCode: string, initialRoom?: Room) => void;
  onOpenFriends: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onRoomJoined, onOpenFriends }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningCode, setJoiningCode] = useState<string | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await api.getRooms();
      if (res.success) {
        setRooms(res.rooms || []);
      }
    } catch (e) {
      console.error('Failed to load rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await api.createRoom();
      if (res.success && res.room) {
        onRoomJoined(res.room.roomCode, res.room);
        socketService.joinRoom(res.room.roomCode);
      } else {
        setError(res.message || 'Failed to create room. You may already be in a room.');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setError(null);
    setJoiningCode(code);

    try {
      const res = await api.joinRoom(code);
      if (res.success && res.roomCode) {
        socketService.joinRoom(res.roomCode);
        onRoomJoined(res.roomCode);
      } else {
        setError(res.message || 'Failed to join room');
      }
    } catch (err: any) {
      setError(err.message || 'Error joining room');
    } finally {
      setJoiningCode(null);
    }
  };

  const handleDirectJoin = async (roomCode: string) => {
    setError(null);
    setJoiningCode(roomCode);
    try {
      const res = await api.joinRoom(roomCode);
      if (res.success && res.roomCode) {
        socketService.joinRoom(res.roomCode);
        onRoomJoined(res.roomCode);
      } else {
        setError(res.message || 'Could not join room');
      }
    } catch (err: any) {
      setError(err.message || 'Error joining room');
    } finally {
      setJoiningCode(null);
    }
  };

  return (
    <div className="table-stage-wrapper">
      <div className="lobby-container">
        {/* Banner */}
        <div className="lobby-hero-banner">
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px' }}>
              Dehla Arena ♠️ ♥️ ♦️ ♣️
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
              The traditional 4-player team card showdown. Capture the 10s (Dehle) and take the coat!
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onOpenFriends}>
            <Users size={16} /> Friends & Social
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Shield size={16} /> {error}
          </div>
        )}

        <div className="lobby-grid-cards">
          {/* Quick Create Card */}
          <div className="lobby-card">
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Host a New Game
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
                Create a private room, get a 6-character room code, and invite your teammates.
              </p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={handleCreateRoom}
              disabled={creating}
              style={{ width: '100%' }}
            >
              {creating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              {creating ? 'Creating Room...' : 'Create Room'}
            </button>
          </div>

          {/* Join by Code Card */}
          <div className="lobby-card">
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Join With Room Code
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                Have a code from a friend? Enter the 6-character room code below.
              </p>
            </div>
            <form onSubmit={handleJoinByCode} style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. AB12CD"
                  maxLength={10}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  style={{ textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, paddingLeft: '36px' }}
                />
                <Hash
                  size={16}
                  style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
                />
              </div>
              <button
                type="submit"
                className="btn btn-emerald"
                disabled={!joinCode.trim() || !!joiningCode}
              >
                {joiningCode === joinCode.trim().toUpperCase() ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Public Rooms List */}
        <div className="lobby-public-rooms">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700 }}>
              Available Rooms ({rooms.filter((r) => r.status === 'WAITING').length})
            </h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={fetchRooms}
              disabled={loading}
              title="Refresh room list"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>

          {rooms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <p>No active rooms right now. Create one above to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
              {rooms.map((r) => {
                const isWaiting = r.status === 'WAITING';
                const count = r.playerCount || r.players?.length || 0;
                const isFull = count >= 4;

                return (
                  <div
                    key={r.id || r.roomCode}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: '14px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--accent-gold)', letterSpacing: '1px' }}>
                          {r.roomCode}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: isWaiting ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            color: isWaiting ? '#10b981' : '#f59e0b',
                          }}
                        >
                          {r.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Host: <strong>{r.hostUsername || 'Player'}</strong> • {count}/4 Players
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={!isWaiting || isFull || joiningCode === r.roomCode}
                      onClick={() => handleDirectJoin(r.roomCode)}
                    >
                      {joiningCode === r.roomCode ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : isFull ? (
                        'Full'
                      ) : (
                        'Join'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
