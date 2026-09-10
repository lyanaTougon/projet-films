import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./details.css";

const API_URL = "http://localhost:5000";
const BASE_URL = import.meta.env.BASE_URL;

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

  if (path.startsWith("/projet-films/")) {
    return path;
  }

  return `${BASE_URL}${path.replace(/^\/+/, "")}`;
}

// ============================================================
// DETAILS
// ============================================================

function Details({ movie: movieFromProps }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(movieFromProps || null);
  const [loadingMovie, setLoadingMovie] = useState(!movieFromProps);

  // ============================================================
  // CARROUSEL
  // ============================================================

  const [currentImage, setCurrentImage] = useState(0);

  // ============================================================
  // FAVORIS
  // ============================================================

  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorite, setLoadingFavorite] = useState(false);

  const [favoriteMessage, setFavoriteMessage] = useState("");
  const [favoriteMessageType, setFavoriteMessageType] = useState("");

  // ============================================================
  // NOTES
  // ============================================================

  const [userRating, setUserRating] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [loadingRating, setLoadingRating] = useState(false);

  const [ratingMessage, setRatingMessage] = useState("");
  const [ratingMessageType, setRatingMessageType] = useState("");

  // ============================================================
  // TOKEN
  // ============================================================

  const getToken = () => {
    return localStorage.getItem("token");
  };

  // ============================================================
  // RÉCUPÉRER LE FILM / LA SÉRIE
  // ============================================================

  useEffect(() => {
    let cancelled = false;

    const loadMovie = async () => {
      try {
        setLoadingMovie(true);

        const response = await fetch(
          `${API_URL}/api/movies/${id}`
        );

        if (!response.ok) {
          if (!cancelled) {
            setMovie(null);
          }

          return;
        }

        const data = await response.json();

        if (!cancelled) {
          setMovie(data);
          setCurrentImage(0);
        }
      } catch (error) {
        console.error(
          "Erreur récupération du film :",
          error
        );

        if (!cancelled) {
          setMovie(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingMovie(false);
        }
      }
    };

    loadMovie();

    const handleMoviesChanged = () => {
      loadMovie();
    };

    window.addEventListener(
      "moviesChanged",
      handleMoviesChanged
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "moviesChanged",
        handleMoviesChanged
      );
    };
  }, [id]);

  // ============================================================
  // RÉCUPÉRER LES FAVORIS
  // ============================================================

  useEffect(() => {
    const checkFavorite = async () => {
      const token = getToken();

      if (!token || !movie) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/favoris`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const favorites = Array.isArray(data.favorites)
          ? data.favorites
          : [];

        const favoriteExists = favorites.some(
          (favorite) =>
            String(favorite.movie_id) ===
            String(movie.id)
        );

        setIsFavorite(favoriteExists);
      } catch (error) {
        console.error(
          "Erreur récupération favoris :",
          error
        );
      }
    };

    checkFavorite();
  }, [movie]);

  // ============================================================
  // RÉCUPÉRER LA NOTE
  // ============================================================

  useEffect(() => {
    const getUserRating = async () => {
      const token = getToken();

      if (!token || !movie) {
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/ratings`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          return;
        }

        const data = await response.json();

        const ratings = Array.isArray(data.ratings)
          ? data.ratings
          : [];

        const ratingExists = ratings.find(
          (rating) =>
            String(rating.movie_id) ===
            String(movie.id)
        );

        if (ratingExists) {
          setUserRating(Number(ratingExists.rating));
        } else {
          setUserRating(null);
        }
      } catch (error) {
        console.error(
          "Erreur récupération note :",
          error
        );
      }
    };

    getUserRating();
  }, [movie]);

  // ============================================================
  // ARRIÈRE-PLAN
  // ============================================================

  useEffect(() => {
    if (!movie) {
      return;
    }

    document.body.style.background =
      movie.background || "#c5c4c4";

    return () => {
      document.body.style.background = "";
    };
  }, [movie]);

  // ============================================================
  // IMAGES DU CARROUSEL
  // ============================================================

  const detailImages = [
    movie?.image1,
    movie?.image2,
    movie?.image3,
  ].filter(Boolean);

  // ============================================================
  // IMAGE SUIVANTE
  // ============================================================

  const nextImage = () => {
    if (detailImages.length === 0) {
      return;
    }

    setCurrentImage((previous) =>
      previous === detailImages.length - 1
        ? 0
        : previous + 1
    );
  };

  // ============================================================
  // IMAGE PRÉCÉDENTE
  // ============================================================

  const previousImage = () => {
    if (detailImages.length === 0) {
      return;
    }

    setCurrentImage((previous) =>
      previous === 0
        ? detailImages.length - 1
        : previous - 1
    );
  };

  // ============================================================
  // ALLER À LA CONNEXION
  // ============================================================

  const goToLogin = () => {
    navigate("/se-connecter");
  };

  // ============================================================
  // FAVORIS
  // ============================================================

  const toggleFavorite = async () => {
    const token = getToken();

    if (!token) {
      setFavoriteMessage(
        "Veuillez vous connecter pour ajouter ce film à vos favoris."
      );

      setFavoriteMessageType("login");

      setRatingMessage("");
      setRatingMessageType("");

      return;
    }

    if (!movie) {
      return;
    }

    setLoadingFavorite(true);
    setFavoriteMessage("");
    setFavoriteMessageType("");

    try {
      if (isFavorite) {
        const response = await fetch(
          `${API_URL}/api/favoris/${movie.id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setFavoriteMessage(
            data.message ||
              "Erreur lors de la suppression."
          );

          setFavoriteMessageType("error");

          return;
        }

        setIsFavorite(false);

        setFavoriteMessage(
          "Film retiré des favoris ❤️"
        );

        setFavoriteMessageType("success");
      } else {
        const response = await fetch(
          `${API_URL}/api/favoris`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              movie_id: movie.id,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setFavoriteMessage(
            data.message ||
              "Erreur lors de l'ajout."
          );

          setFavoriteMessageType("error");

          return;
        }

        setIsFavorite(true);

        setFavoriteMessage(
          "Film ajouté aux favoris ❤️"
        );

        setFavoriteMessageType("success");
      }
    } catch (error) {
      console.error("Erreur favori :", error);

      setFavoriteMessage(
        "Impossible de contacter le serveur."
      );

      setFavoriteMessageType("error");
    } finally {
      setLoadingFavorite(false);
    }
  };

  // ============================================================
  // NOTES
  // ============================================================

  const handleRating = async (rating) => {
    const token = getToken();

    if (!token) {
      setRatingMessage(
        "Veuillez vous connecter pour noter ce film."
      );

      setRatingMessageType("login");

      setFavoriteMessage("");
      setFavoriteMessageType("");

      return;
    }

    if (!movie) {
      return;
    }

    setLoadingRating(true);
    setRatingMessage("");
    setRatingMessageType("");

    try {
      const response = await fetch(
        `${API_URL}/api/ratings`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            movie_id: movie.id,
            rating: rating,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRatingMessage(
          data.message ||
            "Erreur lors de l'enregistrement."
        );

        setRatingMessageType("error");

        return;
      }

      setUserRating(Number(rating));

      setRatingMessage(
        "Note enregistrée ⭐"
      );

      setRatingMessageType("success");
    } catch (error) {
      console.error("Erreur note :", error);

      setRatingMessage(
        "Impossible de contacter le serveur."
      );

      setRatingMessageType("error");
    } finally {
      setLoadingRating(false);
      setHoverRating(0);
    }
  };

  // ============================================================
  // SUPPRIMER LA NOTE
  // ============================================================

  const deleteRating = async () => {
    const token = getToken();

    if (!token || !movie) {
      return;
    }

    setLoadingRating(true);

    try {
      const response = await fetch(
        `${API_URL}/api/ratings/${movie.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setRatingMessage(
          data.message ||
            "Erreur lors de la suppression."
        );

        setRatingMessageType("error");

        return;
      }

      setUserRating(null);

      setRatingMessage(
        "Note supprimée."
      );

      setRatingMessageType("success");
    } catch (error) {
      console.error(
        "Erreur suppression note :",
        error
      );

      setRatingMessage(
        "Impossible de contacter le serveur."
      );

      setRatingMessageType("error");
    } finally {
      setLoadingRating(false);
      setHoverRating(0);
    }
  };

  // ============================================================
  // CALCUL DE LA NOTE AU SURVOL
  // ============================================================

  const getRatingFromMouse = (event, star) => {
    const rect =
      event.currentTarget.getBoundingClientRect();

    const mousePosition =
      event.clientX - rect.left;

    const isLeftHalf =
      mousePosition < rect.width / 2;

    return isLeftHalf
      ? star - 0.5
      : star;
  };

  // ============================================================
  // CHARGEMENT
  // ============================================================

  if (loadingMovie) {
    return (
      <div className="film-detail">
        <p>Chargement...</p>
      </div>
    );
  }

  // ============================================================
  // FILM INTROUVABLE
  // ============================================================

  if (!movie) {
    return (
      <div className="film-detail">
        <h2>Film ou série introuvable</h2>

        <button
          type="button"
          className="back-button"
          onClick={() => navigate("/")}
        >
          ← Retour à l'accueil
        </button>
      </div>
    );
  }

  // ============================================================
  // AFFICHAGE
  // ============================================================

  return (
    <div className="film-detail">

      {/* RETOUR */}

      <button
        type="button"
        className="back-button"
        onClick={() => navigate(-1)}
      >
        ← Retour
      </button>

      {/* INFORMATIONS */}

      <div className="film-detail-header">

        {/* AFFICHE */}

        <img
          className="film-detail-poster"
          src={getImagePath(movie.poster)}
          alt={movie.title}
        />

        <div className="film-detail-info">

          {/* TITRE */}

          <h1>{movie.title}</h1>

          {/* GENRE */}

          <span className="film-detail-genre">
            {movie.genre}
          </span>

          {/* SYNOPSIS */}

          <p className="film-detail-synopsis">
            {movie.synopsis}
          </p>

          {/* FAVORIS */}

          <button
            type="button"
            className={`favorite-button ${
              isFavorite
                ? "favorite-active"
                : ""
            }`}
            onClick={toggleFavorite}
            disabled={loadingFavorite}
          >
            {loadingFavorite
              ? "Chargement..."
              : isFavorite
              ? "❤️ Retirer des favoris"
              : "♡ Ajouter aux favoris"}
          </button>

          {/* MESSAGE FAVORIS */}

          {favoriteMessage && (
            <div
              className={`action-message ${favoriteMessageType}`}
            >
              <p>{favoriteMessage}</p>

              {favoriteMessageType === "login" && (
                <button
                  type="button"
                  className="message-login-button"
                  onClick={goToLogin}
                >
                  Se connecter
                </button>
              )}
            </div>
          )}

          {/* NOTES */}

          <div className="rating-section">

            <h3>Ma note</h3>

            <div className="stars">

              {[1, 2, 3, 4, 5].map((star) => {
                const currentRating =
                  hoverRating !== 0
                    ? hoverRating
                    : userRating || 0;

                let starClass = "";

                if (currentRating >= star) {
                  starClass = "active";
                } else if (
                  currentRating >= star - 0.5
                ) {
                  starClass = "half";
                }

                return (
                  <button
                    key={star}
                    type="button"
                    className={`star ${starClass}`}
                    disabled={loadingRating}
                    onMouseMove={(event) => {
                      const rating =
                        getRatingFromMouse(
                          event,
                          star
                        );

                      setHoverRating(rating);
                    }}
                    onMouseLeave={() => {
                      setHoverRating(0);
                    }}
                    onClick={(event) => {
                      const rating =
                        getRatingFromMouse(
                          event,
                          star
                        );

                      handleRating(rating);
                    }}
                    aria-label={`Noter ${star} sur 5`}
                  >
                    ★
                  </button>
                );
              })}

              {/* SUPPRIMER LA NOTE */}

              {userRating !== null && (
                <button
                  type="button"
                  className="clear-rating"
                  onClick={deleteRating}
                  disabled={loadingRating}
                  title="Supprimer ma note"
                  aria-label="Supprimer ma note"
                >
                  ×
                </button>
              )}

            </div>

            {/* NOTE ACTUELLE */}

            {userRating !== null && (
              <p className="rating-text">
                Ma note : {userRating}/5 ⭐
              </p>
            )}

            {/* MESSAGE NOTE */}

            {ratingMessage && (
              <div
                className={`action-message ${ratingMessageType}`}
              >
                <p>{ratingMessage}</p>

                {ratingMessageType === "login" && (
                  <button
                    type="button"
                    className="message-login-button"
                    onClick={goToLogin}
                  >
                    Se connecter
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ======================================================
          CARROUSEL DES 3 IMAGES
      ====================================================== */}

      {detailImages.length > 0 && (
        <section className="film-images-section">

          <h2>
            Découvrez l'univers de {movie.title}
          </h2>

          <div className="film-images-carousel">

            {/* BOUTON PRÉCÉDENT */}

            {detailImages.length > 1 && (
              <button
                type="button"
                className="carousel-arrow carousel-arrow-left"
                onClick={previousImage}
                aria-label="Image précédente"
              >
                ‹
              </button>
            )}

            {/* IMAGE */}

            <div className="film-carousel-image-wrapper">

              <img
                key={currentImage}
                className="film-carousel-image"
                src={getImagePath(
                  detailImages[currentImage]
                )}
                alt={`${movie.title} - image ${
                  currentImage + 1
                }`}
              />

            </div>

            {/* BOUTON SUIVANT */}

            {detailImages.length > 1 && (
              <button
                type="button"
                className="carousel-arrow carousel-arrow-right"
                onClick={nextImage}
                aria-label="Image suivante"
              >
                ›
              </button>
            )}

          </div>

          {/* INDICATEURS */}

          {detailImages.length > 1 && (
            <div className="carousel-dots">

              {detailImages.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  className={`carousel-dot ${
                    currentImage === index
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setCurrentImage(index)
                  }
                  aria-label={`Afficher l'image ${
                    index + 1
                  }`}
                />
              ))}

            </div>
          )}

        </section>
      )}

      {/* ======================================================
          BANDE-ANNONCE
      ====================================================== */}

      {movie.trailer && (
        <div className="film-detail-trailer">

          <h2>Bande-annonce</h2>

          <div className="trailer-wrapper">

            <iframe
              src={movie.trailer}
              title={`Trailer de ${movie.title}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

          </div>

        </div>
      )}

    </div>
  );
}

export default Details;