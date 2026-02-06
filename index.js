let data = [];

// Orden específico de las raids
const RAIDS_ORDER = ['Behemoth', 'Aegir', 'Brelshaza', 'Mordum', 'Armoche', 'Kazeros', 'Thaemine'];

// Configuración de raids con iLvl mínimo requerido
const RAIDS_CONFIG = [
    { name: 'Behemoth', difficulty: 'Normal', minILvl: 1640 },
    { name: 'Aegir', difficulty: 'Solo', minILvl: 1660 },
    { name: 'Aegir', difficulty: 'Normal', minILvl: 1660 },
    { name: 'Aegir', difficulty: 'Hard', minILvl: 1680 },
    { name: 'Brelshaza', difficulty: 'Solo', minILvl: 1670 },
    { name: 'Brelshaza', difficulty: 'Normal', minILvl: 1670 },
    { name: 'Brelshaza', difficulty: 'Hard', minILvl: 1690 },
    { name: 'Mordum', difficulty: 'Solo', minILvl: 1680 },
    { name: 'Mordum', difficulty: 'Normal', minILvl: 1680 },
    { name: 'Mordum', difficulty: 'Hard', minILvl: 1700 },
    { name: 'Armoche', difficulty: 'Normal', minILvl: 1700 },
    { name: 'Armoche', difficulty: 'Hard', minILvl: 1720 },
    { name: 'Kazeros', difficulty: 'Normal', minILvl: 1710 },
    { name: 'Kazeros', difficulty: 'Hard', minILvl: 1730 },
    { name: 'Thaemine', difficulty: 'Extreme', minILvl: 1730 }
];

// Verificar y ejecutar reset semanal (cada miércoles a las 9:00 AM UTC)
function checkWeeklyReset() {
    const now = new Date();
    const utcDay = now.getUTCDay(); // 0 = domingo, 3 = miércoles
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    
    // Verificar si es miércoles (3) y si la hora es entre las 9:00 y 9:59
    const isWednesday = utcDay === 3;
    const isResetTime = utcHours === 9;
    
    if (isWednesday && isResetTime) {
        const lastResetDate = localStorage.getItem('lastWeeklyResetDate');
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
        
        // Solo resetear si no se ha hecho hoy
        if (lastResetDate !== today) {
            console.log('🔄 Ejecutando reset semanal...');
            resetAllRaids();
            localStorage.setItem('lastWeeklyResetDate', today);
        }
    }
}

// Resetear todas las raids a no completadas
function resetAllRaids() {
    if (!data || data.length === 0) return;
    
    data.forEach(user => {
        user.characters.forEach(character => {
            character.raids.forEach(raid => {
                raid.completion = false;
            });
        });
    });
    
    saveData();
    renderTables();
    console.log('✅ Todas las raids han sido reseteadas');
}

// Cargar datos desde Firebase
function loadData() {
    if (typeof window.database === 'undefined') {
        console.error('Base de datos de Firebase no inicializada');
        setTimeout(loadData, 100); // Reintentar después de 100ms
        return;
    }
    
    // Usar las funciones del SDK modular
    const { ref, onValue } = window.firebaseDatabase;
    
    console.log('Intentando cargar datos de Firebase...');
    
    onValue(ref(window.database), (snapshot) => {
        console.log('Snapshot recibido:', snapshot.exists(), snapshot.val());
        if (snapshot.exists()) {
            data = snapshot.val();
            renderTables();
        } else {
            console.log('No data available - La base de datos está vacía');
            document.getElementById('content').innerHTML = '<div class="loading">❌ No hay datos en Firebase.<br><br><strong>Solución:</strong><br>1. Ve a <a href="https://console.firebase.google.com/" target="_blank">Firebase Console</a><br>2. Selecciona tu proyecto "la-planner"<br>3. Ve a Realtime Database<br>4. Haz clic en "Importar JSON"<br>5. Sube tu archivo characters.json</div>';
        }
    }, (error) => {
        console.error('Error loading data:', error);
        document.getElementById('content').innerHTML = '<div class="loading">❌ Error al conectar con Firebase: ' + error.message + '</div>';
    });
}

