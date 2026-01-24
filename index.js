let data = [];

// Cargar datos desde el archivo JSON
async function loadData() {
    try {
        const response = await fetch('characters.json');
        data = await response.json();
        renderTables();
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Obtener todas las raids únicas
function getAllRaids() {
    const raids = new Set();
    data.forEach(user => {
        user.characters.forEach(character => {
            character.raids.forEach(raid => {
                raids.add(raid.name);
            });
        });
    });
    return Array.from(raids);
}

// Renderizar las tablas para cada usuario
function renderTables() {
    const content = document.getElementById('content');
    content.innerHTML = '';
    
    const allRaids = getAllRaids();
    
    data.forEach(user => {
        const userSection = document.createElement('div');
        userSection.className = 'user-section';
        
        const userTitle = document.createElement('div');
        userTitle.className = 'user-title';
        userTitle.textContent = `👤 ${user.account}`;
        userSection.appendChild(userTitle);
        
        const table = document.createElement('table');
        
        // Crear encabezado
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const raidHeaderCell = document.createElement('th');
        raidHeaderCell.textContent = 'Raid';
        headerRow.appendChild(raidHeaderCell);
        
        user.characters.forEach(character => {
            const th = document.createElement('th');
            th.innerHTML = `<div class="character-name">${character.name}</div><div class="character-info">${character.class} - ${character.iLvl}</div>`;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Crear cuerpo de la tabla
        const tbody = document.createElement('tbody');
        
        allRaids.forEach(raidName => {
            const row = document.createElement('tr');
            
            const raidCell = document.createElement('td');
            raidCell.textContent = raidName;
            row.appendChild(raidCell);
            
            user.characters.forEach(character => {
                const cell = document.createElement('td');
                const raid = character.raids.find(r => r.name === raidName);
                
                if (raid) {
                    const button = document.createElement('button');
                    button.className = `raid-button ${raid.completion ? 'complete' : 'incomplete'}`;
                    button.textContent = raid.difficulty;
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

// Guardar datos en el archivo JSON
function saveData() {
    // En un navegador no podemos guardar directamente en el sistema de archivos
    // Esto requeriría un backend o una API
    console.log('Datos actualizados:', JSON.stringify(data, null, 2));
    
    // Para desarrollo local, puedes usar localStorage como alternativa
    localStorage.setItem('raidTrackerData', JSON.stringify(data));
}

// Cargar datos al iniciar
loadData();
