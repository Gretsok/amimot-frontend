import { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { GameProvider, GameContext } from './contexts/GameContext';
import { ErrorPopupProvider } from './components/ErrorPopup/ErrorPopupContext';
import ErrorPopup from './components/ErrorPopup/ErrorPopup';
import ErrorToasts from './components/ErrorPopup/ErrorToasts';
import HomeScreen from './screens/Home/HomeScreen';
import LobbyScreen from './screens/Lobby/LobbyScreen';
import GameScreen from './screens/Game/GameScreen';
import AccountScreen from './screens/Account/AccountScreen';
import ForgotPasswordScreen from './screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/Auth/ResetPasswordScreen';
import PrivacyPolicy from './screens/Legal/PrivacyPolicy';
import LegalNotice from './screens/Legal/LegalNotice';
import { useAuth } from './hooks/useAuth';

// L'écran de jeu reste dérivé de l'état room/gameState : passer de l'accueil au
// lobby puis à la partie n'est pas une navigation, c'est une conséquence de
// l'état serveur (et une URL de partie n'aurait aucun sens à recharger).
function PlayRoute() {
  const { room, gameState } = useContext(GameContext);
  if (!room) return <HomeScreen />;
  if (!gameState) return <LobbyScreen />;
  return <GameScreen />;
}

// Le routeur n'a été introduit que pour ce qui a réellement besoin d'une URL :
// les pages légales doivent être atteignables sans compte et citables par lien
// (art. 12-13 RGPD, LCEN), et l'espace compte doit pouvoir être mis en favori.
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/" replace />;
}

function AppShell() {
  const { resetLocalState } = useContext(GameContext);
  return (
    <ErrorPopupProvider onBackToMenu={resetLocalState}>
      <Routes>
        <Route path="/" element={<PlayRoute />} />
        <Route
          path="/compte"
          element={
            <RequireAuth>
              <AccountScreen />
            </RequireAuth>
          }
        />
        {/* Accessibles sans session : on arrive sur /reinitialiser depuis un
            lien d'email, précisément parce qu'on ne peut plus se connecter. */}
        <Route path="/mot-de-passe-oublie" element={<ForgotPasswordScreen />} />
        <Route path="/reinitialiser" element={<ResetPasswordScreen />} />
        <Route path="/confidentialite" element={<PrivacyPolicy />} />
        <Route path="/mentions-legales" element={<LegalNotice />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ErrorPopup />
      <ErrorToasts />
    </ErrorPopupProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <AuthProvider>
          <GameProvider>
            <AppShell />
          </GameProvider>
        </AuthProvider>
      </SocketProvider>
    </BrowserRouter>
  );
}
