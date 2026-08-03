import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuthOverlay from './AuthOverlay';

const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));
vi.mock('./GoogleOAuthButton', () => ({ default: () => null }));

function renderOverlay() {
  const auth = {
    login: vi.fn().mockResolvedValue({}),
    register: vi.fn().mockResolvedValue({}),
    onClose: vi.fn(),
  };
  mockUseAuth.mockReturnValue(auth);
  render(
    <MemoryRouter>
      <AuthOverlay open onClose={auth.onClose} />
    </MemoryRouter>
  );
  return auth;
}

async function switchToRegister() {
  await userEvent.click(screen.getByRole('button', { name: 'Pas encore de compte ? Inscris-toi' }));
}

describe('AuthOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReset();
  });

  it('opens on the login form, without any consent requirement', () => {
    renderOverlay();
    expect(screen.getByRole('heading', { name: 'Connexion' })).toBeInTheDocument();
    expect(screen.queryByText(/15 ans ou plus/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Se connecter' })).not.toBeDisabled();
  });

  // Art. 12-13 : l'information doit être délivrée AU MOMENT de la collecte,
  // pas seulement enfouie dans une page qu'on peut ne jamais ouvrir.
  it('requires the age declaration and policy acknowledgement to sign up', async () => {
    renderOverlay();
    await switchToRegister();

    const submit = screen.getByRole('button', { name: "S'inscrire" });
    expect(submit).toBeDisabled();

    await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'correct horse battery');
    expect(submit).toBeDisabled(); // le mot de passe seul ne suffit pas

    await userEvent.click(screen.getByRole('checkbox'));
    expect(submit).not.toBeDisabled();
  });

  it('links to the privacy policy from the consent line', async () => {
    renderOverlay();
    await switchToRegister();
    expect(screen.getByRole('link', { name: 'politique de confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite'
    );
  });

  // Aucun rappel n'est envoyé avant la suppression pour inactivité : elle doit
  // donc être annoncée à la collecte.
  it('announces the inactivity deletion at signup', async () => {
    renderOverlay();
    await switchToRegister();
    expect(screen.getByText(/760 jours/)).toBeInTheDocument();
  });

  // Découvrir la règle via un message d'erreur après soumission est une perte
  // de temps évitable.
  it('states the password rule up front and flags a too-short entry', async () => {
    renderOverlay();
    await switchToRegister();
    expect(screen.getByText(/12 caractères minimum/)).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'court');
    await userEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('button', { name: "S'inscrire" })).toBeDisabled();
  });

  it('passes the acceptance through to register', async () => {
    const auth = renderOverlay();
    await switchToRegister();

    await userEvent.type(screen.getByPlaceholderText('Email'), 'lea@example.com');
    await userEvent.type(screen.getByPlaceholderText('Pseudo (15 caractères max)'), 'Léa');
    await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'correct horse battery');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }));

    expect(auth.register).toHaveBeenCalledWith('lea@example.com', 'correct horse battery', 'Léa', true);
  });

  async function signUp() {
    const auth = renderOverlay();
    await switchToRegister();
    await userEvent.type(screen.getByPlaceholderText('Email'), 'lea@example.com');
    await userEvent.type(screen.getByPlaceholderText('Pseudo (15 caractères max)'), 'Léa');
    await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'correct horse battery');
    await userEvent.click(screen.getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: "S'inscrire" }));
    return auth;
  }

  // Un email vient de partir : le dire au moment où on l'attend évite de le
  // chercher dans les indésirables trois jours plus tard.
  it('announces the confirmation email instead of closing silently', async () => {
    const auth = await signUp();

    expect(await screen.findByRole('heading', { name: 'Compte créé' })).toBeInTheDocument();
    expect(screen.getByText('lea@example.com')).toBeInTheDocument();
    expect(auth.onClose).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Continuer' }));
    expect(auth.onClose).toHaveBeenCalled();
  });

  // Rien dans le jeu ne dépend de la confirmation : le dire évite de laisser
  // croire qu'il faut attendre son message pour jouer.
  it('says the account is usable before confirming', async () => {
    await signUp();
    expect(await screen.findByText(/Tu peux jouer sans attendre/)).toBeInTheDocument();
  });

  // Une connexion, elle, n'a rien à annoncer : la modale doit disparaître.
  it('closes immediately after a login', async () => {
    const auth = renderOverlay();
    await userEvent.type(screen.getByPlaceholderText('Email'), 'lea@example.com');
    await userEvent.type(screen.getByPlaceholderText('Mot de passe'), 'correct horse battery');
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }));

    expect(auth.onClose).toHaveBeenCalled();
  });
});
