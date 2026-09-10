import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./config/database.js";

import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import favorisRoutes from "./routes/favoris.js";
import ratingsRoutes from "./routes/ratings.js";
import adminRoutes from "./routes/admin.js";
import moviesRoutes from "./routes/movies.js";

import authMiddleware from "./middleware/auth.js";


dotenv.config();

const app = express();

const PORT = 5000;


// ============================================================
// CONFIGURATION DES CHEMINS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// ============================================================
// MIDDLEWARES
// ============================================================

// Autorise React à communiquer avec le backend
app.use(cors());

// Permet à Express de recevoir du JSON
app.use(express.json());


// ============================================================
// IMAGES UPLOADÉES
// ============================================================

// Rend le dossier uploads accessible publiquement
//
// Exemple :
// http://localhost:5000/uploads/mon-image.jpg

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);


// ============================================================
// ROUTES D'AUTHENTIFICATION
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);


// ============================================================
// ROUTES DES FILMS ET SÉRIES
// ============================================================

// Route publique
// GET http://localhost:5000/api/movies

app.use(
  "/api/movies",
  moviesRoutes
);


// ============================================================
// TEST DE L'AUTHENTIFICATION JWT
// ============================================================

app.get(
  "/api/test-auth",
  authMiddleware,
  (req, res) => {

    res.json({

      message:
        "Authentification réussie !",

      user: req.user

    });

  }
);


// ============================================================
// ROUTES DES FAVORIS
// ============================================================

app.use(
  "/api/favoris",
  favorisRoutes
);


// ============================================================
// ROUTES DES NOTES
// ============================================================

app.use(
  "/api/ratings",
  ratingsRoutes
);


// ============================================================
// TEST DU SERVEUR
// ============================================================

app.get(
  "/",
  (req, res) => {

    res.json({

      message:
        "Backend WatchNext fonctionne !"

    });

  }
);


// ============================================================
// TEST DE POSTGRESQL
// ============================================================

app.get(
  "/api/test-db",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          "SELECT NOW()"
        );


      res.json({

        message:
          "Connexion PostgreSQL réussie !",

        date:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "Erreur PostgreSQL :",
        error
      );


      res.status(500).json({

        message:
          "Impossible de se connecter à PostgreSQL"

      });

    }

  }
);


// ============================================================
// LANCEMENT DU SERVEUR
// ============================================================

app.listen(
  PORT,
  () => {

    console.log(
      `Serveur lancé sur http://localhost:${PORT}`
    );

    console.log(
      `Images disponibles sur http://localhost:${PORT}/uploads/`
    );

  }
);