import { useState } from "react";
import { supabase } from "../supabase/client";
import styles from "./LoginModal.module.css";

export default function LoginModal({ onAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function validateEmail(e) {
    // simple email regex
    return /\S+@\S+\.\S+/.test(e);
  }

  async function handleSignIn(e) {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) return setError("E-mail inválido");
    if (password.length < 6)
      return setError("Senha precisa ter pelo menos 6 caracteres");

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) return setError(error.message);
    onAuth(data.user || data.session?.user);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setError(null);
    if (!validateEmail(email)) return setError("E-mail inválido");
    if (password.length < 6)
      return setError("Senha precisa ter pelo menos 6 caracteres");

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        // common server-side SMTP / rate limit errors
        if (
          error.message &&
          error.message.toLowerCase().includes("rate limit")
        ) {
          setError(
            "Limite de envios de e-mail atingido. Tente novamente mais tarde ou desative confirmação por e-mail no painel do Supabase.",
          );
        } else {
          setError(error.message || "Erro ao registrar");
        }
        setLoading(false);
        return;
      }

      // If signup returns a session/user we can proceed
      if (data?.session || data?.user) {
        setLoading(false);
        onAuth(data.user || data.session?.user);
        return;
      }

      // No session (email confirm required). Try to sign in immediately — in some Supabase setups this will still fail until confirmation.
      try {
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (signInError) {
          // Inform user that confirmation may be required
          setError(
            signInError.message ||
              "Registro efetuado. Por favor verifique seu e-mail para confirmar a conta.",
          );
          onAuth(null);
          return;
        }
        onAuth(signInData.user || signInData.session?.user);
      } catch (siErr) {
        setLoading(false);
        setError(
          "Registro efetuado. Por favor verifique seu e-mail para confirmar a conta.",
        );
        onAuth(null);
      }
    } catch (e) {
      setLoading(false);
      console.error(e);
      setError("Erro ao registrar");
    }
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <h2 className={styles.title}>Entrar / Registrar</h2>
        <form className={styles.form} onSubmit={handleSignIn}>
          <label className={styles.label}>
            E-mail
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className={styles.label}>
            Senha
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actions}>
            <button className={styles.primary} type="submit" disabled={loading}>
              {loading ? "Carregando..." : "Entrar"}
            </button>
            <button
              className={styles.secondary}
              onClick={handleSignUp}
              disabled={loading}
            >
              {loading ? "Carregando..." : "Registrar"}
            </button>
          </div>
        </form>
        <p className={styles.hint}>
          Somente e-mail e senha. Sem estilos chamativos.
        </p>
      </div>
    </div>
  );
}
