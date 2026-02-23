import { useEffect, useState } from "react";
import "./index.css";
import LoginModal from "./pages/LoginModal";
import Menu from "./pages/Menu";
import styles from "./App.module.css";
import { supabase } from "./supabase/client";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
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

  function handleAuth(u) {
    setUser(u);
  }

  return (
    <div className={styles.app}>
      {!user ? <LoginModal onAuth={handleAuth} /> : <Menu />}
    </div>
  );
}

export default App;
