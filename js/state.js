const AppState = {
    players: [],
    roundRows: [],

    addPlayer(name) {
        const id = Date.now() + Math.random();
        this.players.push({ id, name, score: 0 });
    },

    generateRoundRows() {
        this.roundRows = this.players.map(player => ({
            playerId: player.id,
            placement: "",
            stinky13: false,
            stinky2Type: "",
            stinky2Count: 0
        }));
    },

    updateRoundRow(playerId, field, value) {
        const row = this.roundRows.find(r => r.playerId === playerId);
        if (row) row[field] = value;
    }
};