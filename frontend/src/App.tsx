import React, { useState, useEffect, useRef } from 'react';
import { api, getStoredToken } from './services/api';
import { socketService } from './services/socket';
import { voiceService } from './services/voice';
import { sound } from './utils/audio';
import type { User, Room, RoomPlayer, GameStateView } from './types';

// Components
import { Lobby } from './components/Lobby';
import { WaitingRoom } from './components/WaitingRoom';
import { GameTable } from './components/GameTable';
import { TrumpModal } from './components/TrumpModal';
import { GameOverModal } from './components/GameOverModal';
import { FriendsDrawer } from './components/FriendsDrawer';
import { AuthModal } from './components/AuthModal';

import { Users, LogOut, Volume2, VolumeX, AlertCircle } from 'lucide-react';

const INITIAL_GAME_STATE: GameStateView = {
  phase: 'WAITING',
  hand: [],
  currentTurnUserId: null,
  trickNumber: 1,
  currentTrick: [],
  leadSuit: null,
  trumpOpened: false,
  trumpSuit: null,
  hiddenTrumpCard: null,
  dealerUserId: null,
  dealerSeat: null,
  raangiSeat: null,
  raangiUserId: null,
  teamAScore: 0,
  teamBScore: 0,
  teamATricks: 0,
  teamBTricks: 0,
  teamAMindis: 0,
  teamBMindis: 0,
  seats: [],
};

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [roomPlayers, setRoomPlayers] = useState<RoomPlayer[]>([]);
  const [gameState, setGameState] = useState<GameStateView>(INITIAL_GAME_STATE);
  const [lastTrickWinner, setLastTrickWinner] = useState<string | null>(null);

  // Refs to avoid stale closures in WebSocket event handlers
  const currentUserRef = useRef<User | null>(null);
  const currentRoomRef = useRef<Room | null>(null);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    currentRoomRef.current = currentRoom;
  }, [currentRoom]);

  // Modals & Panels
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showTrumpModal, setShowTrumpModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [showFriendsDrawer, setShowFriendsDrawer] = useState<boolean>(false);
  const [gameOverData, setGameOverData] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [invitationToast, setInvitationToast] = useState<{ fromUsername: string; roomCode: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const normalizePlayers = (rawPlayers: any[]): RoomPlayer[] => {
    return rawPlayers.map((p) => ({
      userId: p.userId,
      username: p.user?.username || p.username || 'Player',
      seat: p.seat,
      isReady: p.isReady,
      isOnline: p.user?.isOnline ?? p.isOnline ?? true,
    }));
  };

  const handleRoomJoined = async (roomCode: string, initialRoom?: Room) => {
    if (initialRoom) {
      setCurrentRoom(initialRoom);
      const normalized = normalizePlayers(initialRoom.players || []);
      if (normalized.length > 0) {
        setRoomPlayers(normalized);
      }
      setGameState((prev) => ({
        ...prev,
        phase: initialRoom.status === 'PLAYING' ? 'PLAYING' : 'WAITING',
      }));
    }

    try {
      const res = await api.getRoom(roomCode);
      if (res.success && res.room) {
        setCurrentRoom(res.room);
        setRoomPlayers(normalizePlayers(res.room.players || []));
        setGameState((prev) => ({
          ...prev,
          phase: res.room.status === 'PLAYING' ? 'PLAYING' : 'WAITING',
        }));
      }
    } catch (e) {
      console.error('Failed to load room details', e);
    }
  };

  // Check initial authentication and auto-rejoin
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      socketService.connect().then(() => {
        socketService.authenticate(token);
      });
      api.getMe().then((res: any) => {
        if (res.success && res.user) {
          setCurrentUser(res.user);
          if (res.currentRoomCode) {
            handleRoomJoined(res.currentRoomCode);
            socketService.joinRoom(res.currentRoomCode);
          }
        } else {
          setShowAuthModal(true);
        }
      });
    } else {
      setShowAuthModal(true);
    }
  }, []);

  // WebSocket message subscriptions (Runs ONCE on mount)
  useEffect(() => {
    const unsubJoinedRoom = (data: any) => {
      console.log('[App] joined_room', data);
      const normalized = data.players ? normalizePlayers(data.players) : [];
      setCurrentRoom((prev) => ({
        id: data.roomCode,
        roomCode: data.roomCode,
        hostId: data.hostId,
        status: data.status,
        players: normalized.length > 0 ? normalized : prev?.players || [],
      }));
      if (normalized.length > 0) {
        setRoomPlayers(normalized);
      }
      if (data.status === 'PLAYING') {
        setGameState((prev) => ({
          ...prev,
          phase: prev.phase === 'WAITING' ? 'PLAYING' : prev.phase,
        }));
      }
    };

    const unsubPlayerJoined = (data: any) => {
      console.log('[App] player_joined', data);
      setRoomPlayers((prev) => {
        const exists = prev.some((p) => p.userId === data.userId);
        if (exists) {
          return prev.map((p) => (p.userId === data.userId ? { ...p, ...data } : p));
        }
        return [
          ...prev,
          {
            userId: data.userId,
            username: data.username || 'Player',
            seat: data.seat,
            isReady: !!data.isReady,
            isOnline: data.isOnline ?? true,
          },
        ].sort((a, b) => a.seat - b.seat);
      });

      const code = data.roomCode || currentRoomRef.current?.roomCode;
      if (code) {
        api.getRoom(code).then((res) => {
          if (res.success && res.room) {
            setRoomPlayers(normalizePlayers(res.room.players || []));
          }
        });
      }
    };

    const unsubPlayerLeft = (data: any) => {
      setRoomPlayers((prev) => prev.filter((p) => p.userId !== data.userId));
    };

    const unsubPlayerReady = (data: any) => {
      setRoomPlayers((prev) =>
        prev.map((p) => (p.userId === data.userId ? { ...p, isReady: data.isReady } : p))
      );
    };

    const unsubReadyToggled = (data: any) => {
      const myId = currentUserRef.current?.id;
      if (myId) {
        setRoomPlayers((prev) =>
          prev.map((p) => (p.userId === myId ? { ...p, isReady: data.isReady } : p))
        );
      }
    };

    const unsubHostChanged = (data: any) => {
      setCurrentRoom((prev) => (prev ? { ...prev, hostId: data.hostId } : null));
    };

    const unsubGameStarted = (data: any) => {
      sound.playCardDeal();
      setShowGameOverModal(false);
      setGameOverData(null);
      setLastTrickWinner(null);
      setCurrentRoom((prev) => (prev ? { ...prev, status: 'PLAYING' } : null));
      setGameState((prev) => ({
        ...prev,
        phase: 'CHOOSING_TRUMP',
        hand: [],
        currentTrick: [],
        leadSuit: null,
        trumpOpened: false,
        trumpSuit: null,
        hiddenTrumpCard: null,
        trickNumber: 1,
        teamATricks: 0,
        teamBTricks: 0,
        teamAMindis: 0,
        teamBMindis: 0,
        dealerUserId: data.dealerUserId,
        dealerSeat: data.dealerSeat,
        raangiSeat: data.raangiSeat,
        raangiUserId: data.raangiUserId,
        seats: data.seats || [],
      }));
      if (data.roundNumber && data.roundNumber > 1) {
        showToast(`Round ${data.roundNumber} started!`);
      }
    };

    const unsubReturnedToLobby = (data: any) => {
      console.log('[App] returned_to_lobby', data);
      setShowGameOverModal(false);
      setGameOverData(null);
      setLastTrickWinner(null);
      setGameState(INITIAL_GAME_STATE);
      setCurrentRoom((prev) => (prev ? { ...prev, status: 'WAITING' } : null));
      const code = data.roomCode || currentRoomRef.current?.roomCode;
      if (code) {
        api.getRoom(code).then((res) => {
          if (res.success && res.room) {
            setRoomPlayers(normalizePlayers(res.room.players || []));
          }
        });
      }
      showToast('Returned to room lobby');
    };

    const unsubCardsDealt = (data: any) => {
      sound.playCardDeal();
      setGameState((prev) => ({
        ...prev,
        hand: data.hand || [],
      }));
    };

    const unsubChooseTrumpRequest = (data: any) => {
      console.log('[App] choose_trump_request', data);
      if (data.hand && data.hand.length > 0) {
        setGameState((prev) => ({ ...prev, hand: data.hand }));
      }
      setShowTrumpModal(true);
    };

    const unsubTrumpChosen = (data: any) => {
      console.log('[App] trump_chosen', data);
      setShowTrumpModal(false);
      setGameState((prev) => ({ ...prev, phase: 'PLAYING' }));
      showToast('Trump has been chosen and hidden by Raangi!');
    };

    const unsubTurnChanged = (data: any) => {
      console.log('[App] turn_changed', data);
      setLastTrickWinner(null);
      setGameState((prev) => ({
        ...prev,
        phase: 'PLAYING',
        currentTurnUserId: data.currentTurnUserId,
        currentTrick: data.currentTrick !== undefined ? data.currentTrick : prev.currentTrick,
        leadSuit: data.leadSuit !== undefined ? data.leadSuit : prev.leadSuit,
        trickNumber: data.trickNumber !== undefined ? data.trickNumber : prev.trickNumber,
      }));
    };

    const unsubTrumpOpened = (data: any) => {
      sound.playTrumpOpened();
      setGameState((prev) => ({
        ...prev,
        trumpOpened: true,
        trumpSuit: data.trumpSuit,
        hiddenTrumpCard: data.hiddenTrumpCard,
        trumpOpenerUserId: data.openedByUserId,
      }));
      showToast(`⚡ Rang revealed! Rang is ${data.trumpSuit}!`);
    };

    const unsubCardPlayed = (data: any) => {
      const traatVol = typeof data.traatVolume === 'number' ? data.traatVolume : 50;
      sound.playTraatCardPlay(traatVol);
      setGameState((prev) => {
        const isMyCard = data.userId === currentUserRef.current?.id;
        const newHand = isMyCard ? prev.hand.filter((c) => c !== data.card) : prev.hand;
        const updatedTrick = data.currentTrick || [...prev.currentTrick, { userId: data.userId, card: data.card }];
        const updatedLeadSuit = data.leadSuit !== undefined ? data.leadSuit : (prev.currentTrick.length === 0 ? data.card.slice(-1) : prev.leadSuit);

        return {
          ...prev,
          hand: newHand,
          leadSuit: updatedLeadSuit,
          currentTrick: updatedTrick,
          trickNumber: data.trickNumber !== undefined ? data.trickNumber : prev.trickNumber,
          trumpOpenerUserId: prev.trumpOpenerUserId === data.userId ? null : prev.trumpOpenerUserId,
        };
      });
    };

    const unsubTrickFinished = (data: any) => {
      setLastTrickWinner(data.winnerUserId);
      setGameState((prev) => ({
        ...prev,
        trumpOpenerUserId: null,
      }));
      if (data.winnerUserId === currentUserRef.current?.id) {
        showToast('🏆 You won this trick!');
      } else {
        const p = roomPlayers.find((player) => player.userId === data.winnerUserId);
        showToast(`Trick won by ${p?.username || 'Player'}!`);
      }
    };

    const unsubScoreUpdated = (data: any) => {
      setGameState((prev) => ({
        ...prev,
        teamAScore: data.teamAScore,
        teamBScore: data.teamBScore,
        teamATricks: data.teamATricks,
        teamBTricks: data.teamBTricks,
        teamAMindis: data.teamAMindis,
        teamBMindis: data.teamBMindis,
      }));
    };

    const unsubGameOver = (data: any) => {
      setGameOverData(data);
      setShowGameOverModal(true);
      setGameState((prev) => ({ ...prev, phase: 'FINISHED' }));
    };

    const unsubGameSync = (data: any) => {
      setGameState({
        phase: data.phase || 'PLAYING',
        hand: data.hand || [],
        currentTurnUserId: data.currentTurnUserId,
        trickNumber: data.trickNumber || 1,
        currentTrick: data.currentTrick || [],
        leadSuit: data.leadSuit,
        trumpOpened: data.trumpOpened,
        trumpSuit: data.trumpSuit,
        hiddenTrumpCard: data.hiddenTrumpCard,
        dealerUserId: data.dealerUserId,
        dealerSeat: null,
        raangiSeat: null,
        raangiUserId: data.raangiUserId,
        teamAScore: data.teamAScore || 0,
        teamBScore: data.teamBScore || 0,
        teamATricks: data.teamATricks || 0,
        teamBTricks: data.teamBTricks || 0,
        teamAMindis: data.teamAMindis || 0,
        teamBMindis: data.teamBMindis || 0,
        seats: data.seats || [],
      });
    };

    const unsubGameCancelled = (data: any) => {
      showToast(`Game ended: ${data.reason || 'A player disconnected'}`);
      handleLeaveRoom();
    };

    const unsubInvitation = (data: any) => {
      setInvitationToast({
        fromUsername: data.fromUsername,
        roomCode: data.roomCode,
      });
      setTimeout(() => setInvitationToast(null), 8000);
    };

    const unsubError = (data: any) => {
      console.warn('[WS] Error from server:', data.message);
      showToast(data.message || 'Action failed');
    };

    const offJoinedRoom = socketService.on('joined_room', unsubJoinedRoom);
    const offPlayerJoined = socketService.on('player_joined', unsubPlayerJoined);
    const offPlayerLeft = socketService.on('player_left', unsubPlayerLeft);
    const offPlayerReady = socketService.on('player_ready', unsubPlayerReady);
    const offReadyToggled = socketService.on('ready_toggled', unsubReadyToggled);
    const offHostChanged = socketService.on('host_changed', unsubHostChanged);
    const offGameStarted = socketService.on('game_started', unsubGameStarted);
    const offReturnedToLobby = socketService.on('returned_to_lobby', unsubReturnedToLobby);
    const offCardsDealt = socketService.on('cards_dealt', unsubCardsDealt);
    const offChooseTrump = socketService.on('choose_trump_request', unsubChooseTrumpRequest);
    const offTrumpChosen = socketService.on('trump_chosen', unsubTrumpChosen);
    const offTurnChanged = socketService.on('turn_changed', unsubTurnChanged);
    const offTrumpOpened = socketService.on('trump_opened', unsubTrumpOpened);
    const offCardPlayed = socketService.on('card_played', unsubCardPlayed);
    const offTrickFinished = socketService.on('trick_finished', unsubTrickFinished);
    const offScoreUpdated = socketService.on('score_updated', unsubScoreUpdated);
    const offGameOver = socketService.on('game_over', unsubGameOver);
    const offGameSync = socketService.on('game_sync', unsubGameSync);
    const offGameCancelled = socketService.on('game_cancelled', unsubGameCancelled);
    const offInvitation = socketService.on('room_invitation', unsubInvitation);
    const offError = socketService.on('error', unsubError);

    return () => {
      offJoinedRoom();
      offPlayerJoined();
      offPlayerLeft();
      offPlayerReady();
      offReadyToggled();
      offHostChanged();
      offGameStarted();
      offReturnedToLobby();
      offCardsDealt();
      offChooseTrump();
      offTrumpChosen();
      offTurnChanged();
      offTrumpOpened();
      offCardPlayed();
      offTrickFinished();
      offScoreUpdated();
      offGameOver();
      offGameSync();
      offGameCancelled();
      offInvitation();
      offError();
    };
  }, [roomPlayers]);

  const handleOptimisticToggleReady = () => {
    const myId = currentUserRef.current?.id;
    if (myId) {
      setRoomPlayers((prev) =>
        prev.map((p) => (p.userId === myId ? { ...p, isReady: !p.isReady } : p))
      );
    }
  };

  const handleLeaveRoom = async () => {
    voiceService.leaveVoice();
    const roomCode = currentRoomRef.current?.roomCode;
    if (roomCode) {
      await api.leaveRoom();
      socketService.leaveRoom(roomCode);
    }
    setCurrentRoom(null);
    setRoomPlayers([]);
    setGameState(INITIAL_GAME_STATE);
    setShowGameOverModal(false);
  };

  const handleLogout = async () => {
    voiceService.leaveVoice();
    await api.logout();
    socketService.disconnect();
    setCurrentUser(null);
    setCurrentRoom(null);
    setShowAuthModal(true);
  };

  const toggleSound = () => {
    const newState = sound.toggleSound();
    setSoundEnabled(newState);
  };

  const myPlayer = roomPlayers.find((p) => p.userId === currentUser?.id);

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="top-navbar">
        <div className="logo-group">
          <span className="logo-icon">🂡</span>
          <span className="logo-text">TAASH</span>
          <span className="logo-badge">DEHLA</span>
        </div>

        <div className="nav-actions">
          {/* Sound Toggle */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Friends Drawer Button */}
          {currentUser && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowFriendsDrawer(true)}
              title="Friends & Social"
            >
              <Users size={16} /> <span className="nav-btn-text">Friends</span>
            </button>
          )}

          {/* Profile Badge */}
          {currentUser && (
            <div className="user-profile-badge">
              <div className="user-avatar-circle">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <span className="user-name-label">{currentUser.username}</span>
              <div className="status-dot-online" title="Online" />
            </div>
          )}

          {/* Logout */}
          {currentUser && (
            <button className="btn btn-danger btn-sm" onClick={handleLogout} title="Log Out">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </header>

      {/* Global Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            borderRadius: '12px',
            padding: '12px 24px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontWeight: 700,
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Invitation Toast */}
      {invitationToast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            right: '24px',
            background: 'var(--bg-surface)',
            border: '2px solid var(--accent-gold)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '2px' }}>
              🎮 Game Invitation
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              <strong>{invitationToast.fromUsername}</strong> invited you to room{' '}
              <strong style={{ color: 'var(--accent-gold)' }}>{invitationToast.roomCode}</strong>
            </div>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              handleRoomJoined(invitationToast.roomCode);
              socketService.joinRoom(invitationToast.roomCode);
              setInvitationToast(null);
            }}
          >
            Accept
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {currentUser && !currentRoom && (
          <Lobby
            onRoomJoined={handleRoomJoined}
            onOpenFriends={() => setShowFriendsDrawer(true)}
          />
        )}

        {currentUser && currentRoom && gameState.phase === 'WAITING' && (
          <WaitingRoom
            room={currentRoom}
            players={roomPlayers}
            currentUser={currentUser}
            onLeave={handleLeaveRoom}
            onOpenFriends={() => setShowFriendsDrawer(true)}
            onToggleReady={handleOptimisticToggleReady}
          />
        )}

        {currentUser && currentRoom && gameState.phase !== 'WAITING' && (
          <GameTable
            gameState={gameState}
            currentUser={currentUser}
            roomPlayers={roomPlayers}
            lastTrickWinner={lastTrickWinner}
            onOpenTrump={() => socketService.openTrump()}
            roomCode={currentRoom.roomCode}
            onLeaveRoom={handleLeaveRoom}
            onInviteFriends={() => setShowFriendsDrawer(true)}
          />
        )}
      </main>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          onSuccess={(user) => {
            setCurrentUser(user);
            setShowAuthModal(false);
          }}
        />
      )}

      {showTrumpModal && (
        <TrumpModal
          hand={gameState.hand.slice(0, 5)}
          onChosen={() => setShowTrumpModal(false)}
        />
      )}

      {showGameOverModal && gameOverData && (
        <GameOverModal
          winnerTeam={gameOverData.winnerTeam}
          teamAMindis={gameOverData.teamAMindis}
          teamBMindis={gameOverData.teamBMindis}
          teamATricks={gameOverData.teamATricks}
          teamBTricks={gameOverData.teamBTricks}
          roundNumber={gameOverData.roundNumber}
          mySeat={myPlayer?.seat || null}
          onReturnToLobby={() => {
            const code = currentRoom?.roomCode;
            if (code) {
              socketService.returnToLobby(code);
            }
          }}
          onNextRound={() => {
            const code = currentRoom?.roomCode;
            if (code) {
              socketService.nextRound(code);
            }
          }}
        />
      )}

      <FriendsDrawer
        isOpen={showFriendsDrawer}
        onClose={() => setShowFriendsDrawer(false)}
        currentRoomCode={currentRoom?.roomCode}
      />
    </div>
  );
};

export default App;
