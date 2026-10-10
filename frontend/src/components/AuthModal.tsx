import React, { useState } from 'react';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import type { User } from '../types';
import { LogIn, UserPlus } from 'lucide-react';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await api.signin({ email, password });
        if (res.success && res.user) {
          socketService.authenticate(res.token);
          onSuccess(res.user);
        } else {
          setError(res.message || 'Login failed. Check your credentials.');
        }
      } else {
        const res = await api.signup({ email, username, password });
        if (res.success) {
          // Auto login after signup
          const loginRes = await api.signin({ email, password });
          if (loginRes.success && loginRes.user) {
            socketService.authenticate(loginRes.token);
            onSuccess(loginRes.user);
          } else {
            setIsLogin(true);
            setError('Account created! Please sign in.');
          }
        } else {
          setError(res.message || 'Registration failed.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', padding: '10px', borderRadius: '18px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: '12px' }}>`n            <img src="/favicon.svg" alt="Taash Logo" style={{ width: 44, height: 44, objectFit: 'contain' }} />`n          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px' }}>
            {isLogin ? 'Welcome back to Taash' : 'Join the Taash Arena'}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {isLogin ? 'Sign in to challenge friends in Mindi' : 'Create an account to start playing'}
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '4px', marginBottom: '20px' }}>
          <button
            type="button"
            className={`btn btn-sm ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setIsLogin(true); setError(null); }}
          >
            <LogIn size={14} /> Sign In
          </button>
          <button
            type="button"
            className={`btn btn-sm ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1 }}
            onClick={() => { setIsLogin(false); setError(null); }}
          >
            <UserPlus size={14} /> Sign Up
          </button>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. AceOfSpades"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '12px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
};


