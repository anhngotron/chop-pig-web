/* ----------------------------------------------------
   LOGIC.JS — Scoring, Placements, Round Calculation
-----------------------------------------------------*/

/**
 * CONFIG:
 * Adjust these if your scoring rules change.
 */
const ScoringConfig = {
    placements: {
        1: 3,   // 1st place
        2: 1,   // 2nd place
        3: -1,  // 3rd place
        4: -3   // 4th place
    },
    stinky2Bonus: -2,   // extra penalty for Stinky2
    chopBonus: 1        // bonus/adjustment for Chop
};

/* ----------------------------------------------------
   VALIDATION HELPERS
-----------------------------------------------------*/

/**
 * Ensures placements are valid:
 * - No duplicates
 * - Only valid placement numbers
 */
function validatePlacements(roundRows) {
    const usedPlacements = new Set();

    for (const row of roundRows) {
        if (!row.placement) continue;

        const placementNum = Number(row.placement);

        // Invalid placement number
        if (!ScoringConfig.placements.hasOwnProperty(placementNum)) {
            return { valid: false, error: `Invalid placement: ${row.placement}` };
        }

        // Duplicate placement
        if (usedPlacements.has(placementNum)) {
            return { valid: false, error: `Duplicate placement: ${placementNum}` };
        }

        usedPlacements.add(placementNum);
    }

    return { valid: true, error: null };
}

/* ----------------------------------------------------
   CORE SCORING ENGINE
-----------------------------------------------------*/

/**
 * Given the current roundRows (from AppState.roundRows),
 * compute score deltas and win flags for each player.
 *
 * roundRows: [
 *   {
 *     playerId: string,
 *     placement: "1" | "2" | "3" | "4" | "",
 *     stinky2: boolean,
 *     chop: boolean
 *   }
 * ]
 */
function calculateRoundResults(roundRows) {
    const validation = validatePlacements(roundRows);
    if (!validation.valid) {
        return {
            ok: false,
            error: validation.error,
            results: []
        };
    }

    const results = [];

    for (const row of roundRows) {
        // No placement = no score change
        if (!row.placement) {
            results.push({
                playerId: row.playerId,
                scoreDelta: 0,
                win: false
            });
            continue;
        }

        const placementNum = Number(row.placement);
        let scoreDelta = ScoringConfig.placements[placementNum] || 0;
        let win = placementNum === 1;

        // Apply Stinky2 penalty
        if (row.stinky2) {
            scoreDelta += ScoringConfig.stinky2Bonus;
        }

        // Apply Chop adjustment
        if (row.chop) {
            scoreDelta += ScoringConfig.chopBonus;
        }

        results.push({
            playerId: row.playerId,
            scoreDelta,
            win
        });
    }

    return {
        ok: true,
        error: null,
        results
    };
}