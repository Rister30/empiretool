// routes/dispatch.js
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Création de la table si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS dispatch_status (
    user_id     INTEGER PRIMARY KEY,
    online      BOOLEAN DEFAULT false,
    start_time  BIGINT,
    status      VARCHAR(20) DEFAULT 'dispo',
    with_ids    INTEGER[] DEFAULT '{}',
    action      TEXT DEFAULT '',
    updated_at  TIMESTAMP DEFAULT NOW()
  )
`)

function authMembre(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Non autorisé' })
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide' })
  }
}

// Prise / fin de service
router.post('/service', authMembre, async (req, res) => {
  const id     = req.user.id
  const online = req.body.online

  if (online) {
    await pool.query(`
      INSERT INTO dispatch_status (user_id, online, start_time, status, with_ids, action, updated_at)
      VALUES ($1, true, $2, 'dispo', '{}', '', NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET online = true, start_time = $2, status = 'dispo', with_ids = '{}', action = '', updated_at = NOW()
    `, [id, Date.now()])
  } else {
    await pool.query(`
      INSERT INTO dispatch_status (user_id, online, start_time, status, with_ids, action, updated_at)
      VALUES ($1, false, NULL, 'dispo', '{}', '', NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET online = false, start_time = NULL, status = 'dispo', with_ids = '{}', action = '', updated_at = NOW()
    `, [id])
  }

  res.json({ ok: true })
})

// Mise à jour du statut
router.post('/statut', authMembre, async (req, res) => {
  const id = req.user.id
  const { status, with: withIds, action } = req.body

  const row = await pool.query('SELECT online FROM dispatch_status WHERE user_id = $1', [id])
  if (!row.rows.length || !row.rows[0].online) {
    return res.status(400).json({ message: 'Pas en service' })
  }

  await pool.query(`
    UPDATE dispatch_status
    SET status = $1, with_ids = $2, action = $3, updated_at = NOW()
    WHERE user_id = $4
  `, [status, withIds || [], action || '', id])

  res.json({ ok: true })
})

// Lecture de l'état global
router.get('/status', authMembre, async (req, res) => {
  const result = await pool.query('SELECT * FROM dispatch_status WHERE online = true')

  const online_ids    = []
  const start_times   = []
  const player_status = {}

  result.rows.forEach(row => {
    online_ids.push(row.user_id)
    start_times.push({ id: row.user_id, ts: Number(row.start_time) })
    player_status[row.user_id] = {
      status: row.status,
      with:   row.with_ids || [],
      action: row.action   || ''
    }
  })

  res.json({ online_ids, start_times, player_status })
})

module.exports = router
