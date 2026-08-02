import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';

export default function LegalNotice() {
  return (
    <LegalPage title="Mentions légales" updatedAt="2 août 2026">
      <h2>Éditeur</h2>
      <p>
        Fergal Mechin, entrepreneur individuel.
        <br />
        SIREN : 990501405 — inscrit au Registre National des Entreprises (RNE).
        <br />
        Directeur de la publication : Fergal Mechin.
        <br />
        Contact :{' '}
        <a href="mailto:amimot-assistance@fergalmechin.fr">amimot-assistance@fergalmechin.fr</a>
      </p>

      <h2>Hébergeur</h2>
      <p>
        OVH SAS
        <br />
        2 rue Kellermann, 59100 Roubaix, France
        <br />
        <a href="https://www.ovhcloud.com" target="_blank" rel="noreferrer">
          www.ovhcloud.com
        </a>
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Le nom Amimot, son identité visuelle et le code du service sont la propriété de
        l&apos;éditeur. Les mots proposés par les joueurs pendant une partie ne sont pas conservés.
      </p>

      <h2>Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans la{' '}
        <Link to="/confidentialite">politique de confidentialité</Link>.
      </p>
    </LegalPage>
  );
}