// Obtener raids de un usuario específico con sus dificultades
function getUserRaidesWithDifficulty(user) {
    const raidDifficultyMap = new Map(); // Clave: "raidName_difficulty"
    
    user.characters.forEach(character => {
        character.raids.forEach(raid => {
            if (RAIDS_ORDER.includes(raid.name)) {
                const key = `${raid.name}_${raid.difficulty}`;
                if (!raidDifficultyMap.has(key)) {
                    raidDifficultyMap.set(key, { name: raid.name, difficulty: raid.difficulty });
                }
            }
        });
    });
    
    // Convertir a array y ordenar: primero por nombre de raid, luego por dificultad
    const difficultyOrder = { 'Solo': 0, 'Normal': 1, 'Hard': 2, 'Extreme': 3 };
    return Array.from(raidDifficultyMap.values()).sort((a, b) => {
        const nameCompare = RAIDS_ORDER.indexOf(a.name) - RAIDS_ORDER.indexOf(b.name);
        if (nameCompare !== 0) return nameCompare;
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    });
}

// Calcular estadísticas de un usuario
function getUserStats(user) {
    let totalRaids = 0;
    let completedRaids = 0;
    
    user.characters.forEach(character => {
        character.raids.forEach(raid => {
            totalRaids++;
            if (raid.completion) completedRaids++;
        });
    });
    
    const remainingRaids = totalRaids - completedRaids;
    return { remaining: remainingRaids, total: totalRaids };
}

//Ordenar personajes por iLvl descendente
function sortCharactersByILvl(characters) {
    return characters.sort((a, b) => b.iLvl - a.iLvl);
}

// Calcular estadísticas de un personaje
function getCharacterStats(character) {
    let totalRaids = character.raids.length;
    let completedRaids = character.raids.filter(raid => raid.completion).length;
    const remainingRaids = totalRaids - completedRaids;
    
    return { remaining: remainingRaids, total: totalRaids };
}

// Calcular estadísticas de una raid
function getRaidStats(user, raidName, raidDifficulty) {
    let total = 0;
    let completed = 0;
    
    user.characters.forEach(character => {
        const raid = character.raids.find(r => r.name === raidName && r.difficulty === raidDifficulty);
        if (raid) {
            total++;
            if (raid.completion) completed++;
        }
    });
    
    const remaining = total - completed;
    return { remaining, total };
}

