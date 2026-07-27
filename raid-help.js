import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js';
import { getDatabase, ref, onValue } from 'https://www.gstatic.com/firebasejs/10.7.0/firebase-database.js';

const firebaseConfig = {
    apiKey: 'AIzaSyC61vsWUjfVHQOFuejgmXl9Lk4ZEKNQr04',
    authDomain: 'la-planner.firebaseapp.com',
    databaseURL: 'https://la-planner-default-rtdb.europe-west1.firebasedatabase.app',
    projectId: 'la-planner',
    storageBucket: 'la-planner.firebasestorage.app',
    messagingSenderId: '922350103987',
    appId: '1:922350103987:web:a546e04e3b57b867bc6fc6'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const RAIDS_ORDER = ['Behemoth', 'Aegir', 'Brelshaza', 'Mordum', 'Armoche', 'Kazeros', 'Serca', 'Catedral', 'Aegir EX'];
const DIFFICULTY_ORDER = ['Solo', 'Normal', 'Hard', 'Extreme', 'Nightmare'];

function normalizeRaid(raid) {
    if (!raid) return raid;
    raid.completion = Boolean(raid.completion);
    raid.gold = Boolean(raid.gold);
    raid.chest = Boolean(raid.chest);
    raid.needHelp = raid.needHelp === true;
    return raid;
}

function buildRaidEntries(data) {
    const entries = [];

    data.forEach(user => {
        if (!user || !Array.isArray(user.characters)) return;

        user.characters.forEach(character => {
            if (!character || !Array.isArray(character.raids)) return;

            character.raids.forEach(raid => {
                normalizeRaid(raid);
                if (!raid || raid.completion) return;

                const entry = entries.find(item => item.name === raid.name && item.difficulty === raid.difficulty);
                if (!entry) {
                    entries.push({
                        name: raid.name,
                        difficulty: raid.difficulty,
                        accounts: [],
                        helpCount: 0
                    });
                }

                const target = entries.find(item => item.name === raid.name && item.difficulty === raid.difficulty);
                const accountEntry = target.accounts.find(acc => acc.account === user.account);
                if (!accountEntry) {
                    target.accounts.push({
                        account: user.account,
                        characters: []
                    });
                }

                const accountTarget = target.accounts.find(acc => acc.account === user.account);
                accountTarget.characters.push({
                    name: character.name,
                    className: character.class,
                    iLvl: character.iLvl,
                    needHelp: raid.needHelp === true
                });
            });
        });
    });

    entries.forEach(entry => {
        entry.helpCount = entry.accounts.reduce((sum, account) => sum + account.characters.filter(character => character.needHelp).length, 0);
        entry.availableCharacters = entry.accounts.reduce((sum, account) => sum + account.characters.length, 0);
        entry.accounts.sort((a, b) => b.characters.length - a.characters.length);
        entry.accounts.forEach(account => {
            account.characters.sort((a, b) => {
                if (a.needHelp === b.needHelp) return a.name.localeCompare(b.name);
                return a.needHelp ? -1 : 1;
            });
        });
    });

    return entries.sort((a, b) => {
        if (b.helpCount !== a.helpCount) return b.helpCount - a.helpCount;
        if (b.availableCharacters !== a.availableCharacters) return b.availableCharacters - a.availableCharacters;
        const nameCompare = RAIDS_ORDER.indexOf(a.name) - RAIDS_ORDER.indexOf(b.name);
        if (nameCompare !== 0) return nameCompare;
        return DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
    });
}

function renderRaidHelp(data) {
    const content = document.getElementById('raidHelpContent');
    const entries = buildRaidEntries(data);

    if (entries.length === 0) {
        content.innerHTML = '<div class="empty-state">No hay raids pendientes con información disponible.</div>';
        return;
    }

    const grouped = entries.reduce((acc, entry) => {
        if (!acc[entry.name]) acc[entry.name] = [];
        acc[entry.name].push(entry);
        return acc;
    }, {});

    let html = '';

    Object.keys(grouped).forEach(raidName => {
        const raidEntries = grouped[raidName].sort((a, b) => {
            const diffOrder = DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty);
            return diffOrder;
        });

        raidEntries.forEach(entry => {
            const helpBadge = entry.helpCount > 0 ? `<span class="need-help-pill">${entry.helpCount} needHelp</span>` : '';
            html += `
                <div class="difficulty-section">
                    <h2 class="difficulty-title">${entry.name} (${entry.difficulty}) ${helpBadge}</h2>
            `;

            entry.accounts.forEach(account => {
                const charactersHtml = account.characters.map(character => {
                    const helpClass = character.needHelp ? 'need-help' : '';
                    return `<span class="character-chip ${helpClass}">${character.name}${character.needHelp ? ' 🆘' : ''}</span>`;
                }).join('');

                html += `
                    <div class="raid-card ${entry.helpCount > 0 ? 'need-help' : ''}">
                        <div class="raid-header">
                            <div class="raid-title">${account.account}</div>
                            <div class="raid-meta">${account.characters.length} personaje${account.characters.length === 1 ? '' : 's'} pendiente${account.characters.length === 1 ? '' : 's'}</div>
                        </div>
                        <div class="character-list">${charactersHtml}</div>
                    </div>
                `;
            });

            html += '</div>';
        });
    });

    content.innerHTML = html;
}

function loadData() {
    const { ref, onValue } = window.firebaseDatabase;
    onValue(ref(window.database), snapshot => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            renderRaidHelp(data);
        } else {
            document.getElementById('raidHelpContent').innerHTML = '<div class="empty-state">No hay datos disponibles.</div>';
        }
    }, error => {
        document.getElementById('raidHelpContent').innerHTML = `<div class="empty-state">Error al cargar datos: ${error.message}</div>`;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    window.firebaseDatabase = { ref, onValue };
    window.database = database;
    loadData();
});
