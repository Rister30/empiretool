require('dotenv').config()
const express = require('express')
const app = express()

app.use(express.json())
app.use(express.static('public'))

const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

const adminRoutes = require('./routes/admin')
app.use('/api/admin', adminRoutes)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`)
})