import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./series.css";

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
// PAGE SÉRIES
// ============================================================

function Series() {
  const navigate = useNavigate();

  // ----------------------------------------------------------
  // ÉTATS
  // ----------------------------------------------------------

  const [series, setSeries] = useState([]);

  const [search, setSearch] = useState("");

  const [genre, setGenre] = useState("Tous");

  const [ratings, setRatings] = useState({});

  const [loadingSeries, setLoadingSeries] =
    useState(true);

  const [loadingRatings, setLoadingRatings] =
    useState(true);

  // ----------------------------------------------------------
  // RÉCUPÉRER LES SÉRIES DEPUIS POSTGRESQL
  // ----------------------------------------------------------

  async function loadSeries() {
    try {
      setLoadingSeries(true);

      const response = await fetch(
        `${API_URL}/api/movies`
      );

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les séries."
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

      // ------------------------------------------------------
      // ON GARDE UNIQUEMENT LES SÉRIES
      // ------------------------------------------------------

      const seriesList = allMovies.filter((item) => {
        const type = String(item.type || "")
          .trim()
          .toLowerCase();

        return (
          type === "serie" ||
          type === "série"
        );
      });

      setSeries(seriesList);
    } catch (error) {
      console.error(
        "Erreur récupération des séries :",
        error
      );

      setSeries([]);
    } finally {
      setLoadingSeries(false);
    }
  }

  // ----------------------------------------------------------
  // CHARGEMENT INITIAL
  // ----------------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchSeries() {
      try {
        const response = await fetch(
          `${API_URL}/api/movies`
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de récupérer les séries."
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

        const seriesList = allMovies.filter((item) => {
          const type = String(item.type || "")
            .trim()
            .toLowerCase();

          return (
            type === "serie" ||
            type === "série"
          );
        });

        if (!cancelled) {
          setSeries(seriesList);
        }
      } catch (error) {
        console.error(
          "Erreur récupération des séries :",
          error
        );

        if (!cancelled) {
          setSeries([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingSeries(false);
        }
      }
    }

    fetchSeries();

    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // RECHARGER APRÈS AJOUT / MODIFICATION / SUPPRESSION
  // ----------------------------------------------------------

  useEffect(() => {
    function handleMoviesChanged() {
      loadSeries();
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
      if (series.length === 0) {
        if (!cancelled) {
          setRatings({});
          setLoadingRatings(false);
        }

        return;
      }

      try {
        setLoadingRatings(true);

        const results = await Promise.all(
          series.map(async (item) => {
            try {
              const response = await fetch(
                `${API_URL}/api/ratings/movie/${item.id}`
              );

              if (!response.ok) {
                return {
                  id: item.id,
                  average_rating: 0,
                  rating_count: 0,
                };
              }

              const data = await response.json();

              return {
                id: item.id,

                average_rating:
                  Number(data.average_rating) || 0,

                rating_count:
                  Number(data.rating_count) || 0,
              };
            } catch (error) {
              console.error(
                `Erreur note de la série ${item.title} :`,
                error
              );

              return {
                id: item.id,
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
  }, [series]);

  // ----------------------------------------------------------
  // GENRES
  // ----------------------------------------------------------

  const genres = [
    "Tous",
    ...new Set(
      series
        .map((item) => item.genre)
        .filter(Boolean)
    ),
  ];

  // ----------------------------------------------------------
  // FILTRAGE
  // ----------------------------------------------------------

  const filteredSeries = series.filter((item) => {
    const title = String(item.title || "");

    const matchesSearch = title
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesGenre =
      genre === "Tous" ||
      item.genre === genre;

    return matchesSearch && matchesGenre;
  });

  // ----------------------------------------------------------
  // TOP 5 DES SÉRIES
  // ----------------------------------------------------------

  const topSeries = [...series]
    .filter((item) => {
      const rating = ratings[item.id];

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
    <div className="series-page">

      {/* ======================================================
          EN-TÊTE
      ====================================================== */}

      <div className="series-header">

        <h1>
          Toutes les séries 📺
        </h1>

        <p>
          Retrouvez toutes les séries disponibles sur WatchNext.
        </p>

      </div>

      {/* ======================================================
          RECHERCHE + FILTRE
      ====================================================== */}

      <div className="series-filters">

        <div className="series-search">

          <input
            type="text"
            placeholder="Rechercher une série..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>

        <div className="series-genre">

          <label htmlFor="series-genre">
            Genre :
          </label>

          <select
            id="series-genre"
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

      {loadingSeries ? (
        <div className="series-no-results">

          <h2>
            Chargement des séries... 📺
          </h2>

          <p>
            Récupération des séries depuis WatchNext.
          </p>

        </div>
      ) : (
        <>
          {/* ==================================================
              NOMBRE DE RÉSULTATS
          ================================================== */}

          <div className="series-count">

            {filteredSeries.length} série
            {filteredSeries.length > 1 ? "s" : ""}

          </div>

          {/* ==================================================
              CARTES DES SÉRIES
          ================================================== */}

          {filteredSeries.length > 0 ? (

            <div className="series-grid">

              {filteredSeries.map((item) => {

                const rating =
                  ratings[item.id];

                return (
                  <div
                    className="series-card"
                    key={item.id}
                    onClick={() =>
                      navigate(
                        `/film/${item.id}`
                      )
                    }
                  >

                    {/* ==============================
                        IMAGE
                    ============================== */}

                    <img
                      src={getImagePath(
                        item.poster
                      )}
                      alt={item.title}
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

                    <div className="series-card-info">

                      <h2>
                        {item.title}
                      </h2>

                      <span>
                        {item.genre ||
                          "Genre non renseigné"}
                      </span>

                      {/* ============================
                          NOTE MOYENNE
                      ============================ */}

                      {rating &&
                      rating.count > 0 ? (

                        <div className="series-rating">

                          <div className="series-rating-stars">

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

                        <div className="series-rating no-rating">
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
                            `/film/${item.id}`
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

            <div className="series-no-results">

              <h2>
                Aucune série trouvée 😕
              </h2>

              <p>
                Aucune série ne correspond à votre recherche.
              </p>

            </div>
          )}

          {/* ==================================================
              TOP 5 DES SÉRIES
          ================================================== */}

          {!loadingRatings &&
            topSeries.length > 0 && (

              <section className="top-rated-section">

                <div className="top-rated-header">

                  <h2>
                    🏆 Top 5 des séries les mieux notées
                  </h2>

                  <p>
                    Classement basé sur les notes de tous les utilisateurs.
                  </p>

                </div>

                <div className="top-rated-grid">

                  {topSeries.map(
                    (item, index) => {

                      const rating =
                        ratings[item.id];

                      return (
                        <div
                          className="top-rated-card"
                          key={item.id}
                          onClick={() =>
                            navigate(
                              `/film/${item.id}`
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
                              item.poster
                            )}
                            alt={item.title}
                            draggable="false"
                          />

                          {/* ==========================
                              INFORMATIONS
                          ========================== */}

                          <div className="top-rated-info">

                            <h3>
                              {item.title}
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

export default Series;