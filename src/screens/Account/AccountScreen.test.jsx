import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AccountScreen from './AccountScreen';

const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// vi.hoisted : vi.mock est remonté en tête de fichier, donc une constante
// déclarée normalement n'existe pas encore quand la fabrique s'exécute.
const mockApi = vi.hoisted(() => ({
  updateMe: vi.fn(),
  deleteMe: vi.fn(),
  exportMe: vi.fn(),
  unlinkAccount: vi.fn(),
}));
vi.mock('../../services/api', () => ({ api: mockApi }));

function baseAuth(overrides = {}) {
  return {
    user: {
      id: 'u1',
      pseudo: 'Léa',
      xp: 12,
      gamesPlayed: 3,
      accounts: [{ id: 'a1', provider: 'LOCAL', email: 'lea@example.com' }],
    },
    logout: vi.fn().mockResolvedValue({}),
    refresh: vi.fn().mockResolvedValue({}),
    ...overrides,
  };
}

function renderScreen(auth = baseAuth()) {
  mockUseAuth.mockReturnValue(auth);
  render(
    <MemoryRouter>
      <AccountScreen />
    </MemoryRouter>
  );
  return auth;
}

describe('AccountScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReset();
    mockApi.updateMe.mockResolvedValue({});
    mockApi.deleteMe.mockResolvedValue({});
    mockApi.exportMe.mockResolvedValue({ pseudo: 'Léa' });
    mockApi.unlinkAccount.mockResolvedValue({});
  });

  it('shows the three sections', () => {
    renderScreen();
    expect(screen.getByRole('heading', { name: 'Profil' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Connexions' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Données et confidentialité' })).toBeInTheDocument();
  });

  it('shows the profile stats and the current pseudo', () => {
    renderScreen();
    expect(screen.getByText('XP : 12')).toBeInTheDocument();
    expect(screen.getByText('Parties jouées : 3')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Léa')).toBeInTheDocument();
  });

  it('saves a new pseudo', async () => {
    const auth = renderScreen();
    const input = screen.getByDisplayValue('Léa');
    await userEvent.clear(input);
    await userEvent.type(input, 'Léana');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(mockApi.updateMe).toHaveBeenCalledWith('Léana');
    await waitFor(() => expect(auth.refresh).toHaveBeenCalled());
  });

  // Droit à la portabilité (art. 20) : l'action doit être joignable en un clic.
  it('lets the user download their data', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: 'Télécharger mes données' }));
    expect(mockApi.exportMe).toHaveBeenCalled();
  });

  // Droit à l'effacement (art. 17), mais irréversible : jamais sans confirmation.
  it('does not delete the account without an explicit confirmation', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    expect(mockApi.deleteMe).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }));
    expect(mockApi.deleteMe).toHaveBeenCalled();
  });

  it('can back out of the deletion', async () => {
    renderScreen();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(mockApi.deleteMe).not.toHaveBeenCalled();
  });

  // La suppression pour inactivité ne peut être annoncée par email : elle doit
  // donc être rappelée là où l'utilisateur consulte ses données.
  it('states the inactivity deletion rule', () => {
    renderScreen();
    expect(screen.getByText(/760 jours/)).toBeInTheDocument();
  });

  it('links to both legal pages', () => {
    renderScreen();
    expect(screen.getByRole('link', { name: 'Politique de confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite'
    );
    expect(screen.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales');
  });

  // Le serveur refuse de délier le dernier moyen de connexion : proposer le
  // bouton reviendrait à promettre une action vouée à échouer.
  it('hides the unlink button when only one login method remains', () => {
    renderScreen();
    expect(screen.queryByRole('button', { name: 'Délier' })).not.toBeInTheDocument();
  });

  it('offers to unlink when several login methods exist', async () => {
    const auth = baseAuth();
    auth.user.accounts.push({ id: 'a2', provider: 'GOOGLE', email: 'lea@gmail.com' });
    renderScreen(auth);

    const buttons = screen.getAllByRole('button', { name: 'Délier' });
    expect(buttons).toHaveLength(2);
    await userEvent.click(buttons[1]);
    expect(mockApi.unlinkAccount).toHaveBeenCalledWith('a2');
  });
});
