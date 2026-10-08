import { socketService } from './socket';

export interface VoicePeerStatus {
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

export interface LocalVoiceState {
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  hasPermission: boolean | null; // null = untouched, true = allowed, false = denied
  pushToTalk: boolean;
  activeRoomCode: string | null;
}

type VoiceStateListener = (localState: LocalVoiceState, peerStates: Record<string, VoicePeerStatus>) => void;

class VoiceService {
  private localStream: MediaStream | null = null;
  private peerConnections: Map<string, RTCPeerConnection> = new Map();
  private remoteAudios: Map<string, HTMLAudioElement> = new Map();
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  
  private currentUserId: string = '';
  private roomCode: string | null = null;
  
  private localState: LocalVoiceState = {
    isConnected: false,
    isMuted: false,
    isDeafened: false,
    isSpeaking: false,
    hasPermission: null,
    pushToTalk: false,
    activeRoomCode: null,
  };

  private peerStates: Record<string, VoicePeerStatus> = {};
  private listeners: Set<VoiceStateListener> = new Set();

  private iceServers: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  private socketUnsubscribers: (() => void)[] = [];
  private lastSpeakingState: boolean = false;
  private speakingDebounceTimer: any = null;

  constructor() {
    this.setupSocketListeners();
  }

  public init(userId: string) {
    this.currentUserId = userId;
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.localState, this.peerStates);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.localState }, { ...this.peerStates }));
  }

  private setupSocketListeners() {
    // Voice offer received from peer
    this.socketUnsubscribers.push(
      socketService.on('voice_offer', async (data: any) => {
        if (!this.localState.isConnected || data.fromUserId === this.currentUserId) return;
        await this.handleOffer(data.fromUserId, data.sdp);
      })
    );

    // Voice answer received from peer
    this.socketUnsubscribers.push(
      socketService.on('voice_answer', async (data: any) => {
        if (!this.localState.isConnected || data.fromUserId === this.currentUserId) return;
        await this.handleAnswer(data.fromUserId, data.sdp);
      })
    );

    // ICE candidate received
    this.socketUnsubscribers.push(
      socketService.on('voice_candidate', async (data: any) => {
        if (!this.localState.isConnected || data.fromUserId === this.currentUserId) return;
        await this.handleCandidate(data.fromUserId, data.candidate);
      })
    );

    // Peer status update (speaking/mute)
    this.socketUnsubscribers.push(
      socketService.on('voice_status', (data: any) => {
        if (!data.userId || data.userId === this.currentUserId) return;
        this.peerStates[data.userId] = {
          isMuted: !!data.isMuted,
          isDeafened: !!data.isDeafened,
          isSpeaking: !!data.isSpeaking,
        };
        this.notify();
      })
    );

    // New peer joined voice channel
    this.socketUnsubscribers.push(
      socketService.on('voice_join', async (data: any) => {
        if (!this.localState.isConnected || !data.userId || data.userId === this.currentUserId) return;
        // As an existing member, initiate RTC offer to the newly joined peer
        await this.initiateCallToPeer(data.userId);
      })
    );

    // Peer left voice channel
    this.socketUnsubscribers.push(
      socketService.on('voice_leave', (data: any) => {
        if (!data.userId) return;
        this.removePeer(data.userId);
      })
    );
  }

  public async joinVoice(roomCode: string, currentUserId: string, knownPeerIds: string[] = []) {
    if (this.localState.isConnected && this.roomCode === roomCode) {
      return;
    }

    this.currentUserId = currentUserId;
    this.roomCode = roomCode;

    try {
      // Request mic stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      this.localStream = stream;
      this.localState.hasPermission = true;
      this.localState.isConnected = true;
      this.localState.activeRoomCode = roomCode;
      this.setupAudioAnalyzer(stream);

      // Notify backend that we joined voice
      socketService.send({
        type: 'voice_join',
        roomCode,
      });

      // Send initial status
      this.broadcastLocalStatus();

      // Initiate connection to any known peers already in room
      for (const peerId of knownPeerIds) {
        if (peerId && peerId !== this.currentUserId) {
          await this.initiateCallToPeer(peerId);
        }
      }

      this.notify();
    } catch (err: any) {
      console.warn('[VoiceService] Could not access microphone:', err);
      this.localState.hasPermission = false;
      this.localState.isConnected = false;
      this.notify();
    }
  }

  public leaveVoice() {
    if (!this.localState.isConnected && !this.roomCode) return;

    if (this.roomCode) {
      socketService.send({
        type: 'voice_leave',
        roomCode: this.roomCode,
      });
    }

    // Stop local mic tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
      this.localStream = null;
    }

    // Close all peer connections
    this.peerConnections.forEach((pc) => pc.close());
    this.peerConnections.clear();

    // Clean up audio elements
    this.remoteAudios.forEach((audio) => {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
    });
    this.remoteAudios.clear();

    // Close AudioContext
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }

    this.roomCode = null;
    this.peerStates = {};
    this.localState.isConnected = false;
    this.localState.isSpeaking = false;
    this.localState.activeRoomCode = null;
    this.notify();
  }

  public toggleMute(): boolean {
    this.localState.isMuted = !this.localState.isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.localState.isMuted;
      });
    }
    if (this.localState.isMuted) {
      this.setSpeaking(false);
    }
    this.broadcastLocalStatus();
    this.notify();
    return this.localState.isMuted;
  }

  public toggleDeafen(): boolean {
    this.localState.isDeafened = !this.localState.isDeafened;
    
    // Deafening also mutes you (PUBG/Discord standard)
    if (this.localState.isDeafened) {
      this.localState.isMuted = true;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
      this.setSpeaking(false);
    }

    // Mute/unmute remote audios
    this.remoteAudios.forEach((audio) => {
      audio.muted = this.localState.isDeafened;
    });

    this.broadcastLocalStatus();
    this.notify();
    return this.localState.isDeafened;
  }

  public togglePushToTalk(): boolean {
    this.localState.pushToTalk = !this.localState.pushToTalk;
    if (this.localState.pushToTalk) {
      // Default to muted until PTT button pressed
      this.localState.isMuted = true;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => (t.enabled = false));
      }
    } else {
      this.localState.isMuted = false;
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach((t) => (t.enabled = true));
      }
    }
    this.broadcastLocalStatus();
    this.notify();
    return this.localState.pushToTalk;
  }

  public setPushToTalkActive(active: boolean) {
    if (!this.localState.pushToTalk) return;
    this.localState.isMuted = !active;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((t) => (t.enabled = active));
    }
    this.broadcastLocalStatus();
    this.notify();
  }

  private broadcastLocalStatus() {
    if (!this.roomCode) return;
    socketService.send({
      type: 'voice_status',
      roomCode: this.roomCode,
      isMuted: this.localState.isMuted,
      isDeafened: this.localState.isDeafened,
      isSpeaking: this.localState.isSpeaking,
    });
  }

  private setupAudioAnalyzer(stream: MediaStream) {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser || !this.localState.isConnected) return;
        this.analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for speaking detection
        const isSpeakingNow = average > 18 && !this.localState.isMuted && !this.localState.isDeafened;
        
        if (isSpeakingNow !== this.lastSpeakingState) {
          this.lastSpeakingState = isSpeakingNow;
          clearTimeout(this.speakingDebounceTimer);
          
          if (isSpeakingNow) {
            this.setSpeaking(true);
          } else {
            // Keep green halo for 350ms after speech ends for natural smooth visual
            this.speakingDebounceTimer = setTimeout(() => {
              this.setSpeaking(false);
            }, 350);
          }
        }

        this.animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('[VoiceService] Audio analyzer setup failed:', e);
    }
  }

  private setSpeaking(speaking: boolean) {
    if (this.localState.isSpeaking === speaking) return;
    this.localState.isSpeaking = speaking;
    this.broadcastLocalStatus();
    this.notify();
  }

  private createPeerConnection(targetUserId: string): RTCPeerConnection {
    const pc = new RTCPeerConnection(this.iceServers);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && this.roomCode) {
        socketService.send({
          type: 'voice_candidate',
          targetUserId,
          roomCode: this.roomCode,
          candidate: event.candidate,
        });
      }
    };

    // Remote track handler
    pc.ontrack = (event) => {
      let audio = this.remoteAudios.get(targetUserId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.muted = this.localState.isDeafened;
        audio.style.display = 'none';
        document.body.appendChild(audio);
        this.remoteAudios.set(targetUserId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch((e) => console.warn('[VoiceService] Auto-play prevented:', e));
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeer(targetUserId);
      }
    };

    this.peerConnections.set(targetUserId, pc);
    return pc;
  }

  private async initiateCallToPeer(targetUserId: string) {
    if (this.peerConnections.has(targetUserId)) return;
    try {
      const pc = this.createPeerConnection(targetUserId);
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });
      await pc.setLocalDescription(offer);

      socketService.send({
        type: 'voice_offer',
        targetUserId,
        roomCode: this.roomCode,
        sdp: offer,
      });
    } catch (err) {
      console.error(`[VoiceService] Failed to initiate call to ${targetUserId}:`, err);
    }
  }

  private async handleOffer(fromUserId: string, sdp: RTCSessionDescriptionInit) {
    try {
      let pc = this.peerConnections.get(fromUserId);
      if (!pc) {
        pc = this.createPeerConnection(fromUserId);
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.send({
        type: 'voice_answer',
        targetUserId: fromUserId,
        roomCode: this.roomCode,
        sdp: answer,
      });
    } catch (err) {
      console.error(`[VoiceService] Failed to handle offer from ${fromUserId}:`, err);
    }
  }

  private async handleAnswer(fromUserId: string, sdp: RTCSessionDescriptionInit) {
    try {
      const pc = this.peerConnections.get(fromUserId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      }
    } catch (err) {
      console.error(`[VoiceService] Failed to handle answer from ${fromUserId}:`, err);
    }
  }

  private async handleCandidate(fromUserId: string, candidate: RTCIceCandidateInit) {
    try {
      const pc = this.peerConnections.get(fromUserId);
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error(`[VoiceService] Failed to add candidate from ${fromUserId}:`, err);
    }
  }

  private removePeer(userId: string) {
    const pc = this.peerConnections.get(userId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(userId);
    }
    const audio = this.remoteAudios.get(userId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
      this.remoteAudios.delete(userId);
    }
    delete this.peerStates[userId];
    this.notify();
  }

  public getPeerStatus(userId: string): VoicePeerStatus {
    return this.peerStates[userId] || { isMuted: false, isDeafened: false, isSpeaking: false };
  }

  public getLocalState(): LocalVoiceState {
    return this.localState;
  }
}

export const voiceService = new VoiceService();
