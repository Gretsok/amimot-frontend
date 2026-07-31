import { useState } from 'react';
import Button from '../ui/Button';

export default function GoogleOAuthButton() {
  const [busy, setBusy] = useState(false);

  function handleClick() {
    setBusy(true);
    window.location.assign('/api/auth/google');
  }

  return (
    <Button variant="ghost" type="button" disabled={busy} onClick={handleClick}>
      {busy ? 'Redirection...' : 'Continuer avec Google'}
    </Button>
  );
}
