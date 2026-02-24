import { useEffect, useState } from "react";
import "./index.css";
import LoginModal from "./pages/LoginModal";
import Menu from "./pages/Menu";
import styles from "./App.module.css";
import { supabase } from "./supabase/client";

const STORAGE_KEY = "selectedGame";

function App() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    // initialize selected from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setSelected(JSON.parse(saved));
      } catch {
        setSelected(saved);
      }
    }

    // Try to get current session user on mount
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data.session?.user ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      },
    );

    return () => listener?.subscription?.unsubscribe?.();
  }, []);

  useEffect(() => {
    // persist selected to localStorage
    if (selected == null) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
    } catch (e) {
      console.error("Failed to persist selected:", e);
    }
  }, [selected]);

  function handleAuth(u) {
    setUser(u);
  }

  function handleSelect(value) {
    // value null or { id, name }
    setSelected(value);
  }

  return (
    <div className={styles.app}>
      {!user ? (
        <LoginModal onAuth={handleAuth} />
      ) : (
        <Menu selected={selected} onSelect={handleSelect} />
      )}
    </div>
  );
}

export default App;
