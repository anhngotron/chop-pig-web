// =========================
// ui.js — wiring + DOM
// =========================

document.addEventListener("DOMContentLoaded", () => {
    wireControls();
    renderPlayers();
    renderRoundRows();
    renderLeaderboard();
});

function wireControls() {
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const newRoundBtn = document.getElementById("newRoundBtn");
    const saveRoundBtn = document.getElementById("saveRoundBtn");
    const exportBtn = document.getElementById("exportBtn");
    const importBtn = document.getElementById("importBtn");

    const modalOverlay = document.getElementById("modalOverlay");
    const addPlayerModal = document.getElementById("addPlayerModal");
    const importModal = document.getElementById("importModal");

    const confirmAddPlayer = document.getElementById("confirmAddPlayer");
    const newPlayerName = document.getElementById("newPlayerName");
    const confirmImport = document.getElementById("confirmImport");
    const importText = document.getElementById("importText");

    document.querySelectorAll(".close-modal").forEach(btn => {
        btn.addEventListener("click", closeModals);
    });

    function openModal(modal) {
        modalOverlay.classList.remove("hidden");
        modal.classList.remove("hidden");
    }

    function closeModals() {
        modalOverlay.classList.add("hidden");
        addPlayerModal.classList.add("hidden");
        importModal.classList.add("hidden");
    }

    window.closeModals = closeModals;

    addPlayerBtn.addEventListener("click", () => {
        newPlayerName.value = "";
        openModal(addPlayerModal);
    });

    confirmAddPlayer.addEventListener("click", () => {
        const name = newPlayerName.value.trim();
        if (!name) return;
        if (AppState.players[name]) {
            alert("This player already exists.");
            return;
        }
        AppState.addPlayer(name);
        closeModals();
        renderPlayers();
        renderRoundRows();
        renderLeaderboard();
    });

    newRoundBtn.addEventListener("click", () => {
        AppState.initRoundRows();
        renderRoundRows();
        updateScoresPreview();
    });

    saveRoundBtn.addEventListener("click", () => {
        try {
            ChopLogic.applyRoundToPlayers(AppState.players, AppState.roundRows);
        } catch (e) {
            alert(e.message);
            return;
        }
        AppState.initRoundRows();
        renderPlayers();
        renderRoundRows();
        renderLeaderboard();
    });

    exportBtn.addEventListener("click", () => {
        const data = {
            players: AppState.players
        };
        const json = JSON.stringify(data, null, 2);
        navigator.clipboard.writeText(json).then(() => {
            alert("JSON copied to clipboard.");
        }).catch(() => {
            alert("Here is your JSON:\n\n" + json);
        });
    });

    importBtn.addEventListener("click", () => {
        importText.value = "";
        openModal(importModal);
    });

    confirmImport.addEventListener("click", () => {
        const txt = importText.value.trim();
        if (!txt) return;
        try {
            const obj = JSON.parse(txt);
            if (!obj.players || typeof obj.players !== "object") {
                throw new Error("Invalid JSON format.");
            }
            AppState.players = obj.players;
            AppState.playerList = Object.keys(AppState.players).sort();
            AppState.initRoundRows();
            closeModals();
            renderPlayers();
            renderRoundRows();
            renderLeaderboard();
        } catch (e) {
            alert("Import failed: " + e.message);
        }
    });
}

function renderPlayers() {
    const container = document.getElementById("playerList");
    container.innerHTML = "";
    AppState.playerList.forEach(name => {
        const stats = AppState.players[name];
        const div = document.createElement("div");
        div.className = "player-card";
        div.textContent = `${name} — Score: ${stats.score}, Games: ${stats.games}, Wins: ${stats.wins}`;
        container.appendChild(div);
    });
}

