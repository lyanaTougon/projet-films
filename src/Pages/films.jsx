import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./films.css";

// ============================================================
// CONFIGURATION
// ============================================================

const API_URL = "http://localhost:5000";
const BASE_URL = import.meta.env.BASE_URL;

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
// AFFICHAGE DES ÉTOILES
// ============================================================

function Stars({ rating }) {
  const roundedRating = Math.round(rating * 2) / 2;
  const fullStars = Math.floor(roundedRating);
  const halfStar = roundedRating % 1 !== 0;

  const emptyStars =
    5 - fullStars - (halfStar ? 1 : 0);

  return (
    <span className="rating-stars">
      {"★".repeat(fullStars)}
      {halfStar && "½"}
      {"☆".repeat(emptyStars)}
    </span>
  );
}

// ============================================================
// PAGE FILMS
// ============================================================

function Films() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // ÉTATS
  // ----------------------------------------------------------

  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("Tous");
  const [ratings, setRatings] = useState({});
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [loadingRatings, setLoadingRatings] = useState(true);

  // ----------------------------------------------------------
  // RÉCUPÉRER LES FILMS DEPUIS POSTGRESQL
  // ----------------------------------------------------------

  async function loadMovies() {
    try {
      setLoadingMovies(true);

      const response = await fetch(
        `${API_URL}/api/movies`
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les films."
        );
      }

      const data = await response.json();

      // Le backend peut renvoyer directement un tableau
      // ou un objet contenant movies/results.
      let allMovies = [];

      if (Array.isArray(data)) {
        allMovies = data;
      } else if (Array.isArray(data.movies)) {
        allMovies = data.movies;
      } else if (Array.isArray(data.results)) {
        allMovies = data.results;
      }

      // ------------------------------------------------------
      // ON GARDE UNIQUEMENT LES FILMS
      // ------------------------------------------------------

      const filmList = allMovies.filter((movie) => {
        const type = String(movie.type || "")
          .trim()
          .toLowerCase();

        return type === "film";
      });

      setMovies(filmList);
    } catch (error) {
      console.error(
        "Erreur récupération des films :",
        error
      );

      setMovies([]);
    } finally {
      setLoadingMovies(false);
    }
  }

  // ----------------------------------------------------------
  // CHARGEMENT INITIAL
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchMovies() {
      try {
        const response = await fetch(
          `${API_URL}/api/movies`
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les films."
          );
        }

        const data = await response.json();

        let allMovies = [];

        if (Array.isArray(data)) {
          allMovies = data;
        } else if (Array.isArray(data.movies)) {
          allMovies = data.movies;
        } else if (Array.isArray(data.results)) {
          allMovies = data.results;
        }

        const filmList = allMovies.filter((movie) => {
          const type = String(movie.type || "")
            .trim()
            .toLowerCase();

          return type === "film";
        });

        if (!cancelled) {
          setMovies(filmList);
        }
      } catch (error) {
        console.error(
          "Erreur récupération des films :",
          error
        );

        if (!cancelled) {
          setMovies([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingMovies(false);
        }
      }
    }

    fetchMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // RECHARGER APRÈS AJOUT / MODIFICATION / SUPPRESSION
  // ----------------------------------------------------------

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

  // ----------------------------------------------------------
  // RÉCUPÉRER LES MOYENNES DES NOTES
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function loadRatings() {
      if (movies.length === 0) {
        if (!cancelled) {
          setRatings({});
          setLoadingRatings(false);
        }

        return;
      }

      try {
        setLoadingRatings(true);

        const results = await Promise.all(
          movies.map(async (movie) => {
            try {
              const response = await fetch(
                `${API_URL}/api/ratings/movie/${movie.id}`
              );

              if (!response.ok) {
                return {
                  id: movie.id,
                  average_rating: 0,
                  rating_count: 0,
                };
              }

              const data = await response.json();

              return {
                id: movie.id,
                average_rating:
                  Number(data.average_rating) || 0,
                rating_count:
                  Number(data.rating_count) || 0,
              };
            } catch (error) {
              console.error(
                `Erreur note du film ${movie.title} :`,
                error
              );

              return {
                id: movie.id,
                average_rating: 0,
                rating_count: 0,
              };
            }
          })
        );

        const ratingsObject = {};

        results.forEach((item) => {
          ratingsObject[item.id] = {
            average: item.average_rating,
            count: item.rating_count,
          };
        });

        if (!cancelled) {
          setRatings(ratingsObject);
        }
      } catch (error) {
        console.error(
          "Erreur récupération des notes :",
          error
        );
      } finally {
        if (!cancelled) {
          setLoadingRatings(false);
        }
      }
    }

    loadRatings();

    return () => {
      cancelled = true;
    };
  }, [movies]);

  // ----------------------------------------------------------
  // GENRES
  // ----------------------------------------------------------

  const genres = [
    "Tous",
    ...new Set(
      movies
        .map((movie) => movie.genre)
        .filter(Boolean)
    ),
  ];

  // ----------------------------------------------------------
  // FILTRAGE
  // ----------------------------------------------------------

  const filteredMovies = movies.filter((movie) => {
    const title = String(movie.title || "");

    const matchesSearch = title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesGenre =
      genre === "Tous" ||
      movie.genre === genre;

    return matchesSearch && matchesGenre;
  });

  // ----------------------------------------------------------
  // TOP 5 DES FILMS
  // ----------------------------------------------------------

  const topMovies = [...movies]
    .filter((movie) => {
      const rating = ratings[movie.id];

      return rating && rating.count > 0;
    })
    .sort((a, b) => {
      const ratingA =
        ratings[a.id]?.average || 0;

      const ratingB =
        ratings[b.id]?.average || 0;

      return ratingB - ratingA;
    })
    .slice(0, 5);

  // ----------------------------------------------------------
  // AFFICHAGE
  // ----------------------------------------------------------

  return (
    <div className="films-page">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="films-header">
        <h1>
          Tous les films 🎬
        </h1>

        <p>
          Retrouvez tous les films disponibles sur WatchNext.
        </p>
      </div>

      {/* ======================================================
          FILTRES
      ====================================================== */}

      <div className="films-filters">

        <div className="films-search">
          <input
            type="text"
            placeholder="Rechercher un film..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </div>

        <div className="films-genre">
          <label htmlFor="genre">
            Genre :
          </label>

          <select
            id="genre"
            value={genre}
            onChange={(event) =>
              setGenre(event.target.value)
            }
          >
            {genres.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* ======================================================
          CHARGEMENT
      ====================================================== */}

      {loadingMovies ? (
        <div className="no-results">
          <h2>
            Chargement des films... 🎬
          </h2>

          <p>
            Récupération des films depuis WatchNext.
          </p>
        </div>
      ) : (
        <>
          {/* ==================================================
              NOMBRE DE RÉSULTATS
          ================================================== */}

          <div className="films-count">
            {filteredMovies.length} film
            {filteredMovies.length > 1 ? "s" : ""}
          </div>

          {/* ==================================================
              CARTES DES FILMS
          ================================================== */}

          {filteredMovies.length > 0 ? (
            <div className="films-grid">

              {filteredMovies.map((movie) => {
                const rating =
                  ratings[movie.id];

                return (
                  <div
                    className="film-card"
                    key={movie.id}
                    onClick={() =>
                      navigate(
                        `/film/${movie.id}`
                      )
                    }
                  >

                    {/* ==============================
                        IMAGE
                    ============================== */}

                    <img
                      src={getImagePath(
                        movie.poster
                      )}
                      alt={movie.title}
                      draggable="false"
                      onError={(event) => {
                        console.error(
                          "Image introuvable :",
                          event.currentTarget.src
                        );
                      }}
                    />

                    {/* ==============================
                        INFORMATIONS
                    ============================== */}

                    <div className="film-card-info">

                      <h2>
                        {movie.title}
                      </h2>

                      <span>
                        {movie.genre || "Genre non renseigné"}
                      </span>

                      {/* ============================
                          NOTE MOYENNE
                      ============================ */}

                      {rating &&
                      rating.count > 0 ? (
                        <div className="film-rating">

                          <div className="film-rating-stars">
                            <Stars
                              rating={
                                rating.average
                              }
                            />
                          </div>

                          <strong>
                            {rating.average.toFixed(
                              1
                            )}{" "}
                            / 5
                          </strong>

                          <small>
                            ({rating.count})
                          </small>

                        </div>
                      ) : (
                        <div className="film-rating no-rating">
                          ☆ Aucune note
                        </div>
                      )}

                      {/* ============================
                          BOUTON VOIR
                      ============================ */}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();

                          navigate(
                            `/film/${movie.id}`
                          );
                        }}
                      >
                        Voir
                      </button>

                    </div>
                  </div>
                );
              })}

            </div>
          ) : (
            /* =================================================
               AUCUN RÉSULTAT
            ================================================= */

            <div className="no-results">
              <h2>
                Aucun film trouvé 😕
              </h2>

              <p>
                Aucun film ne correspond à votre recherche.
              </p>
            </div>
          )}

          {/* ==================================================
              TOP 5 DES FILMS
          ================================================== */}

          {!loadingRatings &&
            topMovies.length > 0 && (
              <section className="top-rated-section">

                <div className="top-rated-header">

                  <h2>
                    🏆 Top 5 des films les mieux notés
                  </h2>

                  <p>
                    Classement basé sur les notes de tous les utilisateurs.
                  </p>

                </div>

                <div className="top-rated-grid">

                  {topMovies.map(
                    (movie, index) => {
                      const rating =
                        ratings[movie.id];

                      return (
                        <div
                          className="top-rated-card"
                          key={movie.id}
                          onClick={() =>
                            navigate(
                              `/film/${movie.id}`
                            )
                          }
                        >

                          {/* ==========================
                              CLASSEMENT
                          ========================== */}

                          <div className="top-position">
                            {index === 0 &&
                              "🥇"}

                            {index === 1 &&
                              "🥈"}

                            {index === 2 &&
                              "🥉"}

                            {index > 2 &&
                              `${index + 1}️⃣`}
                          </div>

                          {/* ==========================
                              AFFICHE
                          ========================== */}

                          <img
                            src={getImagePath(
                              movie.poster
                            )}
                            alt={movie.title}
                            draggable="false"
                          />

                          {/* ==========================
                              INFORMATIONS
                          ========================== */}

                          <div className="top-rated-info">

                            <h3>
                              {movie.title}
                            </h3>

                            <div className="average-rating">

                              <Stars
                                rating={
                                  rating.average
                                }
                              />

                              <strong>
                                {rating.average.toFixed(
                                  1
                                )}{" "}
                                / 5
                              </strong>

                            </div>

                            <span className="rating-count">
                              {rating.count}{" "}
                              {rating.count > 1
                                ? "votes"
                                : "vote"}
                            </span>

                          </div>

                        </div>
                      );
                    }
                  )}

                </div>
              </section>
            )}
        </>
      )}

    </div>
  );
}

export default Films;