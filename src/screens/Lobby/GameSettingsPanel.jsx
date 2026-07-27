import { useState } from 'react';
import Button from '../../components/ui/Button';
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
      <div className={styles.label}>Joueurs max</div>
      <div className={styles.editRow}>
        <input
          type="number"
          min={2}
          max={20}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(Number(e.target.value))}
          className={styles.numberInput}
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
