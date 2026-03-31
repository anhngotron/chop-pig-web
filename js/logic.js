// =========================
// logic.js — 1:1 scoring
// =========================

const BaseScores = {
    "1st": 4,
    "2nd": 2,
    "3rd": -2,
    "4th": -4,
    "Stinky 13": -5
};

function stinky2Total(st2) {
    return (
        st2.red * -2 +
        st2.black * -1 +
        st2.pairs3 * -2 +
        st2.kind4 * -4 +
        st2.pairs4 * -5
    );
}

function chopPoints(chopType) {
    if (chopType === "Black Pigs") return 1;
    if (chopType === "Red Pigs") return 2;
    if (chopType === "3 Consecutive Pairs") return 2;
    if (chopType === "4 of a Kind") return 4;
    if (chopType === "4 Consecutive Pairs") return 5;
    return 0;
}

function findPlayerByPlace(rows, place) {
    for (let i = 0; i < rows.length; i++) {
        if (rows[i].placement === place) return i;
    }
    return null;
}

function isStinky2AllowedForRow(rows, idx) {
    const placement = rows[idx].placement;
    const placementsNow = rows.map(r => r.placement);
    const st13Count = placementsNow.filter(p => p === "Stinky 13").length;

    if (!placement) return false;

    if (st13Count === 0) {
        return placement === "4th";
    }
    if (st13Count === 1) {
        return ["Stinky 13", "3rd", "4th"].includes(placement);
    }
    return ["Stinky 13", "4th"].includes(placement);
}

function validStinky2Combo(r, b) {
    const total = r + b;
    if (total === 0) return false;
    if (total === 1) return (r === 1 && b === 0) || (r === 0 && b === 1);
    if (total === 2) {
        return (
            (r === 2 && b === 0) ||
            (r === 0 && b === 2) ||
            (r === 1 && b === 1)
        );
    }
    if (total === 3) {
        return (
            (r === 2 && b === 1) ||
            (r === 1 && b === 2)
        );
    }
    return false;
}

// Direct port of auto_fill_all_scores (no UI)
function computeRoundScores(rows) {
    const placements = rows.map(r => r.placement || "");
    const st13Count = placements.filter(p => p === "Stinky 13").length;

    const baseScoresRow = [0, 0, 0, 0];

    for (let i = 0; i < 4; i++) {
        const placement = placements[i];
        if (!placement) {
            baseScoresRow[i] = 0;
            continue;
        }

        let score;
        if (placement === "Stinky 13") {
            score = -5;
        } else if (placement === "1st") {
            score = st13Count > 0 ? 5 * st13Count : 4;
        } else if (placement === "2nd") {
            score = (st13Count === 2) ? 0 : 2;
        } else {
            score = BaseScores[placement];
        }
        baseScoresRow[i] = score;
    }

    const finalScores = baseScoresRow.slice();

    // Stinky 2 transfers
    for (let i = 0; i < 4; i++) {
        const row = rows[i];
        if (!row.stinky2Enabled) continue;

        if (!isStinky2AllowedForRow(rows, i)) {
            row.stinky2Enabled = false;
            row.stinky2 = { red: 0, black: 0, pairs3: 0, kind4: 0, pairs4: 0 };
            continue;
        }

        const total = stinky2Total(row.stinky2);
        finalScores[i] += total;

        const giverPlace = placements[i];
        let receiverIdx = null;

        if (giverPlace === "4th") {
            receiverIdx = findPlayerByPlace(rows, "3rd");
        } else if (giverPlace === "Stinky 13") {
            receiverIdx = findPlayerByPlace(rows, "1st");
        } else if (giverPlace === "3rd") {
            receiverIdx = findPlayerByPlace(rows, "2nd");
        }

        if (receiverIdx !== null && receiverIdx !== undefined) {
            finalScores[receiverIdx] -= total;
        }
    }

    // Chop Pigs transfers
    for (let i = 0; i < 4; i++) {
        const victimName = rows[i].playerName;
        if (!victimName) continue;

        const chops = rows[i].chopData || [];
        for (const entry of chops) {
            const chopper = entry.chopper;
            const types = entry.types || {};

            const chopperIdx = rows.findIndex(r => r.playerName === chopper);
            if (chopperIdx === -1) continue;

            let totalPoints = 0;
            for (const [t, amt] of Object.entries(types)) {
                if (!amt || amt <= 0) continue;
                const per = chopPoints(t);
                if (per <= 0) continue;
                totalPoints += per * amt;
            }

            if (totalPoints === 0) continue;

            finalScores[i] -= totalPoints;
            finalScores[chopperIdx] += totalPoints;
        }
    }

    return finalScores;
}

// Direct port of add_round_scores
function applyRoundToPlayers(playersMap, rows) {
    const scores = computeRoundScores(rows);
    const selectedPlayers = rows.map(r => r.playerName);
    const placements = rows.map(r => r.placement);

    if (selectedPlayers.some(p => !p) || placements.some(p => !p)) {
        throw new Error("All 4 players and placements must be selected.");
    }

    const unique = new Set(selectedPlayers);
    if (unique.size !== selectedPlayers.length) {
        throw new Error("Each player can only appear once per round.");
    }

    const maxScore = Math.max(...scores);
    const winners = selectedPlayers.filter((p, i) => scores[i] === maxScore);

    for (let i = 0; i < 4; i++) {
        const name = selectedPlayers[i];
        const scoreVal = scores[i];

        if (!playersMap[name]) {
            playersMap[name] = { score: 0, games: 0, wins: 0 };
        }

        playersMap[name].score += scoreVal;
        playersMap[name].games += 1;
        if (winners.includes(name)) {
            playersMap[name].wins += 1;
        }
    }

    return { scores, winners };
}

window.ChopLogic = {
    computeRoundScores,
    applyRoundToPlayers,
    isStinky2AllowedForRow,
    validStinky2Combo
};