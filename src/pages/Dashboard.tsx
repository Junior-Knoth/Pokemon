import styles from "./Dashboard.module.css";

interface DashboardProps {
  userEmail: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

export function Dashboard({
  userEmail,
  onNavigate,
  onSignOut,
}: DashboardProps) {
  return (
    <div className={styles["container"]}>
      <header className={styles["header"]}>
        <h1 className={styles["title"]}>Pokémon Database</h1>
        <div className={styles["user-section"]}>
          <span className={styles["user-email"]}>Bem-vindo, {userEmail}</span>
          <button onClick={onSignOut} className={styles["logout-button"]}>
            Sair
          </button>
        </div>
      </header>

      <main className={styles["main"]}>
        <h2 className={styles["section-title"]}>Dashboard</h2>
        <p className={styles["description"]}>
          Aqui você poderá gerenciar seus jogos, Pokémon e batalhas!
        </p>

        <div className={styles["cards-grid"]}>
          <div className={styles["card"]}>
            <h3 className={styles["card-title"]}>Meus Jogos</h3>
            <p className={styles["card-description"]}>
              Gerencie seus jogos Pokémon
            </p>
            <button
              onClick={() => onNavigate("games")}
              className={`${styles["card-button"]} ${styles["primary"]}`}
            >
              Ver Jogos
            </button>
          </div>

          <div className={styles["card"]}>
            <h3 className={styles["card-title"]}>Meus Pokémon</h3>
            <p className={styles["card-description"]}>Visualize sua coleção</p>
            <button
              className={`${styles["card-button"]} ${styles["success"]}`}
              disabled
            >
              Em breve
            </button>
          </div>

          <div className={styles["card"]}>
            <h3 className={styles["card-title"]}>Batalhas</h3>
            <p className={styles["card-description"]}>
              Registre suas batalhas épicas
            </p>
            <button
              className={`${styles["card-button"]} ${styles["warning"]}`}
              disabled
            >
              Em breve
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
