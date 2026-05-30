// routes/dispatch.js
const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')

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

// État en mémoire (partagé entre tous les joueurs connectés au serveur)
const onlineIds    = new Set()
const startTimes   = {}
const playerStatus = {}

router.post('/service', authMembre, (req, res) => {
  const id     = req.user.id
  const online = req.body.online

  if (online) {
    onlineIds.add(id)
    startTimes[id]   = Date.now()
    playerStatus[id] = { status: 'dispo', with: [], action: '' }
  } else {
    onlineIds.delete(id)
    delete startTimes[id]
    delete playerStatus[id]
  }

  res.json({ ok: true })
})

router.post('/statut', authMembre, (req, res) => {
  const id = req.user.id
  if (!onlineIds.has(id)) return res.status(400).json({ message: 'Pas en service' })

  const { status, with: withIds, action } = req.body
  playerStatus[id] = { status, with: withIds || [], action: action || '' }
  res.json({ ok: true })
})

router.get('/status', authMembre, (req, res) => {
  res.json({
    online_ids:    [...onlineIds],
    start_times:   Object.entries(startTimes).map(([id, ts]) => ({ id: Number(id), ts })),
    player_status: playerStatus
  })
})

module.exports = router