function renderRoundRows() {
    const container = document.getElementById("roundRows");
    container.innerHTML = "";

    const placements = ["", "1st", "2nd", "3rd", "4th", "Stinky 13"];

    AppState.roundRows.forEach((row, idx) => {
        const div = document.createElement("div");
        div.className = "round-row";

        // Player select
        const playerSelect = document.createElement("select");
        const emptyOpt = document.createElement("option");
        emptyOpt.value = "";
        emptyOpt.textContent = "-- Player --";
        playerSelect.appendChild(emptyOpt);
        AppState.playerList.forEach(name => {
            const opt = document.createElement("option");
            opt.value = name;
            opt.textContent = name;
            playerSelect.appendChild(opt);
        });
        playerSelect.value = row.playerName || "";
        playerSelect.addEventListener("change", () => {
            row.playerName = playerSelect.value;
            updateScoresPreview();
        });

        // Placement select
        const placeSelect = document.createElement("select");
        placements.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p;
            opt.textContent = p || "-- Place --";
            placeSelect.appendChild(opt);
        });
        placeSelect.value = row.placement || "";
        placeSelect.addEventListener("change", () => {
            row.placement = placeSelect.value;
            if (!ChopLogic.isStinky2AllowedForRow(AppState.roundRows, idx)) {
                row.stinky2Enabled = false;
                row.stinky2 = { red: 0, black: 0, pairs3: 0, kind4: 0, pairs4: 0 };
            }
            updateScoresPreview();
        });

        // Score display
        const scoreSpan = document.createElement("span");
        scoreSpan.className = "round-score";
        scoreSpan.textContent = "0";

        // Stinky 2 checkbox
        const st2Checkbox = document.createElement("input");
        st2Checkbox.type = "checkbox";
        st2Checkbox.checked = row.stinky2Enabled;
        st2Checkbox.addEventListener("change", () => {
            if (!st2Checkbox.checked) {
                row.stinky2Enabled = false;
                row.stinky2 = { red: 0, black: 0, pairs3: 0, kind4: 0, pairs4: 0 };
                updateScoresPreview();
                return;
            }
            if (!ChopLogic.isStinky2AllowedForRow(AppState.roundRows, idx)) {
                alert(
                    "Stinky 2 is allowed only for:\n" +
                    "- 4th place (when no Stinky 13)\n" +
                    "- Stinky 13 (any time there is Stinky 13)\n" +
                    "- 3rd place (only when there is exactly one Stinky 13)"
                );
                st2Checkbox.checked = false;
                return;
            }
            openStinky2Popup(idx);
        });

        // Chop checkbox
        const chopCheckbox = document.createElement("input");
        chopCheckbox.type = "checkbox";
        chopCheckbox.checked = row.chopData && row.chopData.length > 0;
        chopCheckbox.addEventListener("change", () => {
            if (!chopCheckbox.checked) {
                row.chopData = [];
                updateScoresPreview();
                return;
            }
            if (!row.playerName) {
                alert("Select a player before using Chop Pigs.");
                chopCheckbox.checked = false;
                return;
            }
            openChopPopup(idx);
        });

        const choppedByLabel = document.createElement("span");
        choppedByLabel.className = "chopped-by-label";

        // Clear button
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear";
        clearBtn.addEventListener("click", () => {
            row.playerName = "";
            row.placement = "";
            row.stinky2Enabled = false;
            row.stinky2 = { red: 0, black: 0, pairs3: 0, kind4: 0, pairs4: 0 };
            row.chopData = [];
            renderRoundRows();
            updateScoresPreview();
        });

        div.appendChild(playerSelect);
        div.appendChild(placeSelect);
        div.appendChild(scoreSpan);

        const st2Label = document.createElement("label");
        st2Label.textContent = " Stinky 2 ";
        st2Label.prepend(st2Checkbox);
        div.appendChild(st2Label);

        const chopLabel = document.createElement("label");
        chopLabel.textContent = " Got Chopped? ";
        chopLabel.prepend(chopCheckbox);
        div.appendChild(chopLabel);

        div.appendChild(choppedByLabel);
        div.appendChild(clearBtn);

        container.appendChild(div);

        row._scoreSpan = scoreSpan;
        row._choppedByLabel = choppedByLabel;
    });

    updateScoresPreview();
}

function updateScoresPreview() {
    const scores = ChopLogic.computeRoundScores(AppState.roundRows);
    AppState.roundRows.forEach((row, idx) => {
        if (row._scoreSpan) {
            row._scoreSpan.textContent = scores[idx];
        }
        if (row._choppedByLabel) {
            const choppedBy = (row.chopData || []).map(e => e.chopper);
            row._choppedByLabel.textContent = choppedBy.join(", ");
        }
    });
    renderLeaderboard();
}

