import express from "express";
import pool from "../config/database.js";
import authMiddleware from "../middleware/auth.js";
import adminMiddleware from "../middleware/admin.js";

import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const router = express.Router();


// ============================================================
// CONFIGURATION DU DOSSIER UPLOADS
// ============================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(
  __dirname,
  "../uploads"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}


// ============================================================
// CONFIGURATION DE MULTER
// ============================================================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const extension =
      path.extname(file.originalname).toLowerCase();

    const uniqueName =
      `${Date.now()}-${crypto.randomUUID()}${extension}`;

    cb(null, uniqueName);
  }

});


const upload = multer({

  storage,

  limits: {
    fileSize: 10 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml"
    ];

    if (!allowedTypes.includes(file.mimetype)) {

      return cb(
        new Error(
          "Format non autorisé. Utilise JPG, PNG, WEBP, GIF ou SVG."
        )
      );

    }

    cb(null, true);
  }

});


// ============================================================
// UPLOAD D'UNE IMAGE
// POST /api/admin/upload
// ============================================================

router.post(
  "/upload",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  async (req, res) => {

    try {

      if (!req.file) {

        return res.status(400).json({
          message: "Aucune image sélectionnée."
        });

      }

      const imageUrl =
        `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;

      console.log(
        "Image uploadée :",
        imageUrl
      );

      res.status(201).json({

        message:
          "Image uploadée avec succès !",

        url:
          imageUrl,

        filename:
          req.file.filename

      });

    } catch (error) {

      console.error(
        "Erreur upload image :",
        error
      );

      res.status(500).json({

        message:
          "Impossible d'envoyer l'image.",

        error:
          error.message

      });

    }

  }
);


// ============================================================
// UTILISATEURS
// ============================================================


// ============================================================
// VOIR TOUS LES UTILISATEURS
// GET /api/admin/users
// ============================================================

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT
          id,
          username,
          email,
          role,
          created_at
        FROM users
        ORDER BY created_at DESC
        `
      );

      res.status(200).json({
        users: result.rows
      });

    } catch (error) {

      console.error(
        "Erreur utilisateurs :",
        error
      );

      res.status(500).json({
        message: "Erreur serveur.",
        error: error.message
      });

    }

  }
);


// ============================================================
// SUPPRIMER UN UTILISATEUR
// DELETE /api/admin/users/:id
// ============================================================

router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const userId = req.params.id;

      // Empêche l'admin de supprimer son propre compte
      if (
        Number(userId) ===
        Number(req.user.id)
      ) {

        return res.status(400).json({

          message:
            "Tu ne peux pas supprimer ton propre compte."

        });

      }

      const result = await pool.query(
        `
        DELETE FROM users
        WHERE id = $1
        RETURNING id, username, email
        `,
        [userId]
      );

      if (result.rows.length === 0) {

        return res.status(404).json({

          message:
            "Utilisateur introuvable."

        });

      }

      res.status(200).json({

        message:
          "Utilisateur supprimé avec succès !",

        user:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "Erreur suppression utilisateur :",
        error
      );

      res.status(500).json({

        message:
          "Erreur serveur.",

        error:
          error.message

      });

    }

  }
);


// ============================================================
// FILMS / SÉRIES
// ============================================================


// ============================================================
// VOIR TOUS LES FILMS ET SÉRIES
// GET /api/admin/movies
// ============================================================

router.get(
  "/movies",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const result = await pool.query(
        `
        SELECT
          id,
          type,
          title,
          genre,
          synopsis,
          release_date,
          poster,
          banner,
          image1,
          image2,
          image3,
          trailer,
          background,
          carousel_color_1,
          carousel_color_2,
          created_at
        FROM movies
        ORDER BY created_at DESC
        `
      );

      res.status(200).json({

        movies:
          result.rows

      });

    } catch (error) {

      console.error(
        "Erreur récupération films :",
        error
      );

      res.status(500).json({

        message:
          "Impossible de récupérer les films.",

        error:
          error.message

      });

    }

  }
);


// ============================================================
// AJOUTER UN FILM / UNE SÉRIE
// POST /api/admin/movies
// ============================================================

router.post(
  "/movies",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      let {
        type,
        title,
        genre,
        synopsis,
        release_date,
        poster,
        banner,
        image1,
        image2,
        image3,
        trailer,
        background,
        carousel_color_1,
        carousel_color_2
      } = req.body;


      // ========================================================
      // NORMALISATION DU TYPE
      // ========================================================

      if (typeof type === "string") {

        const typeNormalise =
          type.trim().toLowerCase();

        if (
          typeNormalise === "film"
        ) {

          type = "Film";

        } else if (
          typeNormalise === "serie" ||
          typeNormalise === "série"
        ) {

          type = "Série";

        }

      }


      // ========================================================
      // VÉRIFICATION DU TITRE
      // ========================================================

      if (
        !title ||
        typeof title !== "string" ||
        !title.trim()
      ) {

        return res.status(400).json({

          message:
            "Le titre est obligatoire."

        });

      }


      // ========================================================
      // VÉRIFICATION DU TYPE
      // ========================================================

      if (
        type !== "Film" &&
        type !== "Série"
      ) {

        return res.status(400).json({

          message:
            "Le type doit être Film ou Série."

        });

      }


      // ========================================================
      // INSERTION
      // ========================================================

      const result = await pool.query(
        `
        INSERT INTO movies (
          type,
          title,
          genre,
          synopsis,
          release_date,
          poster,
          banner,
          image1,
          image2,
          image3,
          trailer,
          background,
          carousel_color_1,
          carousel_color_2
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14
        )
        RETURNING *
        `,
        [

          type,

          title.trim(),

          typeof genre === "string"
            ? genre.trim()
            : "",

          typeof synopsis === "string"
            ? synopsis.trim()
            : "",

          release_date || null,

          typeof poster === "string"
            ? poster.trim()
            : "",

          typeof banner === "string"
            ? banner.trim()
            : "",

          typeof image1 === "string"
            ? image1.trim()
            : "",

          typeof image2 === "string"
            ? image2.trim()
            : "",

          typeof image3 === "string"
            ? image3.trim()
            : "",

          typeof trailer === "string"
            ? trailer.trim()
            : "",

          typeof background === "string"
            ? background.trim()
            : "",

          carousel_color_1 ||
            "#111111",

          carousel_color_2 ||
            "#333333"

        ]
      );


      console.log(
        "Nouveau contenu ajouté :",
        result.rows[0].title
      );


      res.status(201).json({

        message:
          "Film / série ajouté(e) avec succès !",

        movie:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "Erreur ajout film :",
        error
      );

      res.status(500).json({

        message:
          "Impossible d'ajouter le film.",

        error:
          error.message

      });

    }

  }
);


