// =========================
// logic.js
// =========================

const ScoringConfig = {
    placements: {
        1: 4,
        2: 2,
        3: -2,
        4: -4
    },

    stinky13Penalty: -5,

    stinky2Types: {
        blackPigs: -1,
        redPigs: -2,
        threeConsecutivePairs: -2,
        fourOfAKind: -4,
        fourConsecutivePairs: -5
    }
};

function applyScoring() {
    const rows = AppState.roundRows;

    const p1 = rows.find(r => r.placement === "1");
    const p2 = rows.find(r => r.placement === "2");
    const p3 = rows.find(r => r.placement === "3");
    const p4 = rows.find(r => r.placement === "4");

    const stinky13Players = rows.filter(r => r.stinky13 === true);
    const count13 = stinky13Players.length;

    const deltas = {};
    rows.forEach(r => deltas[r.playerId] = 0);

    // Apply placement points
    rows.forEach(row => {
        if (row.placement) {
            deltas[row.playerId] += ScoringConfig.placements[row.placement];
        }
    });

    // CASE 1 — NO STINKY 13
    if (count13 === 0) {
        if (p4 && p4.stinky2Type && p4.stinky2Count > 0) {
            const penalty = ScoringConfig.stinky2Types[p4.stinky2Type] * p4.stinky2Count;
            deltas[p4.playerId] += penalty;
            if (p3) deltas[p3.playerId] -= penalty;
        }
    }

    // CASE 2 — EXACTLY 1 STINKY 13
    if (count13 === 1) {
        const s13 = stinky13Players[0];

        // Base -5
        deltas[s13.playerId] += ScoringConfig.stinky13Penalty;
        deltas[p1.playerId] -= ScoringConfig.stinky13Penalty;

        // Stinky 13 player's Stinky 2 (optional)
        if (s13.stinky2Type && s13.stinky2Count > 0) {
            const penalty = ScoringConfig.stinky2Types[s13.stinky2Type] * s13.stinky2Count;
            deltas[s13.playerId] += penalty;
            deltas[p1.playerId] -= penalty;
        }

        // 3rd place Stinky 2 (optional)
        if (p3 && p3.stinky2Type && p3.stinky2Count > 0) {
            const penalty = ScoringConfig.stinky2Types[p3.stinky2Type] * p3.stinky2Count;
            deltas[p3.playerId] += penalty;
            deltas[p2.playerId] -= penalty;
        }
    }

    // CASE 3 — EXACTLY 2 STINKY 13
    if (count13 === 2) {
        stinky13Players.forEach(s13 => {
            deltas[s13.playerId] += ScoringConfig.stinky13Penalty;
            deltas[p1.playerId] -= ScoringConfig.stinky13Penalty;

            if (s13.stinky2Type && s13.stinky2Count > 0) {
                const penalty = ScoringConfig.stinky2Types[s13.stinky2Type] * s13.stinky2Count;
                deltas[s13.playerId] += penalty;
                deltas[p1.playerId] -= penalty;
            }
        });

        // 3rd place Stinky 2 (optional)
        if (p3 && p3.stinky2Type && p3.stinky2Count > 0) {
            const penalty = ScoringConfig.stinky2Types[p3.stinky2Type] * p3.stinky2Count;
            deltas[p3.playerId] += penalty;
            deltas[p2.playerId] -= penalty;
        }
    }

    // CASE 4 — EXACTLY 3 STINKY 13
    if (count13 === 3) {
        stinky13Players.forEach(s13 => {
            deltas[s13.playerId] += ScoringConfig.stinky13Penalty;
            deltas[p1.playerId] -= ScoringConfig.stinky13Penalty;

            if (s13.stinky2Type && s13.stinky2Count > 0) {
                const penalty = ScoringConfig.stinky2Types[s13.stinky2Type] * s13.stinky2Count;
                deltas[s13.playerId] += penalty;
                deltas[p1.playerId] -= penalty;
            }
        });
    }

    // Apply deltas
    AppState.players.forEach(player => {
        player.score += deltas[player.id];
    });
}