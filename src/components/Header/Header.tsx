import { ReactNode } from "react";
import styles from "./Header.module.css";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  children?: ReactNode;
}

export function Header({
  title,
  showBackButton,
  onBack,
  children,
}: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        {showBackButton && onBack && (
          <button className={styles.backButton} onClick={onBack}>
            ← Voltar
          </button>
        )}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {children && <div className={styles.headerControls}>{children}</div>}
    </header>
  );
}
