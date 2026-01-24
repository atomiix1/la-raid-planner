const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, '..', 'public')));

const DATA_FILE = path.join(__dirname, '..', 'characters.json');

// Lee el JSON (estructura: { usuario: string, personajes: [ ... ] })
async function readData() {
  try {
    const txt = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(txt);
  } catch (err) {
    if (err.code === 'ENOENT') {
      // archivo no existe -> crear con ejemplo (manteniendo la forma esperada)
      const example = {
        usuario: 'Atomiix',
        personajes: [
          {
            id: 'char-1',
            name: 'Aldor',
            class: 'Guerrero',
            level: 60,
            raids: [
              { id: 'raid-1', name: 'Fortaleza Oscura', difficulty: 'Heroico', completed: false },
              { id: 'raid-2', name: 'Cima del Dragón', difficulty: 'Mítico', completed: true }
            ]
          },
          {
            id: 'char-2',
            name: 'Mira',
            class: 'Hechicera',
            level: 58,
            raids: [
              { id: 'raid-3', name: 'Templo Sumergido', difficulty: 'Normal', completed: false },
              { id: 'raid-4', name: 'Catacumbas', difficulty: 'Heroico', completed: false }
            ]
          }
        ]
      };
      await writeData(example);
      return example;
    }
    throw err;
  }
}

// Escritura atómica
async function writeData(data) {
  const tmpPath = DATA_FILE + '.tmp';
  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, content, 'utf8');
  await fs.rename(tmpPath, DATA_FILE);
}

// GET /api/characters -> devuelve el array de personajes
app.get('/api/characters', async (req, res) => {
  try {
    const data = await readData();
    return res.json(data.personajes || []);
  } catch (err) {
    console.error('Error reading data:', err);
    return res.status(500).json({ error: 'Error al leer datos' });
  }
});

// PATCH /api/characters/:charId/raids/:raidId -> cambia completed
app.patch('/api/characters/:charId/raids/:raidId', async (req, res) => {
  const { charId, raidId } = req.params;
  const { completed } = req.body;
  try {
    const data = await readData();
    const personajes = data.personajes || [];
    const char = personajes.find(c => c.id === charId);
    if (!char) return res.status(404).json({ error: 'Personaje no encontrado' });
    const raid = (char.raids || []).find(r => r.id === raidId);
    if (!raid) return res.status(404).json({ error: 'Raid no encontrada' });

    raid.completed = Boolean(completed);
    await writeData(data);
    return res.json(raid);
  } catch (err) {
    console.error('Error updating data:', err);
    return res.status(500).json({ error: 'Error al actualizar datos' });
  }
});

// PUT /api/characters -> reemplaza el array de personajes (útil para cargar desde archivo)
app.put('/api/characters', async (req, res) => {
  const payload = req.body;
  if (!Array.isArray(payload)) return res.status(400).json({ error: 'Se requiere un array de personajes' });
  try {
    const data = await readData();
    data.personajes = payload;
    await writeData(data);
    return res.json({ ok: true });
  } catch (err) {
    console.error('Error writing data:', err);
    return res.status(500).json({ error: 'Error al escribir datos' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}/`));
