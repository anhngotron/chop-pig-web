/* ----------------------------------------------------
   STATE.JS — App State, LocalStorage, Import/Export
-----------------------------------------------------*/

const AppState = {
    players: [],
    roundRows: [],

    /* -----------------------------
       LOCAL STORAGE
    ------------------------------*/
    save() {
        localStorage.setItem("chopPigData", JSON.stringify({
            players: this.players
        }));
    },

    load() {
        const data = localStorage.getItem("chopPigData");
        if (!data) return;

        try {
            const parsed = JSON.parse(data);
            this.players = parsed.players || [];
        } catch (e) {
            console.error("Failed to load saved data:", e);
        }
    },

    /* -----------------------------
       PLAYER MANAGEMENT
    ------------------------------*/
    addPlayer(name) {
        this.players.push({
            id: crypto.randomUUID(),
            name,
            score: 0,
            games: 0,
            wins: 0
        });
        this.save();
    },

    removePlayer(id) {
        this.players = this.players.filter(p => p.id !== id);
        this.save();
    },

    /* -----------------------------
       ROUND ROWS
    ------------------------------*/
    generateRoundRows() {
        this.roundRows = this.players.map(player => ({
            playerId: player.id,
            placement: "",
            stinky2: false,
            chop: false
        }));
    },

    updateRoundRow(playerId, field, value) {
        const row = this.roundRows.find(r => r.playerId === playerId);
        if (row) row[field] = value;
    },

    /* -----------------------------
       APPLY ROUND RESULTS
    ------------------------------*/
    applyRoundResults(results) {
        results.forEach(res => {
            const player = this.players.find(p => p.id === res.playerId);
            if (!player) return;

            player.score += res.scoreDelta;
            player.games++;

            if (res.win) {
                player.wins++;
            }
        });

        this.save();
    },

    /* -----------------------------
       IMPORT / EXPORT JSON
    ------------------------------*/
    exportJSON() {
        return JSON.stringify({
            players: this.players
        }, null, 2);
    },

    importJSON(jsonText) {
        try {
            const data = JSON.parse(jsonText);
            if (Array.isArray(data.players)) {
                this.players = data.players;
                this.save();
                return true;
            }
        } catch (e) {
            console.error("Import failed:", e);
        }
        return false;
    }
};

/* ----------------------------------------------------
   INITIALIZE APP STATE
-----------------------------------------------------*/
AppState.load();