// ============================================================
// ROUTES / MOVIES.JS
// ============================================================

import express from "express";
import pool from "../config/database.js";

const router = express.Router();


// ============================================================
// RÉCUPÉRER TOUS LES FILMS ET SÉRIES
// GET /api/movies
// ============================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
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
        created_at,
        carousel_color_1,
        carousel_color_2
      FROM movies
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);

  } catch (error) {
    console.error(
      "Erreur récupération des films et séries :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer les films et séries.",
      error: error.message
    });
  }
});


// ============================================================
// RÉCUPÉRER UN FILM OU UNE SÉRIE PAR SON ID
// GET /api/movies/:id
// ============================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

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
        created_at,
        carousel_color_1,
        carousel_color_2
      FROM movies
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Film ou série introuvable."
      });
    }

    res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error(
      "Erreur récupération du film ou de la série :",
      error
    );

    res.status(500).json({
      message: "Impossible de récupérer ce contenu.",
      error: error.message
    });
  }
});


// ============================================================
// EXPORT
// ============================================================

export default router;