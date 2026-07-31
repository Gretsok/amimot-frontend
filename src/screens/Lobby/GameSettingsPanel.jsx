import { useState } from 'react';
import Button from '../../components/ui/Button';
import TextInput from '../../components/ui/TextInput';
import styles from './GameSettingsPanel.module.css';

export default function GameSettingsPanel({ settings, isHost, onUpdateSettings }) {
  const [maxPlayers, setMaxPlayers] = useState(settings.maxPlayers);

  if (!isHost) {
    return (
      <div className={styles.tile}>
        <div className={styles.label}>Joueurs max</div>
        <div className={styles.value}>{settings.maxPlayers}</div>
      </div>
    );
  }

  return (
    <div className={styles.tile}>
      <label htmlFor="max-players-input" className={styles.label}>
        Joueurs max
      </label>
      <div className={styles.editRow}>
        <TextInput
          id="max-players-input"
          type="number"
          min={2}
          max={20}
          compact
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
        />
        <Button
          variant="ghost"
          onClick={() => onUpdateSettings({ maxPlayers })}
          disabled={maxPlayers === settings.maxPlayers}
        >
          OK
        </Button>
      </div>
    </div>
  );
}
