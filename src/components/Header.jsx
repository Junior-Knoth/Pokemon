import { useEffect, useRef, useState } from "react";
import { ChevronDown, Menu } from "lucide-react";
import { supabase } from "../supabase/client";
import styles from "./Header.module.css";

export default function Header({ selected, onSelect, onExport }) {
  const [open, setOpen] = useState(false);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openLeft, setOpenLeft] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // get initial session and games
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id;
      if (uid && mounted) fetchGames(uid);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const uid = session?.user?.id;
        if (uid) fetchGames(uid);
        else setGames([]);
      },
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe?.();
    };
  }, []);

  async function fetchGames(userId) {
    setLoading(true);
    const { data, error } = await supabase
      .from("games")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    setLoading(false);
    if (error) {
      console.error("Erro ao buscar jogos:", error);
      return;
    }
    setGames(data || []);
  }

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
        setOpenLeft(false);
      }
    }
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, []);

  function toggle() {
    setOpen((v) => !v);
  }

  function pick(game) {
    const value = { id: game.id, name: game.name };
    onSelect?.(value);
    setOpen(false);
  }

  function clearSelection() {
    onSelect?.(null);
    setOpen(false);
  }

  return (
    <header className={styles.header} ref={ref}>
      <div className={styles.left}>
        <button
          className={styles.hamburger}
          onClick={() => setOpenLeft((s) => !s)}
          aria-haspopup="listbox"
          aria-expanded={openLeft}
        >
          <Menu />
        </button>
        {openLeft && (
          <ul className={styles.leftList} role="listbox">
            <button
              className={`${styles.item} ${styles.exportBtn}`}
              onClick={() => {
                onExport?.();
                setOpenLeft(false);
              }}
            >
              Exportar JSON
            </button>
          </ul>
        )}
      </div>
      <div className={styles.brand}>
        <h1 className={styles.title}>
          {selected?.name ?? "Nenhum jogo selecionado"}
        </h1>
      </div>

      <div className={styles.dropdownWrapper}>
        <button
          className={styles.toggle}
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <ChevronDown size={18} />
        </button>

        {open && (
          <ul className={styles.list} role="listbox">
            {loading && <li className={styles.item}>Carregando...</li>}
            {!loading && games.length === 0 && (
              <li className={styles.item}>Nenhum jogo registrado</li>
            )}
            {!loading &&
              games.map((g) => (
                <li
                  key={g.id}
                  className={styles.item}
                  onClick={() => pick(g)}
                  role="option"
                >
                  {g.name}
                </li>
              ))}
            <li className={styles.item} onClick={clearSelection} role="option">
              Limpar seleção
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