// ============================================================
// MODIFIER UN FILM / UNE SÉRIE
// PUT /api/admin/movies/:id
// ============================================================

router.put(
  "/movies/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const movieId =
        req.params.id;


      let {
        type,
        title,
        genre,
        synopsis,
        release_date,
        poster,
        banner,
        image1,
        image2,
        image3,
        trailer,
        background,
        carousel_color_1,
        carousel_color_2
      } = req.body;


      // ========================================================
      // NORMALISATION DU TYPE
      // ========================================================

      if (typeof type === "string") {

        const typeNormalise =
          type.trim().toLowerCase();


        if (
          typeNormalise === "film"
        ) {

          type = "Film";

        } else if (
          typeNormalise === "serie" ||
          typeNormalise === "série"
        ) {

          type = "Série";

        }

      }


      // ========================================================
      // VÉRIFICATION DU TITRE
      // ========================================================

      if (
        !title ||
        typeof title !== "string" ||
        !title.trim()
      ) {

        return res.status(400).json({

          message:
            "Le titre est obligatoire."

        });

      }


      // ========================================================
      // VÉRIFICATION DU TYPE
      // ========================================================

      if (
        type !== "Film" &&
        type !== "Série"
      ) {

        return res.status(400).json({

          message:
            "Le type doit être Film ou Série."

        });

      }


      // ========================================================
      // MODIFICATION DANS POSTGRESQL
      // ========================================================

      const result = await pool.query(
        `
        UPDATE movies
        SET
          type = $1,
          title = $2,
          genre = $3,
          synopsis = $4,
          release_date = $5,
          poster = $6,
          banner = $7,
          image1 = $8,
          image2 = $9,
          image3 = $10,
          trailer = $11,
          background = $12,
          carousel_color_1 = $13,
          carousel_color_2 = $14
        WHERE id = $15
        RETURNING *
        `,
        [

          type,

          title.trim(),

          typeof genre === "string"
            ? genre.trim()
            : "",

          typeof synopsis === "string"
            ? synopsis.trim()
            : "",

          release_date || null,

          typeof poster === "string"
            ? poster.trim()
            : "",

          typeof banner === "string"
            ? banner.trim()
            : "",

          typeof image1 === "string"
            ? image1.trim()
            : "",

          typeof image2 === "string"
            ? image2.trim()
            : "",

          typeof image3 === "string"
            ? image3.trim()
            : "",

          typeof trailer === "string"
            ? trailer.trim()
            : "",

          typeof background === "string"
            ? background.trim()
            : "",

          carousel_color_1 ||
            "#111111",

          carousel_color_2 ||
            "#333333",

          movieId

        ]
      );


      // ========================================================
      // VÉRIFICATION DU FILM
      // ========================================================

      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Film ou série introuvable."

        });

      }


      // ========================================================
      // MESSAGE SERVEUR
      // ========================================================

      console.log(
        "Film / série modifié(e) :",
        result.rows[0].title
      );


      // ========================================================
      // RÉPONSE
      // ========================================================

      res.status(200).json({

        message:
          "Film / série modifié(e) avec succès !",

        movie:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "Erreur modification film :",
        error
      );

      res.status(500).json({

        message:
          "Impossible de modifier le film.",

        error:
          error.message

      });

    }

  }
);


// ============================================================
// SUPPRIMER UN FILM / UNE SÉRIE
// DELETE /api/admin/movies/:id
// ============================================================

router.delete(
  "/movies/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {

    try {

      const movieId =
        req.params.id;


      const result = await pool.query(
        `
        DELETE FROM movies
        WHERE id = $1
        RETURNING *
        `,
        [movieId]
      );


      if (
        result.rows.length === 0
      ) {

        return res.status(404).json({

          message:
            "Film ou série introuvable."

        });

      }


      console.log(
        "Film / série supprimé(e) :",
        result.rows[0].title
      );


      res.status(200).json({

        message:
          "Film / série supprimé(e) avec succès !",

        movie:
          result.rows[0]

      });

    } catch (error) {

      console.error(
        "Erreur suppression film :",
        error
      );

      res.status(500).json({

        message:
          "Impossible de supprimer le film.",

        error:
          error.message

      });

    }

  }
);


// ============================================================
// GESTION DES ERREURS MULTER
// ============================================================

router.use(
  (error, req, res, next) => {

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code === "LIMIT_FILE_SIZE"
      ) {

        return res.status(400).json({

          message:
            "L'image est trop volumineuse. Maximum : 10 Mo."

        });

      }


      return res.status(400).json({

        message:
          error.message

      });

    }


    if (error) {

      return res.status(400).json({

        message:
          error.message

      });

    }


    next();

  }
);


// ============================================================
// EXPORT
// ============================================================

export default router;