function renderLeaderboard() {
    const container = document.getElementById("leaderboard");
    container.innerHTML = "";

    const data = Object.entries(AppState.players).map(([name, stats]) => {
        const games = stats.games;
        const wins = stats.wins;
        const score = stats.score;
        const winRate = games > 0 ? (wins / games * 100) : 0;
        return { name, score, games, winRate };
    });

    data.sort((a, b) => b.score - a.score);

    const ranked = data.filter(d => d.games > 0);
    const unranked = data.filter(d => d.games === 0);
    const lastRankedName = ranked.length ? ranked[ranked.length - 1].name : null;

    let rank = 1;
    ranked.forEach(row => {
        const div = document.createElement("div");
        div.className = "leaderboard-row";
        if (rank === 1) div.classList.add("rank1");
        else if (rank === 2) div.classList.add("rank2");
        else if (rank === 3) div.classList.add("rank3");
        else if (row.name === lastRankedName) div.classList.add("last");

        div.textContent = `${rank}. ${row.name} — Score: ${row.score}, Games: ${row.games}, Win%: ${row.winRate.toFixed(1)}`;
        container.appendChild(div);
        rank++;
    });

    unranked.forEach(row => {
        const div = document.createElement("div");
        div.className = "leaderboard-row unranked";
        div.textContent = `${row.name} — Score: ${row.score}, Games: ${row.games}, Win%: ${row.winRate.toFixed(1)}`;
        container.appendChild(div);
    });
}

// -----------------------------
// Stinky 2 popup (prompt-based)
// -----------------------------
function openStinky2Popup(idx) {
    const row = AppState.roundRows[idx];

    const red = parseInt(prompt("Red Pigs (0–3):", row.stinky2.red) || "0", 10);
    const black = parseInt(prompt("Black Pigs (0–3):", row.stinky2.black) || "0", 10);
    const pairs3 = parseInt(prompt("3 Consecutive Pairs (0–3):", row.stinky2.pairs3) || "0", 10);
    const kind4 = parseInt(prompt("4 of a Kind (0–3):", row.stinky2.kind4) || "0", 10);
    const pairs4 = parseInt(prompt("4 Consecutive Pairs (0–3):", row.stinky2.pairs4) || "0", 10);

    if (!ChopLogic.validStinky2Combo(red, black)) {
        alert(
            "Invalid combo.\nAllowed Stinky 2 red/black combos:\n" +
            "1 Red\n1 Black\n1 Red + 1 Black\n" +
            "2 Red\n2 Black\n2 Red + 1 Black\n1 Red + 2 Black"
        );
        AppState.roundRows[idx].stinky2Enabled = false;
        updateScoresPreview();
        return;
    }

    if (!ChopLogic.isStinky2AllowedForRow(AppState.roundRows, idx)) {
        alert(
            "Stinky 2 is allowed only for:\n" +
            "- 4th place (when no Stinky 13)\n" +
            "- Stinky 13 (any time there is Stinky 13)\n" +
            "- 3rd place (only when there is exactly one Stinky 13)"
        );
        AppState.roundRows[idx].stinky2Enabled = false;
        updateScoresPreview();
        return;
    }

    row.stinky2Enabled = true;
    row.stinky2 = { red, black, pairs3, kind4, pairs4 };
    updateScoresPreview();
}

// -----------------------------
// Chop Pigs popup — multi-chopper
// -----------------------------
function openChopPopup(idx) {
    const row = AppState.roundRows[idx];
    const victim = row.playerName;
    if (!victim) {
        alert("Select a player before editing Chop Pigs.");
        return;
    }

    const newList = [];
    const existingNames = new Set();

    alert(
        "Chop Pigs entry for: " + victim +
        "\n\nYou can enter multiple choppers.\n" +
        "Leave chopper name empty to finish."
    );

    while (true) {
        const chopperName = prompt("Chopper name (existing player, blank to finish):", "");
        if (!chopperName) break;

        if (!AppState.players[chopperName]) {
            alert("Chopper must be an existing player.");
            continue;
        }
        if (chopperName === victim) {
            alert("A player cannot chop themselves.");
            continue;
        }
        if (existingNames.has(chopperName)) {
            alert(chopperName + " is already listed as a chopper for this victim.");
            continue;
        }

        const types = {
            "Black Pigs": parseInt(prompt("Black Pigs (0–2):", "0") || "0", 10),
            "Red Pigs": parseInt(prompt("Red Pigs (0–2):", "0") || "0", 10),
            "3 Consecutive Pairs": parseInt(prompt("3 Consecutive Pairs (0–3):", "0") || "0", 10),
            "4 of a Kind": parseInt(prompt("4 of a Kind (0–3):", "0") || "0", 10),
            "4 Consecutive Pairs": parseInt(prompt("4 Consecutive Pairs (0–3):", "0") || "0", 10)
        };

        if (Object.values(types).every(v => !v || v <= 0)) {
            alert("Each chopper must have at least one chop type.");
            continue;
        }

        newList.push({ chopper: chopperName, types });
        existingNames.add(chopperName);
    }

    row.chopData = newList;
    updateScoresPreview();
}