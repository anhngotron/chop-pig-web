// =========================
// state.js
// =========================

const AppState = {
    // name → { score, games, wins }
    players: {},

    // list of names (for dropdowns)
    playerList: [],

    // 4 fixed rows, like Python
    roundRows: [],

    initRoundRows() {
        this.roundRows = [];
        for (let i = 0; i < 4; i++) {
            this.roundRows.push({
                playerName: "",
                placement: "",
                stinky2Enabled: false,
                stinky2: {
                    red: 0,
                    black: 0,
                    pairs3: 0,
                    kind4: 0,
                    pairs4: 0
                },
                // [{ chopper, types: { "Black Pigs": n, ... } }]
                chopData: []
            });
        }
    },

    addPlayer(name) {
        if (!name || this.players[name]) return;
        this.players[name] = { score: 0, games: 0, wins: 0 };
        this.playerList.push(name);
        this.playerList.sort();
    }
};

AppState.initRoundRows();