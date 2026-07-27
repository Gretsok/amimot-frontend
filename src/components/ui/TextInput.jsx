import styles from './TextInput.module.css';

export default function TextInput({ className = '', ...props }) {
  return <input className={`${styles.input} ${className}`} {...props} />;
}
