import { getSessionToken, setSessionToken, clearSessionToken } from '../utils/storage';

export function useSessionPlayerId() {
  return { getSessionToken, setSessionToken, clearSessionToken };
}
