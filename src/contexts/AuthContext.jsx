import { createContext, useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Compteur de génération : toute mutation d'identité l'incrémente, et un
  // `refresh` en vol n'applique son résultat que si rien n'a bougé depuis.
  // Sans ça, un `api.me()` parti avant une déconnexion peut résoudre après
  // elle et remettre l'utilisateur en place — l'interface le montre alors
  // connecté à un compte dont la session vient d'être révoquée.
  const generationRef = useRef(0);

  const refresh = useCallback(async () => {
    const generation = (generationRef.current += 1);
    try {
      const me = await api.me();
      if (generationRef.current === generation) setUser(me);
    } catch {
      if (generationRef.current === generation) setUser(null);
    } finally {
      if (generationRef.current === generation) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function login(email, password) {
    const res = await api.login(email, password);
    generationRef.current += 1;
    setUser(res.user);
    return res.user;
  }

  async function register(email, password, pseudo, acceptedPolicy) {
    const res = await api.register(email, password, pseudo, acceptedPolicy);
    generationRef.current += 1;
    setUser(res.user);
    return res.user;
  }

  async function logout() {
    await api.logout();
    generationRef.current += 1;
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}
