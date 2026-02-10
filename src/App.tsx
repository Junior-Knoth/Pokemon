import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { Auth } from "./components/Auth";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Dashboard } from "./pages/Dashboard";
import { Games } from "./pages/Games";
import { Pokemons } from "./pages/Pokemons";
import { Battles } from "./pages/Battles";
import { PokemonProvider } from "./context/PokemonContext";
import styles from "./App.module.css";

type View = "dashboard" | "games" | "pokemons" | "battles";

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
    <PokemonProvider>
      <div className={styles["app-layout"]}>
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          onSignOut={signOut}
        />
        <main className={styles["main-content"]}>
          {currentView === "dashboard" && (
            <Dashboard
              userEmail={user.email || "Usuário"}
              onNavigate={handleNavigate}
              onSignOut={signOut}
            />
          )}
          {currentView === "games" && <Games onNavigate={handleNavigate} />}
          {currentView === "pokemons" && (
            <Pokemons onNavigate={handleNavigate} />
          )}
          {currentView === "battles" && <Battles onNavigate={handleNavigate} />}
        </main>
      </div>
    </PokemonProvider>
  );
}

export default App;
