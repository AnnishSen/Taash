import React, { useState } from 'react';
import { Smile, MessageSquare, Sparkles, X, ChevronUp, ChevronDown } from 'lucide-react';

export interface EmojiReactionEvent {
  id: string;
  userId: string;
  emoji: string;
  label?: string;
  emojiType: 'standard' | 'ningle' | 'chat' | 'text';
  timestamp: number;
}

export const SPECIAL_EMOJIS = [
  {
    id: 'ningle' as const,
    name: 'Ningle',
    badge: '🐍 NINGLE!',
    hindi: 'निगल गया!',
    desc: 'Swallow trick / Eat card',
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #059669, #10b981, #34d399)',
    icon: '🐍🍽️',
  },
  {
    id: 'chat' as const,
    name: 'Chat',
    badge: '⚡ CHAT!',
    hindi: 'चट कर दिया!',
    desc: 'Licked clean / Clean sweep',
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #d97706, #f59e0b, #fbbf24)',
    icon: '⚡👅',
  },
];

export const STANDARD_EMOJIS = [
  { emoji: '😂', name: 'Haha' },
  { emoji: '🔥', name: 'Aag' },
  { emoji: '👑', name: 'Badshah' },
  { emoji: '👏', name: 'Taali' },
  { emoji: '🤫', name: 'Shhh' },
  { emoji: '💀', name: 'Ded' },
  { emoji: '💔', name: 'Dard' },
  { emoji: '💥', name: 'Traat' },
  { emoji: '🎯', name: 'Dehla' },
  { emoji: '🤡', name: 'Majaak' },
  { emoji: '😈', name: 'Shaitaan' },
  { emoji: '🤝', name: 'Dosti' },
];

export const QUICK_CHATS = [
  { text: 'Chal jaldi bhai! ⏳', tag: 'Fast' },
  { text: 'Rang dikha! 🎴', tag: 'Rang' },
  { text: 'Dehla kidhar hai? 👑', tag: 'Dehla' },
  { text: 'Traat mara be! 💥', tag: 'Traat' },
  { text: 'Coat pakka hai! 🏆', tag: 'Coat' },
  { text: 'Kya chaal chali! 👏', tag: 'Chaal' },
];

interface EmojiPickerProps {
  isOpen: boolean;
  onToggle: () => void;
  onSelectEmoji: (emoji: string, label: string, emojiType: 'standard' | 'ningle' | 'chat' | 'text') => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ isOpen, onToggle, onSelectEmoji }) => {
  const [activeTab, setActiveTab] = useState<'special' | 'emoji' | 'chat'>('special');

  return (
    <div className="emoji-picker-container">
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`emoji-dock-trigger-btn ${isOpen ? 'is-active' : ''}`}
        onClick={onToggle}
        title="Send Emojis, Ningle, Chat & Taash Banter"
      >
        <div className="emoji-trigger-icons">
          <Smile size={18} className="emoji-trigger-icon-smile" />
          <span className="emoji-trigger-special-dots">⚡🐍</span>
        </div>
        <span className="emoji-trigger-label">EMOJIS</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {/* Popover Reaction Tray */}
      {isOpen && (
        <div className="emoji-popover-tray">
          <div className="emoji-popover-header">
            <div className="emoji-tabs-switcher">
              <button
                type="button"
                className={`emoji-tab-btn ${activeTab === 'special' ? 'active' : ''}`}
                onClick={() => setActiveTab('special')}
              >
                <Sparkles size={13} color="#f59e0b" />
                <span>Special</span>
                <span className="special-count-pill">2</span>
              </button>
              <button
                type="button"
                className={`emoji-tab-btn ${activeTab === 'emoji' ? 'active' : ''}`}
                onClick={() => setActiveTab('emoji')}
              >
                <Smile size={13} />
                <span>Emojis</span>
              </button>
              <button
                type="button"
                className={`emoji-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                <MessageSquare size={13} />
                <span>Banter</span>
              </button>
            </div>
            <button
              type="button"
              className="emoji-popover-close-btn"
              onClick={onToggle}
              title="Close"
            >
              <X size={14} />
            </button>
          </div>

          <div className="emoji-popover-body">
            {/* 1. SPECIAL EMOJIS: NINGLE & CHAT */}
            {activeTab === 'special' && (
              <div className="special-emojis-section">
                <div className="special-section-hint">
                  <span>Exclusive Desi Taash Reactions:</span>
                </div>
                <div className="special-emojis-grid">
                  {SPECIAL_EMOJIS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`special-emoji-card special-card-${item.id}`}
                      onClick={() => onSelectEmoji(item.id, item.hindi, item.id)}
                      title={`${item.name} (${item.hindi}): ${item.desc}`}
                    >
                      <div className="special-card-icon-halo">
                        <span className="special-card-icon">{item.icon}</span>
                      </div>
                      <div className="special-card-text">
                        <div className="special-card-badge-row">
                          <span className="special-card-badge">{item.badge}</span>
                        </div>
                        <span className="special-card-hindi">{item.hindi}</span>
                        <span className="special-card-desc">{item.desc}</span>
                      </div>
                      <div className="special-card-pulse-shine" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. POPULAR STANDARD EMOJIS */}
            {activeTab === 'emoji' && (
              <div className="standard-emojis-grid">
                {STANDARD_EMOJIS.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    className="standard-emoji-btn"
                    onClick={() => onSelectEmoji(item.emoji, item.name, 'standard')}
                    title={item.name}
                  >
                    <span className="standard-emoji-char">{item.emoji}</span>
                    <span className="standard-emoji-name">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* 3. QUICK BANTER CHATS */}
            {activeTab === 'chat' && (
              <div className="quick-chats-list">
                {QUICK_CHATS.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    className="quick-chat-item-btn"
                    onClick={() => onSelectEmoji(item.text, item.text, 'text')}
                  >
                    <span className="quick-chat-bubble-icon">💬</span>
                    <span className="quick-chat-text">{item.text}</span>
                    <span className="quick-chat-tag">{item.tag}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
