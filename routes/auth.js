const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

// Créer la table si elle n'existe pas
pool.query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'membre'
  )
`)

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body
  try {
    const exists = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: 'Cet identifiant existe déjà' })
    }
    const hash = await bcrypt.hash(password, 10)
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      [username, hash, role || 'membre']
    )
    res.json({ message: 'Compte créé !' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username])
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Identifiants incorrects' })
    }
    const user = result.rows[0]
    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' })

    const token = jwt.sign(
      { username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, role: user.role })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
})

module.exports = router