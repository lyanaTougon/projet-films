import { useEffect, useState } from "react";
import "./admin.css";

const API_URL = "http://localhost:5000";

// ============================================================
// UTILISATEUR CONNECTÉ
// ============================================================

function getSavedUser() {
  const savedUser = localStorage.getItem("user");

  if (!savedUser) {
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
// IMAGE
// ============================================================

function getImagePath(path) {
  if (!path) {
    return "";
  }

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  // Image uploadée sur le backend
  if (path.startsWith("/uploads/")) {
    return `${API_URL}${path}`;
  }

  // Image déjà avec le chemin GitHub Pages
  if (path.startsWith("/projet-films/")) {
    return path;
  }

  // Image du dossier public/images
  if (path.startsWith("/images/")) {
    return `/projet-films${path}`;
  }

  // Autre chemin commençant par /
  if (path.startsWith("/")) {
    return `/projet-films${path}`;
  }

  return `/projet-films/${path}`;
}

// ============================================================
// FORMULAIRE VIDE
// ============================================================

const emptyMovie = {
  title: "",
  type: "Film",
  genre: "",
  synopsis: "",
  poster: "",
  banner: "",
  image1: "",
  image2: "",
  image3: "",
  trailer: "",
  background: "",

  // COULEURS DU CAROUSEL
  carousel_color_1: "#111111",
  carousel_color_2: "#333333",
};

// ============================================================
// COMPOSANT UPLOAD IMAGE
// ============================================================

function ImageUploadField({
  label,
  fieldName,
  description,
  movieForm,
  uploadingImage,
  handleImageUpload,
}) {
  const imageValue = movieForm[fieldName];

  return (
    <div className="form-group">
      <label>{label}</label>

      <input
        type="file"
        accept="image/*"
        onChange={(event) =>
          handleImageUpload(event, fieldName)
        }
        disabled={uploadingImage === fieldName}
      />

      <small>{description}</small>

      {uploadingImage === fieldName && (
        <p className="admin-message">
          ⏳ Envoi de l'image...
        </p>
      )}

      {imageValue && (
        <div
          style={{
            marginTop: "15px",
          }}
        >
          <p>✅ Image sélectionnée</p>

          <img
            src={getImagePath(imageValue)}
            alt="Aperçu"
            style={{
              width: "220px",
              maxHeight: "140px",
              objectFit: "cover",
              borderRadius: "10px",
              display: "block",
              marginTop: "10px",
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN
// ============================================================

function Admin() {
  const [currentUser] = useState(getSavedUser);

  // ==========================================================
  // UTILISATEURS
  // ==========================================================

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ==========================================================
  // FILMS / SÉRIES
  // ==========================================================

  const [movies, setMovies] = useState([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  const [movieForm, setMovieForm] = useState({
    ...emptyMovie,
  });

  const [editingMovieId, setEditingMovieId] = useState(null);
  const [showMovieForm, setShowMovieForm] = useState(false);

  // ==========================================================
  // UPLOAD
  // ==========================================================

  const [uploadingImage, setUploadingImage] = useState("");

  // ==========================================================
  // MESSAGES
  // ==========================================================

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // ==========================================================
  // TOKEN
  // ==========================================================

  function getToken() {
    return localStorage.getItem("token");
  }

  // ==========================================================
  // CHARGEMENT INITIAL
  // ==========================================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "admin") {
      return;
    }

    loadUsers();
    loadMovies();
  }, [currentUser]);

  // ==========================================================
  // CHARGER LES UTILISATEURS
  // ==========================================================

  async function loadUsers() {
    setLoadingUsers(true);

    try {
      const token = getToken();

      if (!token) {
        setMessage("Vous devez être connecté.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/users`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(
          "Erreur utilisateurs :",
          data.message
        );

        setMessage(
          data.message ||
            "Impossible de charger les utilisateurs."
        );

        return;
      }

      setUsers(data.users || []);
    } catch (error) {
      console.error(
        "Erreur chargement utilisateurs :",
        error
      );

      setMessage(
        "Impossible de charger les utilisateurs."
      );
    } finally {
      setLoadingUsers(false);
    }
  }

  // ==========================================================
  // SUPPRIMER UTILISATEUR
  // ==========================================================

  async function deleteUser(id) {
    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cet utilisateur ?"
    );

    if (!confirmation) {
      return;
    }

    const ancienneListe = [...users];

    setUsers((liste) =>
      liste.filter(
        (utilisateur) =>
          Number(utilisateur.id) !== Number(id)
      )
    );

    try {
      const token = getToken();

      if (!token) {
        setUsers(ancienneListe);
        setMessage("Vous devez être connecté.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/users/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setUsers(ancienneListe);

        setMessage(
          data.message ||
            "Impossible de supprimer l'utilisateur."
        );

        return;
      }

      setMessage(
        "Utilisateur supprimé avec succès !"
      );
    } catch (error) {
      console.error(
        "Erreur suppression utilisateur :",
        error
      );

      setUsers(ancienneListe);

      setMessage(
        "Une erreur est survenue lors de la suppression."
      );
    }
  }

  // ==========================================================
  // CHARGER FILMS / SÉRIES
  // ==========================================================

  async function loadMovies() {
    setLoadingMovies(true);

    try {
      const token = getToken();

      if (!token) {
        setMessage("Vous devez être connecté.");
        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/movies`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      console.log("Réponse films :", data);

      if (!response.ok) {
        console.error(
          "Erreur films :",
          data.message
        );

        setMovies([]);

        setMessage(
          data.message ||
            "Impossible de charger les films."
        );

        return;
      }

      setMovies(data.movies || []);
    } catch (error) {
      console.error(
        "Erreur chargement films :",
        error
      );

      setMovies([]);

      setMessage(
        "Impossible de charger les films et séries."
      );
    } finally {
      setLoadingMovies(false);
    }
  }

  // ==========================================================
  // MODIFICATION FORMULAIRE
  // ==========================================================

  function handleMovieChange(event) {
    const { name, value } = event.target;

    setMovieForm((ancienFormulaire) => ({
      ...ancienFormulaire,
      [name]: value,
    }));
  }

  // ==========================================================
  // UPLOAD IMAGE
  // ==========================================================

  async function handleImageUpload(event, fieldName) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    // Vérification image
    if (!file.type.startsWith("image/")) {
      setMessage(
        "Veuillez sélectionner une image."
      );

      event.target.value = "";
      return;
    }

    // Maximum 10 Mo
    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "L'image ne doit pas dépasser 10 Mo."
      );

      event.target.value = "";
      return;
    }

    const token = getToken();

    if (!token) {
      setMessage(
        "Vous devez être connecté pour envoyer une image."
      );

      return;
    }

    setUploadingImage(fieldName);
    setMessage("");

    try {
      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        `${API_URL}/api/admin/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Réponse upload :", data);

      if (!response.ok) {
        setMessage(
          data.message ||
            "Impossible d'envoyer l'image."
        );

        return;
      }

      if (!data.url) {
        setMessage(
          "L'image a été envoyée mais aucune URL n'a été reçue."
        );

        return;
      }

      setMovieForm((ancienFormulaire) => ({
        ...ancienFormulaire,
        [fieldName]: data.url,
      }));

      setMessage(
        "Image envoyée avec succès !"
      );
    } catch (error) {
      console.error(
        "Erreur upload image :",
        error
      );

      setMessage(
        "Impossible d'envoyer l'image."
      );
    } finally {
      setUploadingImage("");
      event.target.value = "";
    }
  }

  // ==========================================================
  // AJOUTER UN FILM / UNE SÉRIE
  // ==========================================================

  function openAddMovieForm() {
    setEditingMovieId(null);

    setMovieForm({
      ...emptyMovie,
    });

    setMessage("");
    setShowMovieForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================================
  // MODIFIER UN FILM / UNE SÉRIE
  // ==========================================================

  function openEditMovieForm(movie) {
    setEditingMovieId(movie.id);

    setMovieForm({
      title: movie.title || "",
      type: movie.type || "Film",
      genre: movie.genre || "",
      synopsis: movie.synopsis || "",

      poster: movie.poster || "",
      banner: movie.banner || "",

      image1: movie.image1 || "",
      image2: movie.image2 || "",
      image3: movie.image3 || "",

      trailer: movie.trailer || "",
      background: movie.background || "",

      // IMPORTANT
      // On récupère les couleurs existantes
      carousel_color_1:
        movie.carousel_color_1 ||
        "#111111",

      carousel_color_2:
        movie.carousel_color_2 ||
        "#333333",
    });

    setMessage("");
    setShowMovieForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ==========================================================
  // FERMER FORMULAIRE
  // ==========================================================

  function closeMovieForm() {
    setShowMovieForm(false);
    setEditingMovieId(null);

    setMovieForm({
      ...emptyMovie,
    });

    setMessage("");
  }

  // ==========================================================
  // RÉCUPÉRER LE FILM DE LA RÉPONSE
  // ==========================================================

  function getMovieFromResponse(data) {
    if (data?.movie) {
      return data.movie;
    }

    if (data?.data) {
      return data.data;
    }

    if (data?.id) {
      return data;
    }

    return null;
  }

  // ==========================================================
  // AJOUTER / MODIFIER
  // ==========================================================

  async function handleMovieSubmit(event) {
    event.preventDefault();

    setMessage("");

    // Vérification titre
    if (!movieForm.title.trim()) {
      setMessage("Le titre est obligatoire.");
      return;
    }

    // Vérification synopsis
    if (!movieForm.synopsis.trim()) {
      setMessage(
        "Le synopsis est obligatoire."
      );
      return;
    }

    const token = getToken();

    if (!token) {
      setMessage("Vous devez être connecté.");
      return;
    }

    const isEditing =
      editingMovieId !== null;

    const movieId =
      editingMovieId;

    // ========================================================
    // DONNÉES ENVOYÉES AU BACKEND
    // ========================================================

    const movieData = {
      title: movieForm.title.trim(),

      type: movieForm.type,

      genre: movieForm.genre.trim(),

      synopsis: movieForm.synopsis.trim(),

      poster: movieForm.poster.trim(),

      banner: movieForm.banner.trim(),

      image1: movieForm.image1.trim(),

      image2: movieForm.image2.trim(),

      image3: movieForm.image3.trim(),

      trailer: movieForm.trailer.trim(),

      background: movieForm.background.trim(),

      // ======================================================
      // COULEURS DU CAROUSEL
      // ======================================================

      carousel_color_1:
        movieForm.carousel_color_1 || "#111111",

      carousel_color_2:
        movieForm.carousel_color_2 || "#333333",
    };

    console.log(
      "===================================="
    );

    console.log(
      "DONNÉES FILM ENVOYÉES AU SERVEUR :"
    );

    console.log(movieData);

    console.log(
      "COULEUR 1 :",
      movieData.carousel_color_1
    );

    console.log(
      "COULEUR 2 :",
      movieData.carousel_color_2
    );

    console.log(
      "===================================="
    );

    const url = isEditing
      ? `${API_URL}/api/admin/movies/${movieId}`
      : `${API_URL}/api/admin/movies`;

    const method = isEditing
      ? "PUT"
      : "POST";

    setLoading(true);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(movieData),
      });

      const data = await response.json();

      console.log(
        "Réponse serveur :",
        data
      );

      if (!response.ok) {
        setMessage(
          data.message ||
            "Impossible d'enregistrer le contenu."
        );

        return;
      }

      const serverMovie =
        getMovieFromResponse(data);

      // ======================================================
      // AJOUT
      // ======================================================

      if (!isEditing) {
        const newMovie =
          serverMovie || {
            ...movieData,
            id: `temporary-${Date.now()}`,
          };

        setMovies((liste) => [
          newMovie,
          ...liste,
        ]);

        setMessage(
          `${movieForm.type} ajouté avec succès !`
        );
      }

      // ======================================================
      // MODIFICATION
      // ======================================================

      else {
        setMovies((liste) =>
          liste.map((movie) => {
            if (
              Number(movie.id) !==
              Number(movieId)
            ) {
              return movie;
            }

            if (serverMovie) {
              return serverMovie;
            }

            return {
              ...movie,
              ...movieData,
              id: movie.id,
            };
          })
        );

        setMessage(
          `${movieForm.type} modifié avec succès !`
        );
      }

      // ======================================================
      // PRÉVENIR LES AUTRES PAGES
      // ======================================================

      window.dispatchEvent(
        new Event("moviesChanged")
      );

      // ======================================================
      // FERMER LE FORMULAIRE
      // ======================================================

      setMovieForm({
        ...emptyMovie,
      });

      setEditingMovieId(null);

      setShowMovieForm(false);

      // ======================================================
      // RECHARGER LES DONNÉES DEPUIS LE SERVEUR
      // ======================================================

      await loadMovies();

    } catch (error) {
      console.error(
        "Erreur sauvegarde contenu :",
        error
      );

      setMessage(
        "Une erreur est survenue lors de l'enregistrement."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // SUPPRIMER FILM / SÉRIE
  // ==========================================================

  async function deleteMovie(id, title) {
    const confirmation = window.confirm(
      `Voulez-vous vraiment supprimer "${title}" ?`
    );

    if (!confirmation) {
      return;
    }

    const ancienneListe = [...movies];

    setMovies((liste) =>
      liste.filter(
        (movie) =>
          Number(movie.id) !==
          Number(id)
      )
    );

    setMessage(
      `"${title}" est en cours de suppression...`
    );

    try {
      const token = getToken();

      if (!token) {
        setMovies(ancienneListe);

        setMessage(
          "Vous devez être connecté."
        );

        return;
      }

      const response = await fetch(
        `${API_URL}/api/admin/movies/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMovies(ancienneListe);

        setMessage(
          data.message ||
            "Impossible de supprimer ce contenu."
        );

        return;
      }

      setMessage(
        `"${title}" a été supprimé avec succès !`
      );

      window.dispatchEvent(
        new Event("moviesChanged")
      );

      if (
        editingMovieId !== null &&
        Number(editingMovieId) ===
          Number(id)
      ) {
        setShowMovieForm(false);
        setEditingMovieId(null);

        setMovieForm({
          ...emptyMovie,
        });
      }
    } catch (error) {
      console.error(
        "Erreur suppression contenu :",
        error
      );

      setMovies(ancienneListe);

      setMessage(
        "Une erreur est survenue lors de la suppression."
      );
    }
  }

  // ==========================================================
  // DÉCONNEXION
  // ==========================================================

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href =
      "/projet-films/se-connecter";
  }

  // ==========================================================
  // PROTECTION
  // ==========================================================

  if (currentUser === null) {
    return (
      <div className="admin-page">
        <div className="admin-container">

          <h1>
            👑 Administration
          </h1>

          <p className="admin-message">
            Vous devez être connecté pour accéder
            à cette page.
          </p>

          <button
            type="button"
            className="admin-logout-button"
            onClick={() => {
              window.location.href =
                "/projet-films/se-connecter";
            }}
          >
            Se connecter
          </button>

        </div>
      </div>
    );
  }

  if (currentUser.role !== "admin") {
    return (
      <div className="admin-page">
        <div className="admin-container">

          <h1>
            🚫 Accès refusé
          </h1>

          <p className="admin-message">
            Cette page est réservée aux administrateurs.
          </p>

          <button
            type="button"
            className="admin-logout-button"
            onClick={() => {
              window.location.href =
                "/projet-films/";
            }}
          >
            Retour à l'accueil
          </button>

        </div>
      </div>
    );
  }

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  return (
    <div className="admin-page">

      <div className="admin-container">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="admin-header">

          <div>
            <h2>
              🎬 Administration WatchNext
            </h2>

            <p>
              Gérez les films et séries de WatchNext.
            </p>
          </div>

          <button
            type="button"
            className="admin-refresh-button"
            onClick={() => {
              loadMovies();
              loadUsers();
            }}
          >
            🔄 Actualiser
          </button>

        </div>

        {/* ==================================================
            MESSAGE
        ================================================== */}

        {message !== "" && (
          <p className="admin-message">
            {message}
          </p>
        )}

        {/* ==================================================
            FILMS / SÉRIES
        ================================================== */}

        <div className="admin-movies-box">

          <div className="admin-movies-header">

            <div>
              <h2>
                🎬 Films et séries
              </h2>

              <p>
                Ajoutez, modifiez ou supprimez
                les contenus de WatchNext.
              </p>
            </div>

            <button
              type="button"
              className="add-movie-button"
              onClick={openAddMovieForm}
            >
              ➕ Ajouter un contenu
            </button>

          </div>

          {/* ==================================================
              FORMULAIRE
          ================================================== */}

          {showMovieForm && (
            <div className="movie-form-box">

              <div className="movie-form-header">

                <div>
                  <h2>
                    {editingMovieId
                      ? "✏️ Modifier le contenu"
                      : "➕ Ajouter un contenu"}
                  </h2>

                  <p>
                    Remplissez les informations
                    du film ou de la série.
                  </p>
                </div>

                <button
                  type="button"
                  className="close-form-button"
                  onClick={closeMovieForm}
                >
                  ✕
                </button>

              </div>

              <form
                className="movie-form"
                onSubmit={handleMovieSubmit}
              >

                {/* ==================================================
                    TITRE
                ================================================== */}

                <div className="form-group">

                  <label htmlFor="movie-title">
                    Titre *
                  </label>

                  <input
                    id="movie-title"
                    name="title"
                    type="text"
                    placeholder="Ex : L'Odyssée"
                    value={movieForm.title}
                    onChange={handleMovieChange}
                    required
                  />

                </div>

                {/* ==================================================
                    TYPE
                ================================================== */}

                <div className="form-group">

                  <label htmlFor="movie-type">
                    Type *
                  </label>

                  <select
                    id="movie-type"
                    name="type"
                    value={movieForm.type}
                    onChange={handleMovieChange}
                  >
                    <option value="Film">
                      🎬 Film
                    </option>

                    <option value="Série">
                      📺 Série
                    </option>
                  </select>

                </div>

                {/* ==================================================
                    GENRE
                ================================================== */}

                <div className="form-group">

                  <label htmlFor="movie-genre">
                    🎭 Genre
                  </label>

                  <input
                    id="movie-genre"
                    name="genre"
                    type="text"
                    placeholder="Ex : Action, Animation, Drame..."
                    value={movieForm.genre}
                    onChange={handleMovieChange}
                  />

                </div>

                {/* ==================================================
                    SYNOPSIS
                ================================================== */}

                <div className="form-group">

                  <label htmlFor="movie-synopsis">
                    Synopsis *
                  </label>

                  <textarea
                    id="movie-synopsis"
                    name="synopsis"
                    rows="7"
                    placeholder="Écrivez le synopsis..."
                    value={movieForm.synopsis}
                    onChange={handleMovieChange}
                    required
                  />

                </div>

                {/* ==================================================
                    POSTER
                ================================================== */}

                <ImageUploadField
                  label="🖼️ Image de couverture"
                  fieldName="poster"
                  description="Sélectionnez directement une image depuis votre ordinateur."
                  movieForm={movieForm}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                />

                {/* ==================================================
                    BANNER
                ================================================== */}

                <ImageUploadField
                  label="🖼️ Image Banner"
                  fieldName="banner"
                  description="Image utilisée pour le carousel."
                  movieForm={movieForm}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                />

                {/* ==================================================
                    BACKGROUND
                ================================================== */}

                <ImageUploadField
                  label="🎨 Background"
                  fieldName="background"
                  description="Image de fond utilisée sur la page du contenu."
                  movieForm={movieForm}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                />

                {/* ==================================================
                    COULEURS CAROUSEL
                ================================================== */}

                <div className="form-row">

                  {/* COULEUR 1 */}

                  <div className="form-group">

                    <label htmlFor="movie-color-1">
                      🎨 Couleur carousel 1
                    </label>

                    <div className="color-input">

                      <input
                        id="movie-color-1"
                        name="carousel_color_1"
                        type="color"
                        value={
                          movieForm.carousel_color_1
                        }
                        onChange={handleMovieChange}
                      />

                      <span>
                        {movieForm.carousel_color_1}
                      </span>

                    </div>

                  </div>

                  {/* COULEUR 2 */}

                  <div className="form-group">

                    <label htmlFor="movie-color-2">
                      🎨 Couleur carousel 2
                    </label>

                    <div className="color-input">

                      <input
                        id="movie-color-2"
                        name="carousel_color_2"
                        type="color"
                        value={
                          movieForm.carousel_color_2
                        }
                        onChange={handleMovieChange}
                      />

                      <span>
                        {movieForm.carousel_color_2}
                      </span>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    APERÇU CAROUSEL
                ================================================== */}

                <div className="carousel-preview">

                  <span>
                    Aperçu du carousel
                  </span>

                  <div
                    className="carousel-preview-colors"
                    style={{
                      background: `linear-gradient(
                        135deg,
                        ${movieForm.carousel_color_1},
                        ${movieForm.carousel_color_2}
                      )`,
                    }}
                  >
                    <strong>
                      {movieForm.title ||
                        "Votre film"}
                    </strong>
                  </div>

                </div>

                {/* ==================================================
                    IMAGE 1
                ================================================== */}

                <ImageUploadField
                  label="🖼️ Image supplémentaire 1"
                  fieldName="image1"
                  description="Première image affichée dans les détails."
                  movieForm={movieForm}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                />

                {/* ==================================================
                    IMAGE 2
                ================================================== */}

                <ImageUploadField
                  label="🖼️ Image supplémentaire 2"
                  fieldName="image2"
                  description="Deuxième image affichée dans les détails."
                  movieForm={movieForm}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                />

                {/* ==================================================
                    IMAGE 3
                ================================================== */}

                <ImageUploadField
                  label="🖼️ Image supplémentaire 3"
                  fieldName="image3"
                  description="Troisième image affichée dans les détails."
                  movieForm={movieForm}
                  uploadingImage={uploadingImage}
                  handleImageUpload={handleImageUpload}
                />

                {/* ==================================================
                    TRAILER
                ================================================== */}

                <div className="form-group">

                  <label htmlFor="movie-trailer">
                    🎥 Trailer YouTube
                  </label>

                  <input
                    id="movie-trailer"
                    name="trailer"
                    type="url"
                    placeholder="https://www.youtube.com/embed/..."
                    value={movieForm.trailer}
                    onChange={handleMovieChange}
                  />

                  <small>
                    Collez le lien embed du trailer YouTube.
                  </small>

                </div>

                {/* ==================================================
                    BOUTONS
                ================================================== */}

                <div className="movie-form-actions">

                  <button
                    type="button"
                    className="cancel-movie-button"
                    onClick={closeMovieForm}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="save-movie-button"
                    disabled={
                      loading ||
                      uploadingImage !== ""
                    }
                  >
                    {loading
                      ? "Enregistrement..."
                      : editingMovieId
                      ? "💾 Enregistrer les modifications"
                      : "➕ Ajouter le contenu"}
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* ==================================================
              LISTE DES FILMS
          ================================================== */}

          {loadingMovies ? (

            <div className="admin-empty">

              <p>
                Chargement des films et séries...
              </p>

            </div>

          ) : movies.length === 0 ? (

            <div className="admin-empty">

              <div className="admin-empty-icon">
                🎬
              </div>

              <h3>
                Aucun film ou série
              </h3>

              <p>
                Aucun contenu n'a encore été ajouté.
              </p>

              <button
                type="button"
                className="add-movie-button"
                onClick={openAddMovieForm}
              >
                ➕ Ajouter le premier contenu
              </button>

            </div>

          ) : (

            <div className="movies-admin-list">

              {movies.map((movie) => (

                <div
                  className="movie-admin-row"
                  key={movie.id}
                >

                  {/* IMAGE */}

                  <div className="movie-admin-poster">

                    {movie.poster ? (

                      <img
                        src={getImagePath(movie.poster)}
                        alt={movie.title}
                      />

                    ) : (

                      <div className="no-poster">
                        🎬
                      </div>

                    )}

                  </div>

                  {/* INFORMATIONS */}

                  <div className="movie-admin-info">

                    <div className="movie-admin-title">

                      <h3>
                        {movie.title}
                      </h3>

                      <span className="movie-type-badge">
                        {movie.type === "Série" ||
                        movie.type === "Serie"
                          ? "📺 Série"
                          : "🎬 Film"}
                      </span>

                    </div>

                    {movie.genre && (
                      <p className="movie-admin-genre">
                        🎭 {movie.genre}
                      </p>
                    )}

                    <p className="movie-admin-synopsis">
                      {movie.synopsis ||
                        "Aucun synopsis."}
                    </p>

                    <div className="movie-admin-extra">

                      {movie.poster && (
                        <span>
                          🖼️ Couverture
                        </span>
                      )}

                      {movie.banner && (
                        <span>
                          🖼️ Banner
                        </span>
                      )}

                      {movie.image1 && (
                        <span>
                          🖼️ Image 1
                        </span>
                      )}

                      {movie.image2 && (
                        <span>
                          🖼️ Image 2
                        </span>
                      )}

                      {movie.image3 && (
                        <span>
                          🖼️ Image 3
                        </span>
                      )}

                      {movie.trailer && (
                        <span>
                          🎥 Trailer
                        </span>
                      )}

                      {movie.background && (
                        <span>
                          🎨 Background
                        </span>
                      )}

                      {/* COULEURS */}

                      {movie.carousel_color_1 &&
                        movie.carousel_color_2 && (
                          <span>
                            🎨 Couleurs carousel
                          </span>
                        )}

                    </div>

                  </div>

                  {/* ACTIONS */}

                  <div className="movie-admin-actions">

                    <button
                      type="button"
                      className="edit-movie-button"
                      onClick={() =>
                        openEditMovieForm(movie)
                      }
                    >
                      ✏️ Modifier
                    </button>

                    <button
                      type="button"
                      className="delete-movie-button"
                      onClick={() =>
                        deleteMovie(
                          movie.id,
                          movie.title
                        )
                      }
                    >
                      🗑️ Supprimer
                    </button>

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>

        {/* ==================================================
            UTILISATEURS
        ================================================== */}

        <div className="admin-users-box">

          <div className="admin-users-header">

            <div>

              <h2>
                👥 Utilisateurs
              </h2>

              <p>
                Gestion des comptes WatchNext.
              </p>

            </div>

            <span>
              {users.length} compte(s)
            </span>

          </div>

          {loadingUsers ? (

            <div className="admin-empty">

              <p>
                Chargement des utilisateurs...
              </p>

            </div>

          ) : users.length === 0 ? (

            <div className="admin-empty">

              <p>
                Aucun utilisateur trouvé.
              </p>

            </div>

          ) : (

            <div className="users-list">

              {users.map((utilisateur) => {

                const isCurrentUser =
                  Number(utilisateur.id) ===
                  Number(currentUser.id);

                return (

                  <div
                    className="user-row"
                    key={utilisateur.id}
                  >

                    <div className="user-info">

                      <div className="user-main-info">

                        <strong>
                          {utilisateur.username}
                        </strong>

                        {utilisateur.role ===
                          "admin" && (
                          <span className="admin-badge">
                            👑 Admin
                          </span>
                        )}

                      </div>

                      <span>
                        ID : {utilisateur.id}
                      </span>

                      {utilisateur.email && (
                        <span>
                          📧 {utilisateur.email}
                        </span>
                      )}

                      {utilisateur.role && (
                        <span>
                          Rôle :{" "}
                          {utilisateur.role}
                        </span>
                      )}

                    </div>

                    <div className="user-actions">

                      {isCurrentUser ? (

                        <span className="current-user">
                          Votre compte
                        </span>

                      ) : (

                        <button
                          type="button"
                          className="delete-user-button"
                          onClick={() =>
                            deleteUser(
                              utilisateur.id
                            )
                          }
                        >
                          🗑️ Supprimer
                        </button>

                      )}

                    </div>

                  </div>

                );
              })}

            </div>

          )}

        </div>

        {/* ==================================================
            DÉCONNEXION
        ================================================== */}

        <div className="admin-footer">

          <button
            type="button"
            className="admin-logout-button"
            onClick={logout}
          >
            🚪 Se déconnecter
          </button>

        </div>

      </div>
    </div>
  );
}

export default Admin;