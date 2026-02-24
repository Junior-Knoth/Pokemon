import styles from "./Menu.module.css";
import Header from "../components/Header";
import ThumbZone from "../components/ThumbZone";
import PokemonGrid from "../components/PokemonGrid";

export default function Menu({ selected, onSelect }) {
  return (
    <div className={styles.container}>
      <Header selected={selected} onSelect={onSelect} />
      <PokemonGrid selected={selected} />
      <ThumbZone />
    </div>
  );
}
