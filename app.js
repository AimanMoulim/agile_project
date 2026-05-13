// ═══════════════════════════════════════════════
//  BULLETINS ÉTUDIANT – app.js (VERSION FULLSTACK)
// ═══════════════════════════════════════════════

const API_URL = 'http://localhost:3000/api';

// ── State global ────────────────────────────────────────────────
let store = {};
let currentUser = JSON.parse(sessionStorage.getItem('be_user')) || null;

// ── Chargement des données ───────────────────────────────────────
async function fetchStore() {
  try {
    const res = await fetch(`${API_URL}/store`);
    store = await res.json();
  } catch (err) {
    console.error('Erreur de chargement du store:', err);
  }
}

async function updateStore() {
  try {
    await fetch(`${API_URL}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
  } catch (err) {
    console.error('Erreur de sauvegarde du store:', err);
  }
}

// ── Utilitaire : afficher un message flash ────────────────────────
function flash(elId, msg, type) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = 'alert alert-' + type;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3500);
}

// ═══════════════════════════════════════════════
//  LOGIN & REDIRECTION
// ═══════════════════════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if (!email.endsWith('@ensias.um5.ac.ma')) {
    errEl.textContent = 'Veuillez utiliser une adresse @ensias.um5.ac.ma.';
    errEl.className = 'alert alert-error';
    errEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      sessionStorage.setItem('be_user', JSON.stringify(currentUser));
      redirectByRole(currentUser.role);
    } else {
      errEl.textContent = data.message;
      errEl.className = 'alert alert-error';
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = 'Erreur de connexion au serveur.';
    errEl.style.display = 'block';
  }
}

function redirectByRole(role) {
  if (role === 'admin') window.location.href = 'admin.html';
  else if (role === 'teacher') window.location.href = 'enseignant.html';
  else window.location.href = 'etudiant.html';
}

async function devAccess(role) {
  let email = '', password = 'admin123';
  if (role === 'admin') email = 'admin@ensias.um5.ac.ma';
  else if (role === 'teacher') { email = 's.benali@ensias.um5.ac.ma'; password = 'teacher123'; }
  else if (role === 'student') { email = 'a.moulim@ensias.um5.ac.ma'; password = 'student123'; }

  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (data.success) {
    sessionStorage.setItem('be_user', JSON.stringify(data.user));
    redirectByRole(data.user.role);
  }
}

function logout() {
  sessionStorage.removeItem('be_user');
  window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════
//  ENSEIGNANT (US20)
// ═══════════════════════════════════════════════
async function initTeacher() {
  if (!currentUser || currentUser.role !== 'teacher') { logout(); return; }
  document.getElementById('teacher-welcome').textContent = 'Bienvenue ' + currentUser.nom;

  await fetchStore();

  const matSel = document.getElementById('t-matiere');
  if (matSel) {
    matSel.innerHTML = '<option value="">Matière</option>';
    store.subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.code; opt.textContent = s.intitule;
      matSel.appendChild(opt);
    });
  }

  const clsSel = document.getElementById('t-classe');
  if (clsSel) {
    clsSel.innerHTML = '<option value="">Classe</option>';
    store.classes.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.niveau; opt.textContent = c.niveau + ' - ' + c.specialite;
      clsSel.appendChild(opt);
    });
  }
}

function loadGradeTable() {
  const sem = document.getElementById('t-semestre').value;
  const matCode = document.getElementById('t-matiere').value;
  const classe = document.getElementById('t-classe').value;
  const groupe = document.getElementById('t-groupe').value;

  if (!sem || !matCode || !classe || !groupe) {
    alert('Veuillez remplir tous les filtres.');
    return;
  }

  const tbody = document.getElementById('grade-tbody');
  tbody.innerHTML = '';

  store.students.forEach(st => {
    const saved = store.grades[sem]?.[st.matricule]?.[matCode];
    const tr = document.createElement('tr');
    tr.dataset.matricule = st.matricule;
    tr.innerHTML = `
      <td>${st.nom} ${st.prenom}</td>
      <td><input type="number" class="grade-input" data-field="tps" min="0" max="20" step="0.5" value="${saved ? saved.tps : ''}" oninput="calcMoy(this)"/></td>
      <td><input type="number" class="grade-input" data-field="projet" min="0" max="20" step="0.5" value="${saved ? saved.projet : ''}" oninput="calcMoy(this)"/></td>
      <td><input type="number" class="grade-input" data-field="cc1" min="0" max="20" step="0.5" value="${saved ? saved.cc1 : ''}" oninput="calcMoy(this)"/></td>
      <td><input type="number" class="grade-input" data-field="cc2" min="0" max="20" step="0.5" value="${saved ? saved.cc2 : ''}" oninput="calcMoy(this)"/></td>
      <td class="moy-bold">${saved ? saved.moy.toFixed(1) : ''}</td>
    `;
    tbody.appendChild(tr);
  });
}

function calcMoy(input) {
  const tr = input.closest('tr');
  const inputs = [...tr.querySelectorAll('.grade-input')];
  const vals = inputs.map(i => parseFloat(i.value));
  if (vals.every(v => !isNaN(v) && v >= 0 && v <= 20)) {
    const moy = (vals[0] * 0.2) + (vals[1] * 0.3) + (vals[2] * 0.25) + (vals[3] * 0.25);
    tr.querySelector('.moy-bold').textContent = moy.toFixed(1);
  } else {
    tr.querySelector('.moy-bold').textContent = '';
  }
}

async function saveGrades() {
  const sem = document.getElementById('t-semestre').value;
  const matCode = document.getElementById('t-matiere').value;
  if (!sem || !matCode) { flash('grades-msg', 'Sélectionnez semestre et matière.', 'error'); return; }

  const rows = [...document.querySelectorAll('#grade-tbody tr[data-matricule]')];
  if (!store.grades[sem]) store.grades[sem] = {};

  rows.forEach(tr => {
    const mat = tr.dataset.matricule;
    const inputs = [...tr.querySelectorAll('.grade-input')];
    const vals = inputs.map(i => parseFloat(i.value));
    if (vals.every(v => isNaN(v))) return;
    const moy = (vals[0] * 0.2) + (vals[1] * 0.3) + (vals[2] * 0.25) + (vals[3] * 0.25);
    if (!store.grades[sem][mat]) store.grades[sem][mat] = {};
    store.grades[sem][mat][matCode] = { tps: vals[0], projet: vals[1], cc1: vals[2], cc2: vals[3], moy };
  });

  await updateStore();
  flash('grades-msg', 'Enregistrement effectué !', 'success');
}

// ═══════════════════════════════════════════════
//  ÉTUDIANT (US24)
// ═══════════════════════════════════════════════
async function initStudent() {
  if (!currentUser || currentUser.role !== 'student') { logout(); return; }
  document.getElementById('student-welcome').textContent = 'Bonjour ' + currentUser.nom;
  await fetchStore();
}

function loadBulletin() {
  const sem = document.getElementById('s-semestre').value;
  const mat = currentUser.matricule;
  const tbody = document.getElementById('bulletin-tbody');
  if (!sem) { tbody.innerHTML = ''; return; }

  const semData = store.grades ? store.grades[sem]?.[mat] : null;
  tbody.innerHTML = '';
  if (!semData) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:16px">Aucune note.</td></tr>';
    document.getElementById('moy-gen').textContent = '/ 20';
    return;
  }

  let total = 0, count = 0;
  Object.entries(semData).forEach(([code, g]) => {
    const subj = store.subjects.find(s => s.code === code);
    const tr = document.createElement('tr');

    const fmt = (v) => (v !== null && v !== undefined && v !== '') ? `<strong>${v}</strong>` : '-';
    const moyDisplay = (g.moy !== null && g.moy !== undefined) ? g.moy.toFixed(1) : '-';

    tr.innerHTML = `
      <td><strong>${subj ? subj.intitule : code}</strong></td>
      <td>${fmt(g.tps)}</td><td class="col-pct">20</td>
      <td>${fmt(g.projet)}</td><td class="col-pct">30</td>
      <td>${fmt(g.cc1)}</td><td class="col-pct">25</td>
      <td>${fmt(g.cc2)}</td><td class="col-pct">25</td>
      <td>${moyDisplay}</td>
    `;
    tbody.appendChild(tr);

    if (g.moy !== null && g.moy !== undefined) {
      total += g.moy;
      count++;
    }
  });

  if (count > 0) {
    document.getElementById('moy-gen').textContent = (total / count).toFixed(1) + ' / 20';
  } else {
    document.getElementById('moy-gen').textContent = '/ 20';
  }
}

// ═══════════════════════════════════════════════
//  ADMIN (US04/06/12/16)
// ═══════════════════════════════════════════════
async function initAdmin() {
  if (!currentUser || currentUser.role !== 'admin') { logout(); return; }
  await fetchStore();
  ['teachers', 'students', 'classes', 'subjects'].forEach(renderAdminTab);
  showAdminTab('teachers', document.querySelector('.sidebar-link.active'));
}

function showAdminTab(name, link) {
  document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  document.getElementById('admin-' + name).style.display = 'block';
  if (link) link.classList.add('active');
}

const adminMeta = {
  teachers: { keys: ['nom', 'prenom', 'email'], placeholders: ['Nom', 'Prénom', 'Email'], types: ['text', 'text', 'email'] },
  students: { keys: ['matricule', 'nom', 'prenom', 'email'], placeholders: ['Matricule', 'Nom', 'Prénom', 'Email'], types: ['text', 'text', 'text', 'email'] },
  classes: { keys: ['annee', 'niveau', 'specialite', 'groupes'], placeholders: ['2024-2025', 'Niveau', 'Spécialité', 'Nb groupes'], types: ['text', 'text', 'text', 'text'] },
  subjects: { keys: ['code', 'intitule'], placeholders: ['Code', 'Intitulé'], types: ['text', 'text'] }
};

function renderAdminTab(name) {
  const meta = adminMeta[name];
  const tbody = document.getElementById('tbody-' + name);
  if (!tbody) return;
  tbody.innerHTML = '';
  store[name].forEach((row, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = meta.keys.map(k => `<td>${row[k] || ''}</td>`).join('') + `<td><button class="btn-del" onclick="deleteAdminRow('${name}',${idx})">✕</button></td>`;
    tbody.appendChild(tr);
  });
}

function addAdminRow(name) {
  const meta = adminMeta[name];
  const tbody = document.getElementById('tbody-' + name);
  const tr = document.createElement('tr');
  tr.classList.add('new-row');
  tr.innerHTML = meta.keys.map((k, i) => `<td><input type="${meta.types[i]}" data-key="${k}" placeholder="${meta.placeholders[i]}"/></td>`).join('') + `<td><button class="btn-del" onclick="this.closest('tr').remove()">✕</button></td>`;
  tbody.appendChild(tr);
}

async function saveAdminTable(name) {
  const newRows = [...document.querySelectorAll(`#tbody-${name} tr.new-row`)];
  newRows.forEach(tr => {
    const obj = {};
    [...tr.querySelectorAll('input')].forEach(inp => obj[inp.dataset.key] = inp.value.trim());
    store[name].push(obj);
  });
  await updateStore();
  renderAdminTab(name);
  flash('msg-' + name, 'Enregistré !', 'success');
}

async function deleteAdminRow(name, idx) {
  store[name].splice(idx, 1);
  await updateStore();
  renderAdminTab(name);
}

// Initialisation au chargement de la page
window.onload = () => {
  const path = window.location.pathname;
  if (path.includes('admin.html')) initAdmin();
  else if (path.includes('enseignant.html')) initTeacher();
  else if (path.includes('etudiant.html')) initStudent();
};
