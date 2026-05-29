const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ message: 'Non autorisé' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'admin') return res.status(403).json({ message: 'Accès refusé' })
    req.user = payload
    next()
  } catch {
    res.status(401).json({ message: 'Token invalide' })
  }
}

router.get('/users', authAdmin, async (req, res) => {
  const result = await pool.query('SELECT id, username, role FROM users ORDER BY id')
  res.json(result.rows)
})

router.put('/users/:id', authAdmin, async (req, res) => {
  const { role } = req.body
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id])
  res.json({ message: 'Rôle mis à jour !' })
})

router.delete('/users/:id', authAdmin, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id])
  res.json({ message: 'Compte supprimé !' })
})

module.exports = router