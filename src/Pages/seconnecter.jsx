import { useState } from "react";
import { Navigate } from "react-router-dom";
import "./seconnecter.css";

const API_URL = "http://localhost:5000";

// ============================================================
// RÉCUPÉRER L'UTILISATEUR SAUVEGARDÉ
// ============================================================

function getSavedUser() {
  const savedUser = localStorage.getItem("user");

  if (savedUser === null) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error("Erreur utilisateur :", error);

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    return null;
  }
}

// ============================================================
// PAGE CONNEXION
// ============================================================

function SeConnecter() {
  // ==========================================================
  // ÉTATS CONNEXION
  // ==========================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ==========================================================
  // ÉTATS CRÉATION DE COMPTE
  // ==========================================================

  const [username, setUsername] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ==========================================================
  // ÉTATS GÉNÉRAUX
  // ==========================================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState(getSavedUser);

  const [mode, setMode] = useState("login");

  // ==========================================================
  // CONNEXION
  // ==========================================================

  async function handleLogin(event) {
    event.preventDefault();

    console.log("BOUTON SE CONNECTER CLIQUÉ");

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
            password: password,
          }),
        }
      );

      const data = await response.json();

      console.log("Réponse du serveur :", data);

      // ========================================================
      // ERREUR SERVEUR
      // ========================================================

      if (!response.ok) {
        setMessage(
          data.message ||
            "Email ou mot de passe incorrect."
        );

        return;
      }

      // ========================================================
      // VÉRIFICATION TOKEN
      // ========================================================

      if (!data.token) {
        setMessage(
          "Connexion impossible : aucun token reçu."
        );

        return;
      }

      // ========================================================
      // VÉRIFICATION UTILISATEUR
      // ========================================================

      if (!data.user) {
        setMessage(
          "Connexion impossible : aucun utilisateur reçu."
        );

        return;
      }

      // ========================================================
      // SAUVEGARDER LE TOKEN
      // ========================================================

      localStorage.setItem(
        "token",
        data.token
      );

      // ========================================================
      // SAUVEGARDER L'UTILISATEUR
      // ========================================================

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      // ========================================================
      // METTRE À JOUR L'ÉTAT
      // ========================================================

      setUser(data.user);

      // ========================================================
      // INFORMER APP.JSX
      // ========================================================

      window.dispatchEvent(
        new Event("userChanged")
      );

      // ========================================================
      // VIDER LE FORMULAIRE
      // ========================================================

      setEmail("");
      setPassword("");

      console.log(
        "Utilisateur connecté :",
        data.user
      );

      console.log(
        "Rôle :",
        data.user.role
      );

      // ========================================================
      // REDIRECTION
      // ========================================================

      if (data.user.role === "admin") {
        console.log(
          "Administrateur détecté : redirection vers /admin"
        );
      } else {
        console.log(
          "Utilisateur classique connecté."
        );
      }

      setMessage("Connexion réussie !");

    } catch (error) {
      console.error(
        "Erreur connexion :",
        error
      );

      setMessage(
        "Impossible de contacter le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // CRÉATION DE COMPTE
  // ==========================================================

  async function handleRegister(event) {
    event.preventDefault();

    setMessage("");

    // ========================================================
    // NOM UTILISATEUR
    // ========================================================

    if (username.trim().length < 3) {
      setMessage(
        "Le nom d'utilisateur doit contenir au moins 3 caractères."
      );

      return;
    }

    // ========================================================
    // EMAIL
    // ========================================================

    if (!registerEmail.trim()) {
      setMessage(
        "L'adresse email est obligatoire."
      );

      return;
    }

    // ========================================================
    // MOT DE PASSE
    // ========================================================

    if (registerPassword.length < 6) {
      setMessage(
        "Le mot de passe doit contenir au moins 6 caractères."
      );

      return;
    }

    // ========================================================
    // CONFIRMATION
    // ========================================================

    if (
      registerPassword !== confirmPassword
    ) {
      setMessage(
        "Les mots de passe ne correspondent pas."
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            username: username.trim(),
            email: registerEmail.trim(),
            password: registerPassword,
          }),
        }
      );

      const data = await response.json();

      console.log(
        "Réponse inscription :",
        data
      );

      // ========================================================
      // ERREUR
      // ========================================================

      if (!response.ok) {
        setMessage(
          data.message ||
            "Impossible de créer le compte."
        );

        return;
      }

      // ========================================================
      // SUCCÈS
      // ========================================================

      setMessage(
        "Compte créé avec succès ! Vous pouvez maintenant vous connecter."
      );

      // ========================================================
      // VIDER LE FORMULAIRE
      // ========================================================

      setUsername("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");

      // ========================================================
      // RETOUR CONNEXION
      // ========================================================

      setMode("login");

    } catch (error) {
      console.error(
        "Erreur création compte :",
        error
      );

      setMessage(
        "Impossible de contacter le serveur."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // PASSER À L'INSCRIPTION
  // ==========================================================

  function switchToRegister() {
    setMessage("");
    setMode("register");
  }

  // ==========================================================
  // REVENIR À LA CONNEXION
  // ==========================================================

  function switchToLogin() {
    setMessage("");
    setMode("login");
  }

  // ==========================================================
  // DÉCONNEXION
  // ==========================================================

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setMessage("");
    setMode("login");

    window.dispatchEvent(
      new Event("userChanged")
    );

    console.log(
      "Utilisateur déconnecté."
    );
  }

  // ==========================================================
  // ADMIN DÉJÀ CONNECTÉ
  // ==========================================================

  /*
    Si un administrateur arrive sur /se-connecter alors
    qu'il est déjà connecté, on l'envoie directement
    vers la vraie page d'administration.
  */

  if (user?.role === "admin") {
    return (
      <Navigate
        to="/admin"
        replace
      />
    );
  }

  // ==========================================================
  // UTILISATEUR NORMAL DÉJÀ CONNECTÉ
  // ==========================================================

  if (user !== null) {
    return (
      <div className="connexion-page">

        <div className="account-box">

          <h2>
            👤 Mon compte
          </h2>

          <div className="account-info">

            <h3>
              Bonjour {user.username} 👋
            </h3>

            <p>
              Email : {user.email}
            </p>

          </div>

          <button
            type="button"
            className="logout-button"
            onClick={logout}
          >
            🚪 Se déconnecter
          </button>

        </div>

        {message !== "" && (
          <p className="connexion-message">
            {message}
          </p>
        )}

      </div>
    );
  }

  // ==========================================================
  // PAGE CONNEXION / INSCRIPTION
  // ==========================================================

  return (
    <div className="connexion-page">

      <div className="seconnecter-container">

        {/* ====================================================
            CONNEXION
        ==================================================== */}

        {mode === "login" && (
          <>
            <h1>
              Se connecter
            </h1>

            <p className="seconnecter-description">
              Connectez-vous à votre compte WatchNext
            </p>

            <form onSubmit={handleLogin}>

              <div className="form-group">

                <label htmlFor="login-email">
                  Adresse email
                </label>

                <input
                  id="login-email"
                  type="email"
                  placeholder="Votre adresse email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="login-password">
                  Mot de passe
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />

              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Connexion..."
                  : "Se connecter"}
              </button>

            </form>

            <div className="create-account-section">

              <p>
                Vous n'avez pas encore de compte ?
              </p>

              <button
                type="button"
                className="create-account-button"
                onClick={switchToRegister}
              >
                Créer un compte
              </button>

            </div>
          </>
        )}

        {/* ====================================================
            CRÉATION DE COMPTE
        ==================================================== */}

        {mode === "register" && (
          <>
            <h1>
              Créer un compte
            </h1>

            <p className="seconnecter-description">
              Rejoignez WatchNext
            </p>

            <form onSubmit={handleRegister}>

              <div className="form-group">

                <label htmlFor="register-username">
                  Nom d'utilisateur
                </label>

                <input
                  id="register-username"
                  type="text"
                  placeholder="Votre nom d'utilisateur"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="register-email">
                  Adresse email
                </label>

                <input
                  id="register-email"
                  type="email"
                  placeholder="Votre adresse email"
                  value={registerEmail}
                  onChange={(event) =>
                    setRegisterEmail(event.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="register-password">
                  Mot de passe
                </label>

                <input
                  id="register-password"
                  type="password"
                  placeholder="Minimum 6 caractères"
                  value={registerPassword}
                  onChange={(event) =>
                    setRegisterPassword(event.target.value)
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label htmlFor="confirm-password">
                  Confirmer le mot de passe
                </label>

                <input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
                  required
                />

              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading
                  ? "Création..."
                  : "Créer mon compte"}
              </button>

            </form>

            <div className="create-account-section">

              <p>
                Vous avez déjà un compte ?
              </p>

              <button
                type="button"
                className="create-account-button"
                onClick={switchToLogin}
              >
                Se connecter
              </button>

            </div>
          </>
        )}

        {/* ====================================================
            MESSAGE
        ==================================================== */}

        {message !== "" && (
          <p
            className={
              message.includes("succès")
                ? "login-message success"
                : "login-message"
            }
          >
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default SeConnecter;