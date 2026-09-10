// ============================================================
// APP.JSX
// ============================================================

import { useState, useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  useNavigate,
  useParams,
  useLocation,
  Navigate,
} from "react-router-dom";

import "./App.css";

// ============================================================
// IMPORT DES PAGES
// ============================================================

import Films from "./Pages/films.jsx";
import Series from "./Pages/series.jsx";
import SeConnecter from "./Pages/seconnecter.jsx";
import Note from "./Pages/note.jsx";
import Favoris from "./Pages/favoris.jsx";

// ============================================================
// PAGE ADMIN
// ============================================================

import Admin from "./Pages/Admin/admin.jsx";

// ============================================================
// PAGE DÉTAIL
// ============================================================

import Details from "./details.jsx";

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = "http://localhost:5000";
const BASE_URL = import.meta.env.BASE_URL;

// ============================================================
// FOND PAR ROUTE (pleine page, derrière sidebar + navbar)
// ============================================================

const FULL_BG_ROUTES = {
  "/films": "linear-gradient(to bottom, #381d42c1, #0d0d0d)",
  "/series": "linear-gradient(to bottom, #381d42c1, #0d0d0d)",
  "/note": "linear-gradient(to bottom, #82628ec1, #42304a)",
  "/favoris": "linear-gradient(to bottom, #82628ec1, #42304a)",
  "/se-connecter": "linear-gradient(to bottom, #381d42c1, #7f7a81)",
};

// ============================================================
// GESTION DES IMAGES
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

  if (path.startsWith("/projet-films/")) {
    return path;
  }

  return `${BASE_URL}${path.replace(/^\/+/, "")}`;
}

// ============================================================
// RÉCUPÉRER L'UTILISATEUR CONNECTÉ
// ============================================================

function getCurrentUser() {
  const savedUser = localStorage.getItem("user");

  if (!savedUser) {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error(
      "Erreur récupération utilisateur :",
      error
    );

    localStorage.removeItem("user");
    localStorage.removeItem("token");

    return null;
  }
}

// ============================================================
// PROTECTION PAGE ADMIN
// ============================================================

