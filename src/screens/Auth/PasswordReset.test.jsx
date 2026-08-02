import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import ResetPasswordScreen from './ResetPasswordScreen';

const mockApi = vi.hoisted(() => ({
  forgotPassword: vi.fn(),
  resetPassword: vi.fn(),
}));
vi.mock('../../services/api', () => ({ api: mockApi }));

function renderAt(path, element) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path.split('?')[0]} element={element} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.forgotPassword.mockResolvedValue({});
  });

  it('sends the request and confirms', async () => {
    renderAt('/mot-de-passe-oublie', <ForgotPasswordScreen />);

    await userEvent.type(screen.getByPlaceholderText('Email'), 'lea@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(mockApi.forgotPassword).toHaveBeenCalledWith('lea@example.com');
    expect(await screen.findByText(/Si un compte existe/)).toBeInTheDocument();
  });

  // Le serveur répond 204 quelle que soit l'adresse ; l'interface ne doit pas
  // réintroduire la fuite en distinguant les cas.
  it('shows the same message even when the request fails', async () => {
    mockApi.forgotPassword.mockRejectedValue(new Error('inconnu'));
    renderAt('/mot-de-passe-oublie', <ForgotPasswordScreen />);

    await userEvent.type(screen.getByPlaceholderText('Email'), 'personne@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(await screen.findByText(/Si un compte existe/)).toBeInTheDocument();
    expect(screen.queryByText(/inconnu/)).not.toBeInTheDocument();
  });

  // Un compte Google n'a pas de mot de passe : sans cette mention, la personne
  // attend indéfiniment un mail qui ne viendra jamais.
  it('explains the Google case', async () => {
    renderAt('/mot-de-passe-oublie', <ForgotPasswordScreen />);
    await userEvent.type(screen.getByPlaceholderText('Email'), 'lea@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le lien' }));

    expect(await screen.findByText(/Google/)).toBeInTheDocument();
  });
});

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.resetPassword.mockResolvedValue({});
  });

  it('sends the token from the URL along with the new password', async () => {
    renderAt('/reinitialiser?token=abc123', <ResetPasswordScreen />);

    await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), 'staple gorille lune');
    await userEvent.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }));

    expect(mockApi.resetPassword).toHaveBeenCalledWith('abc123', 'staple gorille lune');
    expect(await screen.findByText(/Mot de passe modifié/)).toBeInTheDocument();
  });

  it('states the password rule and blocks a too-short entry', async () => {
    renderAt('/reinitialiser?token=abc123', <ResetPasswordScreen />);

    expect(screen.getByText(/12 caractères minimum/)).toBeInTheDocument();
    await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), 'court');
    expect(screen.getByRole('button', { name: 'Changer mon mot de passe' })).toBeDisabled();
  });

  it('surfaces an expired or already-used link', async () => {
    mockApi.resetPassword.mockRejectedValue(new Error('Ce lien est invalide ou a expiré.'));
    renderAt('/reinitialiser?token=perime', <ResetPasswordScreen />);

    await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), 'staple gorille lune');
    await userEvent.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }));

    expect(await screen.findByText(/invalide ou a expiré/)).toBeInTheDocument();
  });

  // Arriver sans jeton (lien tronqué par un client mail) ne doit pas laisser
  // devant un formulaire qui échouera de toute façon.
  it('offers a way out when the link carries no token', () => {
    renderAt('/reinitialiser', <ResetPasswordScreen />);

    expect(screen.getByText(/lien est incomplet/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Nouveau mot de passe')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'demande un nouveau lien' })).toHaveAttribute(
      'href',
      '/mot-de-passe-oublie'
    );
  });

  // Le changement révoque toutes les sessions : le dire évite de croire à un bug.
  it('mentions that open sessions were logged out', async () => {
    renderAt('/reinitialiser?token=abc123', <ResetPasswordScreen />);
    await userEvent.type(screen.getByPlaceholderText('Nouveau mot de passe'), 'staple gorille lune');
    await userEvent.click(screen.getByRole('button', { name: 'Changer mon mot de passe' }));

    expect(await screen.findByText(/déconnectées/)).toBeInTheDocument();
  });
});
