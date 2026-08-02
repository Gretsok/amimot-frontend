import ToastStack from '../ui/Toast';
import { useErrorPopup } from './ErrorPopupContext';

// Pendant non fatal d'ErrorPopup : branche les erreurs récupérables du
// contexte sur la pile de toasts (ToastStack reste un composant d'UI pur,
// sans connaissance du contexte).
export default function ErrorToasts() {
  const { toasts, dismissToast, TOAST_DURATION_MS } = useErrorPopup();
  return <ToastStack toasts={toasts} duration={TOAST_DURATION_MS} onDismiss={dismissToast} />;
}
