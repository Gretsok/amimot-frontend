import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import styles from './LegalPage.module.css';

// Contenu dérivé de l'audit RGPD (docs/rgpd-audit-2026-08.md) : toute donnée
// listée ici doit exister dans le code, et toute donnée collectée par le code
// doit figurer ici. Si l'un des deux change, l'autre doit suivre.
export default function PrivacyPolicy() {
  return (
    <LegalPage title="Politique de confidentialité" updatedAt="2 août 2026">
      <p>
        Amimot est un jeu de mots en ligne. Cette page explique quelles données personnelles sont
        traitées, pourquoi, combien de temps, et comment exercer tes droits.
      </p>

      <h2>Jouer sans compte</h2>
      <p>
        Tu peux créer ou rejoindre une partie <strong>sans créer de compte</strong>. Dans ce cas, le
        nom que tu choisis, les mots que tu proposes, tes cartes et tes scores n&apos;existent
        qu&apos;en mémoire vive, le temps de la partie. Ils sont détruits à la fin de celle-ci et ne
        sont jamais enregistrés dans une base de données.
      </p>

      <h2>Responsable de traitement</h2>
      <p>
        Fergal Mechin, entrepreneur individuel — SIREN 990501405, inscrit au Registre National des
        Entreprises. Contact :{' '}
        <a href="mailto:amimot-assistance@fergalmechin.fr">amimot-assistance@fergalmechin.fr</a>.
      </p>

      <h2>Données traitées et durées de conservation</h2>
      <div className={styles.tableWrap}>
        <table>
          <thead>
            <tr>
              <th>Donnée</th>
              <th>Finalité</th>
              <th>Base légale</th>
              <th>Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Adresse email</td>
              <td>
                Créer le compte, permettre la connexion, et t&apos;envoyer la confirmation
                d&apos;adresse et les liens de réinitialisation de mot de passe
              </td>
              <td>Exécution du contrat</td>
              <td>Jusqu&apos;à suppression du compte</td>
            </tr>
            <tr>
              <td>Jetons envoyés par email (confirmation, réinitialisation)</td>
              <td>Vérifier que tu relèves bien cette adresse</td>
              <td>Exécution du contrat</td>
              <td>
                7 jours (confirmation) ou 1 heure (réinitialisation) ; supprimés dès usage.
                Seule une empreinte est stockée, jamais le lien lui-même
              </td>
            </tr>
            <tr>
              <td>Mot de passe (empreinte bcrypt)</td>
              <td>Vérifier ton identité à la connexion</td>
              <td>Exécution du contrat</td>
              <td>Jusqu&apos;à suppression du compte</td>
            </tr>
            <tr>
              <td>Pseudo</td>
              <td>T&apos;identifier auprès des autres joueurs</td>
              <td>Exécution du contrat</td>
              <td>Jusqu&apos;à suppression du compte</td>
            </tr>
            <tr>
              <td>Identifiant Google (si connexion Google)</td>
              <td>Rattacher ta connexion Google à ton profil</td>
              <td>Exécution du contrat</td>
              <td>Jusqu&apos;à suppression du compte</td>
            </tr>
            <tr>
              <td>Dates de création et de dernière connexion</td>
              <td>Détecter les comptes inactifs</td>
              <td>Obligation de minimisation</td>
              <td>Jusqu&apos;à suppression du compte</td>
            </tr>
            <tr>
              <td>Expérience et nombre de parties jouées</td>
              <td>Afficher ta progression</td>
              <td>Exécution du contrat</td>
              <td>Jusqu&apos;à suppression du compte</td>
            </tr>
            <tr>
              <td>Adresse IP</td>
              <td>Limiter le nombre de requêtes (protection anti-abus)</td>
              <td>Intérêt légitime (sécurité du service)</td>
              <td>Quelques minutes en mémoire ; journaux techniques en rotation</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Suppression automatique des comptes inactifs</h2>
      <p>
        <strong>
          Si tu ne te connectes pas pendant 760 jours (environ deux ans), ton compte et toutes les
          données ci-dessus sont supprimés automatiquement.
        </strong>{' '}
        Un rappel t&apos;est envoyé par email <strong>trente jours avant</strong> cette
        échéance, à l&apos;adresse de ton compte. Une simple connexion remet le compteur à zéro.
      </p>

      <h2>Emails que tu peux recevoir</h2>
      <p>
        Amimot ne t&apos;envoie que des messages liés au fonctionnement de ton compte : la
        confirmation de ton adresse à l&apos;inscription, le lien pour définir un nouveau mot de
        passe lorsque tu le demandes, le rappel avant suppression pour inactivité, et la
        confirmation lorsque ton compte est supprimé.{' '}
        <strong>Aucun message promotionnel, aucune newsletter</strong>, et ton adresse
        n&apos;est transmise à personne à cette fin. Ces envois passent par la messagerie
        d&apos;OVH, déjà notre hébergeur.
      </p>

      <h2>Cookie</h2>
      <p>
        Un seul cookie est déposé, nommé <code>token</code>. Il maintient ta session ouverte après
        connexion, dure 7 jours, et n&apos;est lisible que par le serveur. Il est strictement
        nécessaire au fonctionnement du service : il ne sert ni à la mesure d&apos;audience, ni à la
        publicité, et ne requiert donc pas de consentement. Amimot n&apos;utilise{' '}
        <strong>aucun outil de mesure d&apos;audience ni aucun traceur publicitaire</strong>.
      </p>

      <h2>Destinataires</h2>
      <ul>
        <li>
          <strong>Google</strong> — uniquement si tu choisis de te connecter avec un compte Google.
          Google reçoit alors les informations nécessaires à l&apos;authentification et nous
          transmet ton identifiant Google, ton adresse email et ton nom d&apos;affichage.
        </li>
        <li>
          <strong>OVH SAS</strong> (2 rue Kellermann, 59100 Roubaix, France) — hébergeur des
          serveurs. Les données sont hébergées en France.
        </li>
      </ul>
      <p>
        Aucune donnée n&apos;est vendue, louée, ni transmise à des tiers à des fins commerciales.
      </p>

      <h2>Âge minimum</h2>
      <p>
        La création d&apos;un compte est réservée aux personnes de 15 ans ou plus. Le jeu sans
        compte reste accessible à tous, puisqu&apos;il ne conserve aucune donnée.
      </p>

      <h2>Tes droits</h2>
      <p>Tu disposes des droits d&apos;accès, de rectification, d&apos;effacement, de portabilité, de limitation et d&apos;opposition.</p>
      <ul>
        <li>
          <strong>Accès et portabilité</strong> — depuis ton{' '}
          <Link to="/compte">espace compte</Link>, le bouton « Télécharger mes données » produit
          immédiatement un fichier contenant l&apos;intégralité de tes données.
        </li>
        <li>
          <strong>Rectification</strong> — ton pseudo se modifie depuis l&apos;espace compte. Pour
          l&apos;adresse email, écris-nous.
        </li>
        <li>
          <strong>Effacement</strong> — le bouton « Supprimer mon compte » efface immédiatement et
          définitivement toutes tes données.
        </li>
        <li>
          <strong>Autres droits</strong> — écris à{' '}
          <a href="mailto:amimot-assistance@fergalmechin.fr">amimot-assistance@fergalmechin.fr</a>.
        </li>
      </ul>
      <p>
        Tu peux également introduire une réclamation auprès de la CNIL (
        <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">
          www.cnil.fr
        </a>
        ).
      </p>

      <h2>Sécurité</h2>
      <p>
        Les mots de passe sont stockés sous forme d&apos;empreinte bcrypt, jamais en clair. Les
        échanges sont chiffrés (HTTPS). La base de données n&apos;est pas exposée sur Internet. Les
        actions sensibles sont limitées en fréquence pour prévenir les abus.
      </p>

      <p>
        <Link to="/mentions-legales">Mentions légales</Link>
      </p>
    </LegalPage>
  );
}