// Renderizar las tablas para cada usuario
function renderTables() {
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    data.forEach(user => {
        const raidesWithDifficulty = getUserRaidesWithDifficulty(user);
        
        // Si el usuario no tiene raids, no mostrar su tabla
        if (raidesWithDifficulty.length === 0) return;
        
        const userStats = getUserStats(user);
        const userSection = document.createElement('div');
        userSection.className = 'user-section';
        
        const userTitle = document.createElement('div');
        userTitle.className = 'user-title';
        userTitle.innerHTML = `👤 ${user.account} <span class="stats">[${userStats.remaining}/${userStats.total}]</span>`;
        userSection.appendChild(userTitle);
        
        const table = document.createElement('table');
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const raidHeaderCell = document.createElement('th');
        raidHeaderCell.textContent = 'Raid';
        headerRow.appendChild(raidHeaderCell);
        
        user.characters = sortCharactersByILvl(user.characters);
        user.characters.forEach(character => {
            const charStats = getCharacterStats(character);
            const th = document.createElement('th');
            th.innerHTML = `<div class="character-header"><span class="character-name" style="cursor: pointer;" data-edit-raids="true">${character.name}</span><span class="character-ilvl" data-character-index="${user.characters.indexOf(character)}" data-user-index="${data.indexOf(user)}">${character.iLvl}</span></div><div class="character-info">${character.class}</div><div class="character-stats">[${charStats.remaining}/${charStats.total}]</div>`;
            
            // Agregar evento click al nombre para editar raids
            const nameElement = th.querySelector('.character-name');
            nameElement.addEventListener('click', () => openRaidSelector(user, character));
            
            // Agregar evento click al iLvl para editarlo
            const iLvlElement = th.querySelector('.character-ilvl');
            iLvlElement.addEventListener('click', () => editILvl(iLvlElement, user, character));
            
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        raidesWithDifficulty.forEach(raidInfo => {
            const raidStats = getRaidStats(user, raidInfo.name, raidInfo.difficulty);
            const row = document.createElement('tr');
            
            const raidCell = document.createElement('td');
            raidCell.className = `raid-cell difficulty-${raidInfo.difficulty.toLowerCase()}`;
            raidCell.innerHTML = `<span class="raid-name">${raidInfo.name}</span><span class="raid-difficulty">${raidInfo.difficulty}</span><div class="raid-stats">[${raidStats.remaining}/${raidStats.total}]</div>`;
            row.appendChild(raidCell);
            
            user.characters.forEach(character => {
                const cell = document.createElement('td');
                const raid = character.raids.find(r => r.name === raidInfo.name && r.difficulty === raidInfo.difficulty);
                
                if (raid) {
                    const button = document.createElement('button');
                    button.className = `raid-button ${raid.completion ? 'complete' : 'incomplete'}`;
                    button.textContent = raid.completion ? 'Hecho' : 'Pendiente';
                    button.addEventListener('click', () => toggleRaidCompletion(user, character, raid, button));
                    cell.appendChild(button);
                } else {
                    cell.textContent = '-';
                    cell.style.textAlign = 'center';
                    cell.style.color = '#666';
                }
                
                row.appendChild(cell);
            });
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        userSection.appendChild(table);
        content.appendChild(userSection);
    });
}

// Toggle de completación de raid
function toggleRaidCompletion(user, character, raid, button) {
    raid.completion = !raid.completion;
    
    if (raid.completion) {
        button.classList.remove('incomplete');
        button.classList.add('complete');
    } else {
        button.classList.remove('complete');
        button.classList.add('incomplete');
    }
    
    saveData();
}

// Editar iLvl de un personaje
function editILvl(iLvlElement, user, character) {
    const currentILvl = character.iLvl;
    
    // Crear input para editar
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentILvl;
    input.min = '0';
    input.step = '1';
    input.className = 'ilvl-input';
    
    // Reemplazar el elemento con el input
    iLvlElement.innerHTML = '';
    iLvlElement.appendChild(input);
    input.focus();
    input.select();
    
    // Función para guardar cambios
    function saveChanges() {
        const newILvl = parseInt(input.value);
        
        if (isNaN(newILvl) || newILvl < 0) {
            // Si es inválido, restaurar el valor anterior
            iLvlElement.textContent = currentILvl;
        } else {
            character.iLvl = newILvl;
            iLvlElement.textContent = newILvl;
            saveData();
            renderTables();
        }
    }
    
    // Guardar al presionar Enter
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveChanges();
        }
    });
    
    // Guardar al perder el foco
    input.addEventListener('blur', saveChanges);
}

// Abrir selector de raids para un personaje
function openRaidSelector(user, character) {
    // Crear modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `<h2>Editar raids: ${character.name}</h2><button class="modal-close">&times;</button>`;
    modalContent.appendChild(header);
    
    // Información de iLvl
    const info = document.createElement('div');
    info.className = 'modal-info';
    info.innerHTML = `<strong>iLvl actual:</strong> ${character.iLvl}`;
    modalContent.appendChild(info);
    
    // Contenedor de raids
    const raidsContainer = document.createElement('div');
    raidsContainer.className = 'raids-container';
    
    // Agrupar raids por nombre
    const raidsByName = {};
    RAIDS_CONFIG.forEach(raid => {
        if (!raidsByName[raid.name]) {
            raidsByName[raid.name] = [];
        }
        raidsByName[raid.name].push(raid);
    });
    
    // Crear checkboxes para cada raid
    RAIDS_ORDER.forEach(raidName => {
        if (raidsByName[raidName]) {
            const raidSection = document.createElement('div');
            raidSection.className = 'raid-section';
            
            const raidTitle = document.createElement('div');
            raidTitle.className = 'raid-section-title';
            raidTitle.textContent = raidName;
            raidSection.appendChild(raidTitle);
            
            raidsByName[raidName].forEach(raidConfig => {
                const checkboxDiv = document.createElement('div');
                checkboxDiv.className = 'checkbox-item';
                
                const currentRaid = character.raids.find(r => r.name === raidConfig.name && r.difficulty === raidConfig.difficulty);
                const isAvailable = character.iLvl >= raidConfig.minILvl;
                
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `raid-${raidConfig.name}-${raidConfig.difficulty}`;
                checkbox.checked = !!currentRaid;
                checkbox.disabled = !isAvailable;
                checkbox.dataset.raidName = raidConfig.name;
                checkbox.dataset.difficulty = raidConfig.difficulty;
                checkbox.dataset.minILvl = raidConfig.minILvl;
                
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.innerHTML = `${raidConfig.difficulty} (${raidConfig.minILvl})`;
                
                if (!isAvailable) {
                    label.className = 'disabled';
                }
                
                checkboxDiv.appendChild(checkbox);
                checkboxDiv.appendChild(label);
                
                // Event listener para cambios
                checkbox.addEventListener('change', () => {
                    handleRaidCheckboxChange(checkbox, character, raidsByName[raidName]);
                });
                
                raidSection.appendChild(checkboxDiv);
            });
            
            raidsContainer.appendChild(raidSection);
        }
    });
    
    modalContent.appendChild(raidsContainer);
    
    // Footer con botón guardar
    const footer = document.createElement('div');
    footer.className = 'modal-footer';
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Guardar';
    saveButton.className = 'modal-button';
    saveButton.addEventListener('click', () => {
        saveData();
        renderTables();
        modal.remove();
    });
    footer.appendChild(saveButton);
    modalContent.appendChild(footer);
    
    modal.appendChild(modalContent);
    
    // Cerrar modal al hacer clic en X
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    
    // Cerrar modal al hacer clic fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
    
    document.body.appendChild(modal);
}

// Manejar cambio de checkbox de raid
function handleRaidCheckboxChange(checkbox, character, diffsInRaid) {
    const raidName = checkbox.dataset.raidName;
    const difficulty = checkbox.dataset.difficulty;
    
    // Obtener la modal para actualizar otros checkboxes
    const modal = document.querySelector('.modal-content');
    
    if (checkbox.checked) {
        // Agregar raid
        const newRaid = RAIDS_CONFIG.find(r => r.name === raidName && r.difficulty === difficulty);
        if (newRaid && !character.raids.find(r => r.name === raidName && r.difficulty === difficulty)) {
            // Remover otras dificultades de la misma raid
            character.raids = character.raids.filter(r => r.name !== raidName);
            // Agregar la nueva
            character.raids.push({
                name: raidName,
                difficulty: difficulty,
                completion: false
            });
            
            // Desactivar otros checkboxes de la misma raid
            if (modal) {
                modal.querySelectorAll(`input[data-raid-name="${raidName}"]`).forEach(cb => {
                    if (cb !== checkbox) {
                        cb.disabled = true;
                    }
                });
            }
        }
    } else {
        // Remover raid
        character.raids = character.raids.filter(r => !(r.name === raidName && r.difficulty === difficulty));
        
        // Reactivar otros checkboxes de la misma raid si el iLvl lo permite
        if (modal) {
            modal.querySelectorAll(`input[data-raid-name="${raidName}"]`).forEach(cb => {
                if (cb !== checkbox) {
                    const minILvl = parseInt(cb.dataset.minILvl);
                    cb.disabled = character.iLvl < minILvl;
                }
            });
        }
    }
}

// Guardar datos en Firebase
async function saveData() {
    try {
        if (typeof window.database === 'undefined') {
            console.error('Base de datos de Firebase no inicializada');
            return;
        }
        
        const { ref, set } = window.firebaseDatabase;
        await set(ref(window.database), data);
        console.log('Datos guardados en Firebase');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Cargar datos al iniciar
loadData();

// Verificar reset semanal cada minuto
setInterval(checkWeeklyReset, 60000); // Cada 60 segundos

// También verificar al cargar la página
checkWeeklyReset();
// ===== FUNCIONES DE BÚSQUEDA DE RAIDS =====

// Abrir modal de búsqueda
function openRaidSearch() {
    const modal = document.getElementById('raidSearchModal');
    modal.classList.add('active');
    
    // Llenar el select con todas las raids disponibles
    const raidSelect = document.getElementById('raidSelect');
    raidSelect.innerHTML = '<option value="">Selecciona una raid...</option>';
    
    const allRaids = new Set();
    data.forEach(user => {
        user.characters.forEach(character => {
            character.raids.forEach(raid => {
                allRaids.add(`${raid.name}_${raid.difficulty}`);
            });
        });
    });
    
    // Ordenar raids según RAIDS_ORDER
    const sortedRaids = Array.from(allRaids).sort((a, b) => {
        const nameA = a.split('_')[0];
        const nameB = b.split('_')[0];
        const indexA = RAIDS_ORDER.indexOf(nameA);
        const indexB = RAIDS_ORDER.indexOf(nameB);
        
        if (indexA !== indexB) {
            return indexA - indexB;
        }
        
        // Si son el mismo raid, ordenar por dificultad
        const diffOrder = { 'Normal': 0, 'Hard': 1, 'Extreme': 2 };
        const diffA = a.split('_')[1];
        const diffB = b.split('_')[1];
        return diffOrder[diffA] - diffOrder[diffB];
    });
    
    sortedRaids.forEach(raidKey => {
        const [raidName, difficulty] = raidKey.split('_');
        const option = document.createElement('option');
        option.value = raidKey;
        option.textContent = `${raidName} - ${difficulty}`;
        raidSelect.appendChild(option);
    });
}

// Cerrar modal de búsqueda
function closeRaidSearch() {
    const modal = document.getElementById('raidSearchModal');
    modal.classList.remove('active');
}

// Actualizar resultados de búsqueda
function updateRaidMatches() {
    const raidSelect = document.getElementById('raidSelect');
    const raidKey = raidSelect.value;
    const matchesContainer = document.getElementById('raidMatches');
    
    if (!raidKey) {
        matchesContainer.innerHTML = '';
        return;
    }
    
    const [selectedRaidName, selectedDifficulty] = raidKey.split('_');
    
    // Encontrar quién puede hacer esta raid y NO la ha completado
    const matchesMap = new Map(); // account -> caracteres
    
    data.forEach(user => {
        const characters = user.characters.filter(char => {
            const raidData = char.raids.find(raid => 
                raid.name === selectedRaidName && raid.difficulty === selectedDifficulty
            );
            // Solo mostrar si tiene la raid Y no está completada
            return raidData && !raidData.completion;
        });
        
        if (characters.length > 0) {
            matchesMap.set(user.account, characters);
        }
    });
    
    // Renderizar resultados
    if (matchesMap.size === 0) {
        matchesContainer.innerHTML = '<div class="no-matches">¡Todos han completado esta raid esta semana!</div>';
        return;
    }
    
    let html = '';
    matchesMap.forEach((characters, accountName) => {
        html += `<div class="raid-match-group">`;
        html += `<div class="raid-match-account">${accountName}</div>`;
        
        characters.forEach(character => {
            html += `<div class="raid-match-character">
                <span>${character.name} (${character.iLvl})</span>
                <span class="character-class-badge">${character.class}</span>
            </div>`;
        });
        
        html += `</div>`;
    });
    
    matchesContainer.innerHTML = html;
}

// Cerrar modal al hacer clic fuera
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('raidSearchModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeRaidSearch();
            }
        });
    }
});