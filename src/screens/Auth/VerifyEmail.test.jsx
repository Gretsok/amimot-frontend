import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import VerifyEmailScreen from './VerifyEmailScreen';

const mockApi = vi.hoisted(() => ({ verifyEmail: vi.fn() }));
vi.mock('../../services/api', () => ({ api: mockApi }));

const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

function renderAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/confirmer-email" element={<VerifyEmailScreen />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('VerifyEmailScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.verifyEmail.mockResolvedValue({ email: 'lea@example.com' });
    mockUseAuth.mockReturnValue({ user: null, refresh: vi.fn() });
  });

  // La personne a déjà cliqué dans son message : lui redemander de confirmer
  // sa confirmation n'apporterait rien.
  it('consumes the token on arrival, without any extra click', async () => {
    renderAt('/confirmer-email?token=jeton-valide');

    expect(mockApi.verifyEmail).toHaveBeenCalledWith('jeton-valide');
    expect(await screen.findByText(/Ton adresse est confirmée/)).toBeInTheDocument();
  });

  it('reports a link that no longer works', async () => {
    mockApi.verifyEmail.mockRejectedValue(new Error('Ce lien de confirmation est invalide ou a expiré.'));
    renderAt('/confirmer-email?token=perime');

    expect(
      await screen.findByText('Ce lien de confirmation est invalide ou a expiré.')
    ).toBeInTheDocument();
  });

  it('does not call the server when the link carries no token', () => {
    renderAt('/confirmer-email');

    expect(mockApi.verifyEmail).not.toHaveBeenCalled();
    expect(screen.getByText(/Ce lien est incomplet/)).toBeInTheDocument();
  });

  // Sans ce rafraîchissement, l'espace compte continuerait d'afficher
  // « adresse non confirmée » dans l'onglet où l'on vient de la confirmer.
  it('refreshes the session so the account page reflects the change', async () => {
    const refresh = vi.fn();
    mockUseAuth.mockReturnValue({ user: { id: 'u1' }, refresh });
    renderAt('/confirmer-email?token=jeton-valide');

    await screen.findByText(/Ton adresse est confirmée/);
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Aller à mon compte' })).toHaveAttribute(
      'href',
      '/compte'
    );
  });
});
