require('dotenv').config()
const express = require('express')
const app = express()

app.use(express.json())
app.use(express.static('public'))

const authRoutes     = require('./routes/auth')
const adminRoutes    = require('./routes/admin')
const dispatchRoutes = require('./routes/dispatch')   // ✅ ajout

app.use('/api/auth',     authRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/dispatch', dispatchRoutes)              // ✅ ajout

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})