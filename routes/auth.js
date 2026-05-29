const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const users = []

router.post('/register', async (req, res) => {
  const { username, password, role } = req.body
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ message: 'Cet identifiant existe déjà' })
  }
  const hash = await bcrypt.hash(password, 10)
  users.push({ username, password: hash, role: role || 'membre' })
  res.json({ message: 'Compte créé !' })
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = users.find(u => u.username === username)
  if (!user) return res.status(401).json({ message: 'Identifiants incorrects' })
  
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ message: 'Identifiants incorrects' })

  const token = jwt.sign(
    { username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )
  res.json({ token, role: user.role })
})

module.exports = router