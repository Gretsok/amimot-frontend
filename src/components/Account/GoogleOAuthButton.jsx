import Button from '../ui/Button';

export default function GoogleOAuthButton() {
  return (
    <Button variant="ghost" type="button" onClick={() => window.location.assign('/api/auth/google')}>
      Continuer avec Google
    </Button>
  );
}
