<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Empire Tool - Admin</title>
  <style>
    body { background: #0a0a0a; color: #FFE81F; font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    .box { background: #111; padding: 40px; border-radius: 10px; border: 1px solid #FFE81F; width: 350px; }
    h2 { text-align: center; margin-bottom: 20px; }
    input, select { width: 100%; padding: 10px; margin: 8px 0; background: #222; border: 1px solid #FFE81F; color: white; border-radius: 5px; box-sizing: border-box; }
    button { width: 100%; padding: 10px; background: #FFE81F; color: black; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-top: 10px; }
    #msg { text-align: center; margin-top: 10px; }
    .success { color: lightgreen; }
    .error { color: red; }
    .back { background: #222; color: #FFE81F; border: 1px solid #FFE81F; margin-top: 8px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>⚙️ Créer un compte</h2>
    <input type="text" id="username" placeholder="Identifiant" />
    <input type="password" id="password" placeholder="Mot de passe" />
    <select id="role">
      <option value="membre">Membre</option>
      <option value="officier">Officier</option>
      <option value="admin">Admin</option>
    </select>
    <button onclick="createAccount()">Créer le compte</button>
    <button class="back" onclick="window.location.href='/dashboard.html'">← Retour au dashboard</button>
    <p id="msg"></p>
  </div>
  <script>
    const token = localStorage.getItem('token')
    if (!token) window.location.href = '/login.html'
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (payload.role !== 'admin') {
      alert('⛔ Accès refusé - Réservé aux administrateurs')
      window.location.href = '/dashboard.html'
    }

    async function createAccount() {
      const username = document.getElementById('username').value
      const password = document.getElementById('password').value
      const role = document.getElementById('role').value

      if (!username || !password) {
        document.getElementById('msg').textContent = 'Remplis tous les champs !'
        document.getElementById('msg').className = 'error'
        return
      }

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify({ username, password, role })
      })
      const data = await res.json()
      const msg = document.getElementById('msg')
      if (res.ok) {
        msg.textContent = `✅ Compte "${username}" créé avec le rôle "${role}" !`
        msg.className = 'success'
        document.getElementById('username').value = ''
        document.getElementById('password').value = ''
      } else {
        msg.textContent = '❌ ' + data.message
        msg.className = 'error'
      }
    }
  </script>
</body>
</html>