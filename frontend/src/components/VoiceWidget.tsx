import React, { useState, useEffect } from 'react';
import { voiceService } from '../services/voice';
import type { LocalVoiceState } from '../services/voice';
import type { User, RoomPlayer } from '../types';
import { Mic, MicOff, Volume2, VolumeX, Radio, AlertCircle } from 'lucide-react';

interface VoiceWidgetProps {
  roomCode: string;
  currentUser: User;
  roomPlayers: RoomPlayer[];
}

export const VoiceWidget: React.FC<VoiceWidgetProps> = ({
  roomCode,
  currentUser,
  roomPlayers,
}) => {
  const [localVoice, setLocalVoice] = useState<LocalVoiceState>(voiceService.getLocalState());
  const [isPttPressed, setIsPttPressed] = useState(false);

  // Subscribe to VoiceService updates
  useEffect(() => {
    const unsubscribe = voiceService.subscribe((localState) => {
      setLocalVoice(localState);
    });

    // Auto-join voice when entering room
    const peerIds = roomPlayers.map((p) => p.userId).filter((id) => id && id !== currentUser.id);
    voiceService.joinVoice(roomCode, currentUser.id, peerIds);

    return () => {
      unsubscribe();
    };
  }, [roomCode, currentUser.id]);

  // Handle Push-To-Talk spacebar key bindings when PTT is enabled
  useEffect(() => {
    if (!localVoice.pushToTalk || !localVoice.isConnected) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsPttPressed(true);
        voiceService.setPushToTalkActive(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPttPressed(false);
        voiceService.setPushToTalkActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [localVoice.pushToTalk, localVoice.isConnected]);

  const handleToggleMic = () => {
    if (!localVoice.isConnected) {
      const peerIds = roomPlayers.map((p) => p.userId).filter((id) => id !== currentUser.id);
      voiceService.joinVoice(roomCode, currentUser.id, peerIds);
    } else {
      voiceService.toggleMute();
    }
  };

  const handleToggleDeafen = () => {
    voiceService.toggleDeafen();
  };

  const handleTogglePtt = () => {
    voiceService.togglePushToTalk();
  };

  return (
    <div className="pubg-voice-widget">
      {/* Mic permission prompt / error banner if denied */}
      {localVoice.hasPermission === false && (
        <div className="pubg-voice-denied-badge" title="Microphone permission was denied. Click to retry.">
          <AlertCircle size={13} />
          <span>Mic Blocked</span>
        </div>
      )}

      {/* PUBG-Style Voice Pill HUD */}
      <div className={`pubg-voice-pill ${localVoice.isSpeaking ? 'voice-pill-speaking' : ''}`}>
        {/* Mic Button */}
        <button
          className={`pubg-voice-btn ${
            localVoice.isMuted || !localVoice.isConnected ? 'btn-voice-muted' : 'btn-voice-active'
          } ${localVoice.isSpeaking ? 'btn-voice-speaking' : ''}`}
          onClick={handleToggleMic}
          title={
            localVoice.isMuted
              ? 'Mic Muted (Click to Unmute)'
              : localVoice.isSpeaking
              ? 'Speaking... (Live)'
              : 'Mic Active (Click to Mute)'
          }
        >
          {localVoice.isMuted || !localVoice.isConnected ? <MicOff size={15} /> : <Mic size={15} />}
          <span className="pubg-voice-label">
            {localVoice.isMuted ? 'MUTE' : localVoice.isSpeaking ? 'TALKING' : 'MIC'}
          </span>
          {localVoice.isSpeaking && (
            <span className="pubg-speaking-waves">
              <span className="wave-bar bar-1"></span>
              <span className="wave-bar bar-2"></span>
              <span className="wave-bar bar-3"></span>
            </span>
          )}
        </button>

        {/* Speaker / Deafen Button */}
        <button
          className={`pubg-voice-btn ${
            localVoice.isDeafened ? 'btn-voice-muted' : 'btn-voice-normal'
          }`}
          onClick={handleToggleDeafen}
          title={localVoice.isDeafened ? 'Deafened (Audio Off)' : 'Headset Active (Click to Deafen)'}
        >
          {localVoice.isDeafened ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span className="pubg-voice-label">
            {localVoice.isDeafened ? 'DEAF' : 'AUDIO'}
          </span>
        </button>

        {/* Push-to-Talk Toggle */}
        <button
          className={`pubg-voice-btn ptt-toggle-btn ${localVoice.pushToTalk ? 'ptt-enabled' : ''}`}
          onClick={handleTogglePtt}
          title={localVoice.pushToTalk ? 'Push-To-Talk ON (Hold Space or button to talk)' : 'Open Mic (Click to switch to Push-To-Talk)'}
        >
          <Radio size={14} />
          <span className="pubg-voice-label">{localVoice.pushToTalk ? 'PTT' : 'OPEN'}</span>
        </button>
      </div>

      {/* Push-to-talk Hold Button (for Mobile or Touch) */}
      {localVoice.pushToTalk && localVoice.isConnected && (
        <button
          className={`pubg-ptt-hold-button ${isPttPressed ? 'ptt-is-holding' : ''}`}
          onMouseDown={() => {
            setIsPttPressed(true);
            voiceService.setPushToTalkActive(true);
          }}
          onMouseUp={() => {
            setIsPttPressed(false);
            voiceService.setPushToTalkActive(false);
          }}
          onTouchStart={() => {
            setIsPttPressed(true);
            voiceService.setPushToTalkActive(true);
          }}
          onTouchEnd={() => {
            setIsPttPressed(false);
            voiceService.setPushToTalkActive(false);
          }}
        >
          <Mic size={14} />
          <span>{isPttPressed ? 'TALKING (RELEASE TO MUTE)' : 'HOLD TO TALK'}</span>
        </button>
      )}
    </div>
  );
};
