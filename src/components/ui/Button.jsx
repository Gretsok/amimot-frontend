import styles from './Button.module.css';

const VARIANT_CLASS = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
};

export default function Button({ variant = 'primary', className = '', ...props }) {
  const variantClass = VARIANT_CLASS[variant] || VARIANT_CLASS.primary;
  return <button className={`${styles.button} ${variantClass} ${className}`} {...props} />;
}
