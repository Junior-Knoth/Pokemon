import { useState } from "react";
import { supabase } from "../lib/supabase";
import styles from "./Auth.module.css";

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setMessage("Por favor, preencha todos os campos");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("Verifique seu email para confirmar o cadastro!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Ocorreu um erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles["container"]}>
      <h2 className={styles["title"]}>{isSignUp ? "Cadastrar" : "Entrar"}</h2>

      <form onSubmit={handleAuth} className={styles["form"]}>
        <div className={styles["form-group"]}>
          <label htmlFor="email" className={styles["label"]}>
            Email:
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            disabled={loading}
            className="input-default"
            style={{ width: "100%" }}
          />
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="password" className={styles["label"]}>
            Senha:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            disabled={loading}
            className="input-default"
            style={{ width: "100%" }}
          />
        </div>

        <button type="submit" disabled={loading} className={styles["button"]}>
          {loading ? "Carregando..." : isSignUp ? "Cadastrar" : "Entrar"}
        </button>
      </form>

      {message && <p className={styles["message"]}>{message}</p>}

      <div className={styles["toggle-container"]}>
        {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className={styles["toggle-button"]}
        >
          {isSignUp ? "Entre aqui" : "Cadastre-se aqui"}
        </button>
      </div>
    </div>
  );
}
