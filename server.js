const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const prisma = new PrismaClient();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.post('/api/add-user', async (req, res) => {
  try {
    const { username, password, hwid } = req.body;
    
    console.log('Ajout d\'un nouvel utilisateur:');
    console.log(`- Nom d'utilisateur: ${username}`);
    console.log(`- HWID: ${hwid}`);

    if (!username || !password || !hwid) {
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
    }

    const newUser = await prisma.user.create({
      data: {
        username,
        password, 
        hwid
      }
    });

    console.log('Utilisateur créé avec succès:', newUser.id);
    return res.json({ message: 'Utilisateur ajouté avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Ce nom d\'utilisateur existe déjà' });
    }
    
    return res.status(500).json({ message: 'Erreur lors de l\'ajout de l\'utilisateur' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password, hwid } = req.body;
    
    console.log('Tentative de connexion:');
    console.log(`- Nom d'utilisateur: ${username}`);
    console.log(`- HWID: ${hwid}`);
    
    if (!username || !password || !hwid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nom d\'utilisateur, mot de passe et HWID requis' 
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!user || user.password !== password || user.hwid !== hwid) {
      console.log('Échec de connexion: identifiants ou HWID incorrects');
      return res.status(401).json({ 
        success: false, 
        message: 'Nom d\'utilisateur, mot de passe ou HWID incorrect' 
      });
    }
    
    console.log('Connexion réussie pour:', username);
    return res.json({ 
      success: true, 
      message: 'Connexion réussie',
      userData: {
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la vérification des identifiants:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la connexion' 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Page d'administration disponible sur http://localhost:${PORT}/admin`);
});