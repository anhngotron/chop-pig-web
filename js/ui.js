/* ----------------------------------------------------
   UI.JS — Rendering, Events, Modals, Dark Mode
-----------------------------------------------------*/

/* DOM ELEMENTS */
const playerListEl = document.getElementById("playerList");
const roundRowsEl = document.getElementById("roundRows");
const leaderboardEl = document.getElementById("leaderboard");

const addPlayerBtn = document.getElementById("addPlayerBtn");
const newRoundBtn = document.getElementById("newRoundBtn");
const saveRoundBtn = document.getElementById("saveRoundBtn");

const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");

const modalOverlay = document.getElementById("modalOverlay");
const addPlayerModal = document.getElementById("addPlayerModal");
const importModal = document.getElementById("importModal");

const newPlayerNameInput = document.getElementById("newPlayerName");
const confirmAddPlayerBtn = document.getElementById("confirmAddPlayer");

const importTextArea = document.getElementById("importText");
const confirmImportBtn = document.getElementById("confirmImport");

const darkModeToggle = document.getElementById("darkModeToggle");

/* ----------------------------------------------------
   MODAL HELPERS
-----------------------------------------------------*/
function openModal(modal) {
    modalOverlay.classList.remove("hidden");
    modal.classList.remove("hidden");
}

function closeModals() {
    modalOverlay.classList.add("hidden");
    addPlayerModal.classList.add("hidden");
    importModal.classList.add("hidden");
}

document.querySelectorAll(".close-modal").forEach(btn => {
    btn.addEventListener("click", closeModals);
});

modalOverlay.addEventListener("click", closeModals);

/* ----------------------------------------------------
   RENDERING — PLAYER LIST
-----------------------------------------------------*/
function renderPlayers() {
    playerListEl.innerHTML = "";

    AppState.players.forEach(player => {
        const card = document.createElement("div");
        card.className = "player-card";

        card.innerHTML = `
            <div class="player-name">${player.name}</div>
            <div class="player-score">${player.score}</div>
        `;

        playerListEl.appendChild(card);
    });
}

/* ----------------------------------------------------
   RENDERING — ROUND ROWS
-----------------------------------------------------*/
function renderRoundRows() {
    roundRowsEl.innerHTML = "";

    AppState.roundRows.forEach(row => {
        const player = AppState.players.find(p => p.id === row.playerId);
        if (!player) return;

        const card = document.createElement("div");
        card.className = "round-card";

        card.innerHTML = `
            <h4>${player.name}</h4>

            <label>Placement</label>
            <select data-player="${player.id}" data-field="placement">
                <option value="">--</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
            </select>

            <label>
                <input type="checkbox" data-player="${player.id}" data-field="stinky2">
                Stinky 2
            </label>

            <label>
                <input type="checkbox" data-player="${player.id}" data-field="chop">
                Chop
            </label>
        `;

        roundRowsEl.appendChild(card);
    });

    // Wire up inputs
    roundRowsEl.querySelectorAll("select, input[type='checkbox']").forEach(el => {
        el.addEventListener("change", e => {
            const playerId = e.target.dataset.player;
            const field = e.target.dataset.field;
            const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;

            AppState.updateRoundRow(playerId, field, value);
        });
    });
}

/* ----------------------------------------------------
   RENDERING — LEADERBOARD
-----------------------------------------------------*/
function renderLeaderboard() {
    leaderboardEl.innerHTML = "";

    const sorted = [...AppState.players].sort((a, b) => b.score - a.score);

    sorted.forEach((player, index) => {
        const item = document.createElement("div");
        item.className = "leaderboard-item";

        item.innerHTML = `
            <div class="leaderboard-rank">#${index + 1}</div>
            <div>${player.name}</div>
            <div>${player.score}</div>
        `;

        leaderboardEl.appendChild(item);
    });
}

/* ----------------------------------------------------
   NEW ROUND
-----------------------------------------------------*/
newRoundBtn.addEventListener("click", () => {
    AppState.generateRoundRows();
    renderRoundRows();
});

/* ----------------------------------------------------
   SAVE ROUND
-----------------------------------------------------*/
saveRoundBtn.addEventListener("click", () => {
    const { ok, error, results } = calculateRoundResults(AppState.roundRows);

    if (!ok) {
        alert(error);
        return;
    }

    AppState.applyRoundResults(results);

    renderPlayers();
    renderLeaderboard();

    alert("Round saved!");
});

/* ----------------------------------------------------
   ADD PLAYER
-----------------------------------------------------*/
addPlayerBtn.addEventListener("click", () => {
    newPlayerNameInput.value = "";
    openModal(addPlayerModal);
});

confirmAddPlayerBtn.addEventListener("click", () => {
    const name = newPlayerNameInput.value.trim();
    if (!name) return;

    AppState.addPlayer(name);
    renderPlayers();
    closeModals();
});

/* ----------------------------------------------------
   EXPORT JSON
-----------------------------------------------------*/
exportBtn.addEventListener("click", () => {
    const json = AppState.exportJSON();
    navigator.clipboard.writeText(json);
    alert("JSON copied to clipboard!");
});

/* ----------------------------------------------------
   IMPORT JSON
-----------------------------------------------------*/
importBtn.addEventListener("click", () => {
    importTextArea.value = "";
    openModal(importModal);
});

confirmImportBtn.addEventListener("click", () => {
    const text = importTextArea.value.trim();
    if (!text) return;

    const ok = AppState.importJSON(text);
    if (!ok) {
        alert("Invalid JSON");
        return;
    }

    renderPlayers();
    renderLeaderboard();
    closeModals();
});

/* ----------------------------------------------------
   DARK MODE
-----------------------------------------------------*/
darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
});

/* ----------------------------------------------------
   INITIAL RENDER
-----------------------------------------------------*/
renderPlayers();
renderLeaderboard();