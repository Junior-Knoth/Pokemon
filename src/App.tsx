import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { Auth } from "./components/Auth";
import { Dashboard } from "./pages/Dashboard";
import { Games } from "./pages/Games";
import styles from "./App.module.css";

type View = "dashboard" | "games";

function App() {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>("dashboard");

  if (loading) {
    return (
      <div className={styles["loading-container"]}>
        <p className={styles["loading-text"]}>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
  };

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          userEmail={user.email || "Usuário"}
          onNavigate={handleNavigate}
          onSignOut={signOut}
        />
      )}
      {currentView === "games" && <Games onNavigate={handleNavigate} />}
    </>
  );
}

export default App;
