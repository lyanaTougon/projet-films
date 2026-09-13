import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./tout.css";

const API_URL = "http://localhost:5000";
const BASE_URL = import.meta.env.BASE_URL;

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

function Stars({ rating }) {
  const value = Number(rating || 0);
  const fullStars = Math.floor(value);
  const halfStar = value - fullStars >= 0.5;
  const emptyStars =
    5 - fullStars - (halfStar ? 1 : 0);

  return (
    <span className="tout-stars">
      {"★".repeat(fullStars)}
      {halfStar && "★"}
      {"☆".repeat(emptyStars)}
    </span>
  );
}

function Tout() {
  const navigate = useNavigate();

  const [movies, setMovies] = useState([]);
  const [ratings, setRatings] = useState({});

  const [search, setSearch] = useState("");
  const [type, setType] = useState("Tous");
  const [genre, setGenre] = useState("Tous");

  const [loading, setLoading] = useState(true);

  // ==========================================================
  // CHARGEMENT DES FILMS ET SÉRIES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchMovies() {
      try {
        const response = await fetch(
          `${API_URL}/api/movies`
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les contenus."
          );
        }

        const data = await response.json();

        let contents = [];

        if (Array.isArray(data)) {
          contents = data;
        } else if (Array.isArray(data.movies)) {
          contents = data.movies;
        } else if (Array.isArray(data.results)) {
          contents = data.results;
        }

        if (!cancelled) {
          setMovies(contents);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "Erreur récupération contenus :",
          error
        );

        if (!cancelled) {
          setMovies([]);
          setLoading(false);
        }
      }
    }

    fetchMovies();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================================
  // RECHARGEMENT APRÈS MODIFICATION ADMIN
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function reloadMovies() {
      try {
        const response = await fetch(
          `${API_URL}/api/movies`
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        let contents = [];

        if (Array.isArray(data)) {
          contents = data;
        } else if (Array.isArray(data.movies)) {
          contents = data.movies;
        } else if (Array.isArray(data.results)) {
          contents = data.results;
        }

        if (!cancelled) {
          setMovies(contents);
        }
      } catch (error) {
        console.error(
          "Erreur rechargement contenus :",
          error
        );
      }
    }

    window.addEventListener(
      "moviesChanged",
      reloadMovies
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "moviesChanged",
        reloadMovies
      );
    };
  }, []);

  // ==========================================================
  // CHARGEMENT DES NOTES
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function fetchRatings() {
      if (movies.length === 0) {
        if (!cancelled) {
          setRatings({});
        }

        return;
      }

      const ratingResults = await Promise.all(
        movies.map(async (movie) => {
          try {
            const response = await fetch(
              `${API_URL}/api/ratings/movie/${movie.id}`
            );

            if (!response.ok) {
              return {
                id: movie.id,
                average: 0,
                count: 0,
              };
            }

            const data = await response.json();

            return {
              id: movie.id,
              average:
                Number(
                  data.average_rating
                ) || 0,
              count:
                Number(
                  data.rating_count
                ) || 0,
            };
          } catch (error) {
            console.error(
              `Erreur note ${movie.title} :`,
              error
            );

            return {
              id: movie.id,
              average: 0,
              count: 0,
            };
          }
        })
      );

      if (!cancelled) {
        const ratingObject = {};

        ratingResults.forEach((item) => {
          ratingObject[item.id] = {
            average: item.average,
            count: item.count,
          };
        });

        setRatings(ratingObject);
      }
    }

    fetchRatings();

    return () => {
      cancelled = true;
    };
  }, [movies]);

  // ==========================================================
  // GENRES DISPONIBLES
  // ==========================================================

  const genres = [
    "Tous",
    ...new Set(
      movies
        .map((movie) => movie.genre)
        .filter(Boolean)
    ),
  ];

  // ==========================================================
  // NORMALISATION DU TYPE
  // ==========================================================

  function getMovieType(movie) {
    const movieType = String(
      movie.type || ""
    )
      .trim()
      .toLowerCase();

    if (movieType === "film") {
      return "Film";
    }

    return "Série";
  }

  // ==========================================================
  // FILTRAGE
  // ==========================================================

  const filteredMovies = movies.filter(
    (movie) => {
      const movieTitle = String(
        movie.title || ""
      ).toLowerCase();

      const movieGenre = String(
        movie.genre || ""
      );

      const movieType =
        getMovieType(movie);

      const matchesSearch =
        movieTitle.includes(
          search.toLowerCase()
        );

      const matchesType =
        type === "Tous" ||
        movieType === type;

      const matchesGenre =
        genre === "Tous" ||
        movieGenre === genre;

      return (
        matchesSearch &&
        matchesType &&
        matchesGenre
      );
    }
  );

  // ==========================================================
  // COMPTEURS
  // ==========================================================

  const filmCount = movies.filter(
    (movie) =>
      getMovieType(movie) === "Film"
  ).length;

  const seriesCount = movies.filter(
    (movie) =>
      getMovieType(movie) === "Série"
  ).length;

  // ==========================================================
  // AFFICHAGE
  // ==========================================================

  return (
    <main className="tout-page">

      {/* ====================================================
          TITRE
      ==================================================== */}

      <section className="tout-header">

        <h1>
          Tout 🎬
        </h1>

        <p>
          Découvrez tous les films et séries
          disponibles sur WatchNext.
        </p>

      </section>

      {/* ====================================================
          FILTRES
      ==================================================== */}

      <section className="tout-filters">

        <div className="tout-search">

          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Rechercher un film ou une série..."
          />

        </div>

        <div className="tout-select">

          <label htmlFor="type-filter">
            Type
          </label>

          <select
            id="type-filter"
            value={type}
            onChange={(event) =>
              setType(event.target.value)
            }
          >

            <option value="Tous">
              Tous
            </option>

            <option value="Film">
              Films
            </option>

            <option value="Série">
              Séries
            </option>

          </select>

        </div>

        <div className="tout-select">

          <label htmlFor="genre-filter">
            Genre
          </label>

          <select
            id="genre-filter"
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

      </section>

      {/* ====================================================
          COMPTEUR
      ==================================================== */}

      {!loading && (
        <div className="tout-result">

          <strong>
            {filteredMovies.length}
          </strong>

          <span>
            contenu
            {filteredMovies.length > 1
              ? "s"
              : ""}{" "}
            trouvé
            {filteredMovies.length > 1
              ? "s"
              : ""}
          </span>

        </div>
      )}

      {/* ====================================================
          CHARGEMENT
      ==================================================== */}

      {loading ? (

        <div className="tout-message">

          <h2>
            Chargement... 🎬
          </h2>

          <p>
            Les films et séries sont en cours
            de chargement.
          </p>

        </div>

      ) : filteredMovies.length === 0 ? (

        /* ==================================================
           AUCUN RÉSULTAT
           ================================================== */

        <div className="tout-message">

          <h2>
            Aucun résultat 😕
          </h2>

          <p>
            Aucun film ou série ne correspond
            à votre recherche.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setType("Tous");
              setGenre("Tous");
            }}
          >
            Réinitialiser les filtres
          </button>

        </div>

      ) : (

        /* ==================================================
           GRILLE
           ================================================== */

        <section className="tout-grid">

          {filteredMovies.map((movie) => {

            const movieRating =
              ratings[movie.id];

            const average =
              movieRating?.average || 0;

            const count =
              movieRating?.count || 0;

            const movieType =
              getMovieType(movie);

            return (

              <article
                className="tout-card"
                key={movie.id}
                onClick={() =>
                  navigate(
                    `/film/${movie.id}`
                  )
                }
              >

                {/* IMAGE */}

                <div className="tout-image">

                  {movie.poster ? (

                    <img
                      src={getImagePath(
                        movie.poster
                      )}
                      alt={movie.title}
                      draggable="false"
                    />

                  ) : (

                    <div className="tout-no-image">
                      🎬
                    </div>

                  )}

                  <span className="tout-type">

                    {movieType === "Film"
                      ? "🎬 Film"
                      : "📺 Série"}

                  </span>

                </div>

                {/* INFORMATIONS */}

                <div className="tout-card-content">

                  <h2>
                    {movie.title}
                  </h2>

                  <span className="tout-card-genre">
                    {movie.genre ||
                      "Genre non renseigné"}
                  </span>

                  {/* NOTE */}

                  {count > 0 ? (

                    <div className="tout-rating">

                      <Stars
                        rating={average}
                      />

                      <strong>
                        {average.toFixed(1)}
                        /5
                      </strong>

                      <span>
                        ({count})
                      </span>

                    </div>

                  ) : (

                    <div className="tout-rating tout-no-rating">

                      ☆ Aucune note

                    </div>

                  )}

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();

                      navigate(
                        `/film/${movie.id}`
                      );
                    }}
                  >
                    Voir le contenu
                  </button>

                </div>

              </article>

            );
          })}

        </section>

      )}

      {/* ====================================================
          RÉSUMÉ
      ==================================================== */}

      {!loading &&
        movies.length > 0 && (

          <section className="tout-summary">

            <div className="tout-summary-item">

              <strong>
                {movies.length}
              </strong>

              <span>
                Contenus
              </span>

            </div>

            <div className="tout-summary-item">

              <strong>
                {filmCount}
              </strong>

              <span>
                Films
              </span>

            </div>

            <div className="tout-summary-item">

              <strong>
                {seriesCount}
              </strong>

              <span>
                Séries
              </span>

            </div>

          </section>

        )}

    </main>
  );
}

export default Tout;