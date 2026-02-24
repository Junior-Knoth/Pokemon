import { useEffect, useState } from "react";
import styles from "./FilterSheet.module.css";

const TYPES = [
  "Normal",
  "Fire",
  "Water",
  "Electric",
  "Grass",
  "Ice",
  "Fighting",
  "Poison",
  "Ground",
  "Flying",
  "Psychic",
  "Bug",
  "Rock",
  "Ghost",
  "Dragon",
  "Dark",
  "Steel",
  "Fairy",
];

export default function FilterSheet({ open, onClose, onApply, initial }) {
  const [status, setStatus] = useState(initial?.status ?? "all");
  const [types, setTypes] = useState(new Set(initial?.types ?? []));

  useEffect(() => {
    if (open) {
      // lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    // sync when initial changes
    setStatus(initial?.status ?? "all");
    setTypes(new Set(initial?.types ?? []));
  }, [initial]);

  function toggleType(t) {
    const next = new Set(types);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    setTypes(next);
    // apply immediately on change
    onApply?.({ status, types: Array.from(next) });
  }

  function apply() {
    onApply?.({ status, types: Array.from(types) });
    onClose?.();
  }

  const hasClear = status !== "all" || types.size > 0;

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={styles.handle} />
        <h3 className={styles.title}>Filtros</h3>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Status de Equipe</div>
          <div className={styles.pills}>
            <button
              className={`${styles.pill} ${status === "all" ? styles.activePill : ""}`}
              onClick={() => {
                const s = "all";
                setStatus(s);
                onApply?.({ status: s, types: Array.from(types) });
              }}
            >
              Todos
            </button>
            <button
              className={`${styles.pill} ${status === "active" ? styles.activePill : ""}`}
              onClick={() => {
                const s = "active";
                setStatus(s);
                onApply?.({ status: s, types: Array.from(types) });
              }}
            >
              No Time
            </button>
            <button
              className={`${styles.pill} ${status === "noc" ? styles.activePill : ""}`}
              onClick={() => {
                const s = "noc";
                setStatus(s);
                onApply?.({ status: s, types: Array.from(types) });
              }}
            >
              No PC
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>Tipos</div>
          <div className={styles.typesGrid}>
            {TYPES.map((t) => (
              <button
                key={t}
                className={`${styles.typeBtn} ${types.has(t) ? styles.typeActive : ""}`}
                onClick={() => toggleType(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <div className={styles.footer}>
          <button
            className={`${styles.apply} ${!hasClear ? styles.full : ""}`}
            onClick={apply}
          >
            Aplicar
          </button>
          {hasClear ? (
            <button
              className={styles.clear}
              onClick={() => {
                setStatus("all");
                setTypes(new Set());
              }}
            >
              Limpar
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
