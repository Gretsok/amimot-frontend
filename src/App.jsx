import { useContext } from 'react';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider, GameContext } from './contexts/GameContext';
import { ErrorPopupProvider } from './components/ErrorPopup/ErrorPopupContext';
import ErrorPopup from './components/ErrorPopup/ErrorPopup';
import HomeScreen from './screens/Home/HomeScreen';
import LobbyScreen from './screens/Lobby/LobbyScreen';
import GameScreen from './screens/Game/GameScreen';

// L'écran affiché est entièrement dérivé de l'état room/gameState : pas de
// routeur nécessaire pour ce squelette (Accueil -> Lobby -> Jeu -> Lobby...).
function Screen() {
  const { room, gameState } = useContext(GameContext);
  if (!room) return <HomeScreen />;
  if (!gameState) return <LobbyScreen />;
  return <GameScreen />;
}

function AppShell() {
  const { resetLocalState } = useContext(GameContext);
  return (
    <ErrorPopupProvider onBackToMenu={resetLocalState}>
      <Screen />
      <ErrorPopup />
    </ErrorPopupProvider>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <AuthProvider>
        <GameProvider>
          <AppShell />
        </GameProvider>
      </AuthProvider>
    </SocketProvider>
  );
}
