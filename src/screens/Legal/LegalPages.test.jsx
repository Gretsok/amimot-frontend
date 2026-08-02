import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PrivacyPolicy from './PrivacyPolicy';
import LegalNotice from './LegalNotice';

// Ces pages n'utilisent volontairement AUCUN contexte (auth, socket, partie) :
// l'art. 12 exige une information « aisément accessible », donc lisible sans
// compte et sans qu'une panne du reste de l'application ne l'emporte.
function renderPage(Page) {
  render(
    <MemoryRouter>
      <Page />
    </MemoryRouter>
  );
}

describe('PrivacyPolicy', () => {
  it('renders without any auth or game context', () => {
    expect(() => renderPage(PrivacyPolicy)).not.toThrow();
    expect(screen.getByRole('heading', { name: 'Politique de confidentialité' })).toBeInTheDocument();
  });

  it('identifies the data controller and a way to contact them (art. 13)', () => {
    renderPage(PrivacyPolicy);
    expect(screen.getByText(/Fergal Mechin/)).toBeInTheDocument();
    expect(screen.getAllByText(/amimot-assistance@fergalmechin\.fr/).length).toBeGreaterThan(0);
  });

  it('names the recipients, including the host', () => {
    renderPage(PrivacyPolicy);
    expect(screen.getByText(/OVH SAS/)).toBeInTheDocument();
    expect(screen.getAllByText(/Google/).length).toBeGreaterThan(0);
  });

  it('states the retention period and the automatic deletion', () => {
    renderPage(PrivacyPolicy);
    expect(screen.getByText(/760 jours/)).toBeInTheDocument();
  });

  it('describes the only cookie and says it needs no consent', () => {
    renderPage(PrivacyPolicy);
    expect(screen.getByText(/strictement nécessaire/)).toBeInTheDocument();
  });

  it('states the 15-year minimum age for an account', () => {
    renderPage(PrivacyPolicy);
    expect(screen.getByText(/15 ans ou plus/)).toBeInTheDocument();
  });

  // Ce point distingue Amimot de la plupart des services : il doit être dit.
  it('says game data is never persisted', () => {
    renderPage(PrivacyPolicy);
    expect(screen.getByText(/mémoire vive/)).toBeInTheDocument();
  });
});

describe('LegalNotice', () => {
  it('renders without any context', () => {
    expect(() => renderPage(LegalNotice)).not.toThrow();
    expect(screen.getByRole('heading', { name: 'Mentions légales' })).toBeInTheDocument();
  });

  it('identifies the publisher with their registration number', () => {
    renderPage(LegalNotice);
    expect(screen.getByText(/990501405/)).toBeInTheDocument();
    expect(screen.getByText(/Registre National des Entreprises/)).toBeInTheDocument();
  });

  it('names the host with its address', () => {
    renderPage(LegalNotice);
    expect(screen.getByText(/OVH SAS/)).toBeInTheDocument();
    expect(screen.getByText(/59100 Roubaix/)).toBeInTheDocument();
  });

  it('links to the privacy policy', () => {
    renderPage(LegalNotice);
    expect(screen.getByRole('link', { name: 'politique de confidentialité' })).toHaveAttribute(
      'href',
      '/confidentialite'
    );
  });
});