function AdminOnlyRoute({ children, user }) {
  if (!user) {
    return (
      <Navigate
        to="/se-connecter"
        replace
      />
    );
  }

  if (user.role !== "admin") {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}

// ============================================================
// SIDEBAR
// ============================================================

function Sidebar({ user }) {
  const admin = user?.role === "admin";

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        🎬 WatchNext
      </div>

      <ul className="sidebar-links">
        <li>
          <NavLink
            to="/"
            end
          >
            Accueil
          </NavLink>
        </li>

        <li>
          <NavLink to="/favoris">
            Favoris
          </NavLink>
        </li>

        <li>
          <NavLink to="/note">
            Notes
          </NavLink>
        </li>

        <li>
          <NavLink
            to={
              admin
                ? "/admin"
                : "/se-connecter"
            }
          >
            {admin
              ? "👑 Mon compte"
              : "Mon compte"}
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}

// ============================================================
// BARRE DU HAUT
// ============================================================

function TopNavbar({ user }) {
  const navigate = useNavigate();
  const admin = user?.role === "admin";

  return (
    <div className="top-navbar">
      <ul className="top-navbar-links">
        <li>
          <NavLink to="/films">
            Films
          </NavLink>
        </li>

        <li>
          <NavLink to="/series">
            Séries
          </NavLink>
        </li>
      </ul>

      <div className="top-navbar-right">
        <button
          type="button"
          className="user-icon"
          aria-label={
            admin
              ? "Mon compte administrateur"
              : "Mon compte"
          }
          title={
            admin
              ? "Mon compte administrateur"
              : "Mon compte"
          }
          onClick={() => {
            if (admin) {
              navigate("/admin");
            } else {
              navigate("/se-connecter");
            }
          }}
        >
          {admin ? "👑" : "👤"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// CAROUSEL
// ============================================================

function Carousel({ movies }) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const hasMovies =
    Array.isArray(movies) &&
    movies.length > 0;

  const current = hasMovies
    ? movies[
        Math.min(
          index,
          movies.length - 1
        )
      ]
    : null;

  useEffect(() => {
    if (!hasMovies) {
      return;
    }

    movies.forEach((movie) => {
      const imagePath =
        movie.banner ||
        movie.poster;

      if (!imagePath) {
        return;
      }

      const image = new Image();
      image.src =
        getImagePath(imagePath);
    });
  }, [movies, hasMovies]);

  useEffect(() => {
    if (!current) {
      return;
    }

    document.body.style.background =
      current.background ||
      "#c5c4c4";

    return () => {
      document.body.style.background = "";
    };
  }, [current]);

  function previousSlide() {
    setIndex((oldIndex) => {
      if (oldIndex === 0) {
        return movies.length - 1;
      }

      return oldIndex - 1;
    });
  }

  function nextSlide() {
    setIndex((oldIndex) => {
      if (
        oldIndex ===
        movies.length - 1
      ) {
        return 0;
      }

      return oldIndex + 1;
    });
  }

  function voirPlus() {
    if (!current) {
      return;
    }

    navigate(
      `/film/${current.id}`
    );
  }

  if (!hasMovies || !current) {
    return null;
  }

  const imagePath =
    current.banner ||
    current.poster;

  return (
    <div className="carousel">
      <div
        className="carousel-slide"
        style={{
          background:
            current.background ||
            "#969696",
        }}
      >
        {imagePath ? (
          <img
            src={getImagePath(
              imagePath
            )}
            alt={current.title}
            draggable="false"
          />
        ) : (
          <div className="carousel-no-image">
            🎬
          </div>
        )}

        <div className="carousel-info">
          <h3>
            {current.title}
          </h3>

          <p className="carousel-synopsis">
            {current.synopsis}
          </p>
        </div>

        <button
          type="button"
          className="carousel-more-button"
          onClick={voirPlus}
        >
          Voir plus
        </button>

<div className="carousel-arrows">
  <button
    type="button"
    className="carousel-arrow"
    onClick={previousSlide}
    aria-label="Contenu précédent"
  >
    ‹
  </button>

  <button
    type="button"
    className="carousel-arrow"
    onClick={nextSlide}
    aria-label="Contenu suivant"
  >
    ›
  </button>
</div>

        <div className="carousel-indicators">
          {movies.map(
            (movie, movieIndex) => (
              <button
                key={
                  movie.id ||
                  movieIndex
                }
                type="button"
                className={
                  movieIndex === index
                    ? "carousel-indicator active"
                    : "carousel-indicator"
                }
                onClick={() =>
                  setIndex(movieIndex)
                }
                aria-label={
                  `Afficher ${movie.title}`
                }
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE ACCUEIL
// ============================================================

function Accueil() {
  const navigate = useNavigate();

  const [movies, setMovies] =
    useState([]);

  const [carouselMovies, setCarouselMovies] =
    useState([]);

  const [loadingMovies, setLoadingMovies] =
    useState(true);

  async function loadMovies() {
    try {
      setLoadingMovies(true);

      const response = await fetch(
        `${API_URL}/api/movies`
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les films et séries."
        );
      }

      const data =
        await response.json();

      let allMovies = [];

      if (Array.isArray(data)) {
        allMovies = data;
      } else if (
        Array.isArray(data.movies)
      ) {
        allMovies = data.movies;
      } else if (
        Array.isArray(data.results)
      ) {
        allMovies = data.results;
      }

      console.log(
        "Contenus récupérés depuis PostgreSQL :",
        allMovies
      );

      setMovies(allMovies);

      const shuffled =
        [...allMovies].sort(
          () => Math.random() - 0.5
        );

      const randomSuggestions =
        shuffled.slice(0, 4);

      setCarouselMovies(
        randomSuggestions
      );
    } catch (error) {
      console.error(
        "Erreur chargement Accueil :",
        error
      );

      setMovies([]);
      setCarouselMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovies();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    function handleMoviesChanged() {
      loadMovies();
    }

    window.addEventListener(
      "moviesChanged",
      handleMoviesChanged
    );

    return () => {
      window.removeEventListener(
        "moviesChanged",
        handleMoviesChanged
      );
    };
  }, []);

  const latestMovies =
    [...movies]
      .sort((a, b) => {
        const dateA =
          new Date(
            a.created_at || 0
          ).getTime();

        const dateB =
          new Date(
            b.created_at || 0
          ).getTime();

        return dateB - dateA;
      })
      .slice(0, 4);

  return (
    <div className="home-main">
      <h2 className="section-title">
        4 suggestions de films / séries 🎬
      </h2>

      {loadingMovies ? (
        <div className="carousel-loading">
          Chargement des suggestions...
        </div>
      ) : carouselMovies.length > 0 ? (
        <Carousel
          movies={carouselMovies}
        />
      ) : (
        <div className="carousel-loading">
          Aucun film ou série disponible.
        </div>
      )}

      <h2 className="section-title">
        4 derniers films / séries récemment ajoutés 🎬
      </h2>

      {loadingMovies ? (
        <div className="carousel-loading">
          Chargement des contenus...
        </div>
      ) : latestMovies.length > 0 ? (
        <div className="results-section">
          {latestMovies.map(
            (movie) => (
              <div
                className="movie-card"
                key={movie.id}
              >
                {movie.poster ? (
                  <img
                    src={getImagePath(
                      movie.poster
                    )}
                    alt={movie.title}
                    draggable="false"
                  />
                ) : (
                  <div className="no-poster">
                    🎬
                  </div>
                )}

                <div className="movie-card-info">
                  <h3>
                    {movie.title}
                  </h3>

                  <span className="movie-card-type">
                    {String(
                      movie.type || ""
                    ).toLowerCase() ===
                      "serie" ||
                    String(
                      movie.type || ""
                    ).toLowerCase() ===
                      "série"
                      ? "📺 Série"
                      : "🎬 Film"}
                  </span>

                  {movie.genre && (
                    <span className="movie-card-genre">
                      {movie.genre}
                    </span>
                  )}

                  <button
                    type="button"
                    className="movie-card-view"
                    onClick={() =>
                      navigate(
                        `/film/${movie.id}`
                      )
                    }
                  >
                    Voir
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      ) : (
        <div className="carousel-loading">
          Aucun contenu disponible.
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGE DÉTAIL FILM / SÉRIE
// ============================================================

function FilmDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  async function loadMovie() {
    try {
      setLoading(true);

      const response =
        await fetch(
          `${API_URL}/api/movies/${id}`
        );

      if (!response.ok) {
        if (
          response.status === 404
        ) {
          setMovie(null);
          return;
        }

        throw new Error(
          "Impossible de récupérer ce contenu."
        );
      }

      const data =
        await response.json();

      setMovie(data);
    } catch (error) {
      console.error(
        "Erreur chargement détail :",
        error
      );

      setMovie(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMovie();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [id]);

  useEffect(() => {
    function handleMoviesChanged() {
      loadMovie();
    }

    window.addEventListener(
      "moviesChanged",
      handleMoviesChanged
    );

    return () => {
      window.removeEventListener(
        "moviesChanged",
        handleMoviesChanged
      );
    };
  }, [id]);

  useEffect(() => {
    if (!movie) {
      return;
    }

    document.body.style.background =
      movie.background ||
      "#c5c4c4";

    return () => {
      document.body.style.background = "";
    };
  }, [movie]);

  if (loading) {
    return (
      <div className="film-detail">
        <h2>
          Chargement...
        </h2>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="film-detail">
        <h2>
          Film ou série introuvable
        </h2>

        <button
          type="button"
          className="back-button"
          onClick={() =>
            navigate("/")
          }
        >
          ← Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <Details
      movie={movie}
    />
  );
}

// ============================================================
// CONTENU DE L'APPLICATION (À L'INTÉRIEUR DU ROUTER)
// ============================================================

function AppRoutes({ user }) {
  const location = useLocation();

  // ----------------------------------------------------------
  // FOND PLEIN ÉCRAN (derrière sidebar + navbar) SELON LA ROUTE
  // ----------------------------------------------------------

  useEffect(() => {
    const bg = FULL_BG_ROUTES[location.pathname];

    if (bg) {
      document.body.style.background = bg;
    } else {
      document.body.style.background = "";
    }
  }, [location.pathname]);

  return (
    <div className="app">

      {/* ================================================
          SIDEBAR
      ================================================= */}

      <Sidebar
        user={user}
      />

      <div className="app-content">

        {/* ==============================================
            BARRE DU HAUT
        =============================================== */}

        <TopNavbar
          user={user}
        />

        {/* ==============================================
            CONTENU
        =============================================== */}

        <main className="page-content">

          <Routes>

            {/* ==========================================
                ACCUEIL
            =========================================== */}

            <Route
              path="/"
              element={
                <Accueil />
              }
            />

            {/* ==========================================
                FILMS
            =========================================== */}

            <Route
              path="/films"
              element={
                <Films />
              }
            />

            {/* ==========================================
                SÉRIES
            =========================================== */}

            <Route
              path="/series"
              element={
                <Series />
              }
            />

            {/* ==========================================
                FAVORIS
            =========================================== */}

            <Route
              path="/favoris"
              element={
                <Favoris />
              }
            />

            {/* ==========================================
                NOTES
            =========================================== */}

            <Route
              path="/note"
              element={
                <Note />
              }
            />

            {/* ==========================================
                CONNEXION
            =========================================== */}

            <Route
              path="/se-connecter"
              element={
                <SeConnecter />
              }
            />

            {/* ==========================================
                ADMIN
            =========================================== */}

            <Route
              path="/admin"
              element={
                <AdminOnlyRoute
                  user={user}
                >
                  <Admin />
                </AdminOnlyRoute>
              }
            />

            {/* ==========================================
                DÉTAIL FILM / SÉRIE
            =========================================== */}

            <Route
              path="/film/:id"
              element={
                <FilmDetail />
              }
            />

            {/* ==========================================
                PAGE INEXISTANTE
            =========================================== */}

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />

          </Routes>

        </main>
      </div>
    </div>
  );
}

// ============================================================
// APPLICATION
// ============================================================

function App() {
  const [user, setUser] =
    useState(getCurrentUser);

  useEffect(() => {
    function updateUser() {
      setUser(
        getCurrentUser()
      );
    }

    window.addEventListener(
      "storage",
      updateUser
    );

    window.addEventListener(
      "userChanged",
      updateUser
    );

    return () => {
      window.removeEventListener(
        "storage",
        updateUser
      );

      window.removeEventListener(
        "userChanged",
        updateUser
      );
    };
  }, []);

  return (
    <BrowserRouter
      basename={BASE_URL}
    >
      <AppRoutes user={user} />
    </BrowserRouter>
  );
}

// ============================================================
// EXPORT
// ============================================================

export default App;