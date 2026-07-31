import styles from './TextInput.module.css';

export default function TextInput({ className = '', compact = false, ...props }) {
  return <input className={`${styles.input} ${compact ? styles.compact : ''} ${className}`} {...props} />;
}
