import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import type { Friend, FriendRequest } from '../types';
import { Users, UserPlus, Check, X, Send, XCircle } from 'lucide-react';

interface FriendsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoomCode?: string | null;
}

export const FriendsDrawer: React.FC<FriendsDrawerProps> = ({
  isOpen,
  onClose,
  currentRoomCode,
}) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.getFriends(),
        api.getPendingRequests(),
      ]);
      if (friendsRes.success) setFriends(friendsRes.friends || []);
      if (requestsRes.success) setRequests(requestsRes.requests || []);
    } catch (e) {
      console.error('Failed to load friends data', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.sendFriendRequest(newUsername.trim());
      setStatusMessage(res.message || 'Request sent!');
      if (res.success) {
        setNewUsername('');
        loadData();
      }
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string) => {
    try {
      await api.acceptFriendRequest(requestId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await api.rejectFriendRequest(requestId);
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = (friendId: string) => {
    if (!currentRoomCode) return;
    try {
      socketService.inviteToRoom(friendId, currentRoomCode);
      setStatusMessage('Invitation dispatched!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '460px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={24} color="#f59e0b" />
            <h2 style={{ fontSize: '22px', fontWeight: 900 }}>Friends & Social</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <XCircle size={18} />
          </button>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#fbbf24',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {statusMessage}
          </div>
        )}

        {/* Add Friend Form */}
        <form onSubmit={handleSendRequest} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search username to add..."
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={!newUsername.trim() || loading}>
            <UserPlus size={16} /> Add
          </button>
        </form>

        {/* Pending Requests */}
        {requests.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Pending Requests ({requests.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {requests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>
                    {req.sender?.username || 'User'}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className="btn btn-emerald btn-sm"
                      onClick={() => handleAccept(req.id)}
                      title="Accept"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleReject(req.id)}
                      title="Reject"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            My Friends ({friends.length})
          </h4>
          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '14px' }}>
              No friends added yet. Send requests above!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-glass)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: friend.isOnline ? '#10b981' : '#64748b',
                        boxShadow: friend.isOnline ? '0 0 8px #10b981' : 'none',
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>{friend.username}</span>
                  </div>

                  {currentRoomCode && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleInvite(friend.id)}
                      title="Invite to your room"
                    >
                      <Send size={12} /> Invite
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
