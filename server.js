const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// ── Données par défaut ──────────────────────────────────────────
const defaultStore = {
  teachers: [
    { nom: 'MCHARFI', prenom: 'Ahmed', email: 'a.mcharfi@ensias.um5.ac.ma' },
    { nom: 'BENALI', prenom: 'Sara', email: 's.benali@ensias.um5.ac.ma' }
  ],
  students: [
    { matricule: 'INS001', nom: 'MOULIM', prenom: 'Aiman', email: 'a.moulim@ensias.um5.ac.ma' },
    { matricule: 'INS002', nom: 'Marfouk', prenom: 'Hamza', email: 'h.marfouk@ensias.um5.ac.ma' },
    { matricule: 'INS003', nom: 'Outafraout', prenom: 'khalid', email: 'k.outafraout@ensias.um5.ac.ma' },
    { matricule: 'INS004', nom: 'Er-ramdany', prenom: 'Ismail', email: 'i.erramdany@ensias.um5.ac.ma' },
  ],
  classes: [
    { annee: '2025-2026', niveau: '2ème année', specialite: 'CSCMC', groupes: '1' }
  ],
  subjects: [
    { code: 'AGILE', intitule: "Agile" },
    { code: 'MS', intitule: 'Mobile Security' },
    { code: 'WS', intitule: 'Web Service' }
  ],
  grades: {
    'S3 2025/2026': {}
  }
};

// ── Gestion de la persistance (JSON temporaire) ────────────────
function getStore() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultStore, null, 2));
    return defaultStore;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveStore(store) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2));
}

// ── Endpoints API ──────────────────────────────────────────────

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const store = getStore();
  
  // Simulation de la base d'utilisateurs (basée sur le store + admin fixe)
  const users = {
    'admin@ensias.um5.ac.ma': { role: 'admin', password: 'admin123', nom: 'Administrateur' }
  };
  
  store.teachers.forEach(t => {
    users[t.email] = { role: 'teacher', password: 'teacher123', nom: 'Pr. ' + t.nom };
  });
  
  store.students.forEach(s => {
    users[s.email] = { role: 'student', password: 'student123', nom: s.nom + ' ' + s.prenom, matricule: s.matricule };
  });

  const user = users[email];
  if (user && user.password === password) {
    const { password, ...userSansPass } = user; // Ne pas renvoyer le MDP
    res.json({ success: true, user: { email, ...userSansPass } });
  } else {
    res.status(401).json({ success: false, message: 'Identifiants incorrects' });
  }
});

// Get all data
app.get('/api/store', (req, res) => {
  res.json(getStore());
});

// Update store (pour Admin et Enseignant)
app.post('/api/store', (req, res) => {
  saveStore(req.body);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});
