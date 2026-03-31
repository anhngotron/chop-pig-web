// =========================
// ui.js
// =========================

function renderRoundRows() {
    const container = document.getElementById("roundRows");
    container.innerHTML = "";

    AppState.roundRows.forEach(row => {
        const player = AppState.players.find(p => p.id === row.playerId);

        const div = document.createElement("div");
        div.className = "round-row";
        div.dataset.player = row.playerId;

        div.innerHTML = `
            <div class="player-name">${player.name}</div>

            <select data-field="placement">
                <option value="">--</option>
                <option value="1">1st</option>
                <option value="2">2nd</option>
                <option value="3">3rd</option>
                <option value="4">4th</option>
            </select>

            <label>
                <input type="checkbox" data-field="stinky13">
                Stinky 13
            </label>

            <div class="stinky2-controls">
                <select data-field="stinky2Type">
                    <option value="">-- Stinky 2 Type --</option>
                    <option value="blackPigs">Black Pigs</option>
                    <option value="redPigs">Red Pigs</option>
                    <option value="threeConsecutivePairs">3 Consecutive Pairs</option>
                    <option value="fourOfAKind">4 of a Kind</option>
                    <option value="fourConsecutivePairs">4 Consecutive Pairs</option>
                </select>

                <input type="number" min="1" data-field="stinky2Count" placeholder="Amount">
            </div>
        `;

        container.appendChild(div);

        div.querySelectorAll("[data-field]").forEach(el => {
            el.addEventListener("change", () => {
                const field = el.dataset.field;
                const value = el.type === "checkbox" ? el.checked : el.value;
                AppState.updateRoundRow(row.playerId, field, value);
                updateStinky2Visibility();
            });
        });
    });

    updateStinky2Visibility();
}

function updateStinky2Visibility() {
    const rows = AppState.roundRows;
    const count13 = rows.filter(r => r.stinky13).length;

    rows.forEach(row => {
        const card = document.querySelector(`.round-row[data-player="${row.playerId}"]`);
        const controls = card.querySelector(".stinky2-controls");
        const placement = row.placement;

        if (count13 === 0) {
            controls.style.display = (placement === "4") ? "block" : "none";
        }

        if (count13 === 1) {
            if (placement === "4") controls.style.display = "none";
            else if (row.stinky13) controls.style.display = "block";
            else if (placement === "3") controls.style.display = "block";
            else controls.style.display = "none";
        }

        if (count13 === 2) {
            if (placement === "4" || placement === "3") controls.style.display = "none";
            else if (row.stinky13) controls.style.display = "block";
            else controls.style.display = "none";
        }

        if (count13 === 3) {
            if (placement === "4" || placement === "3" || placement === "2") {
                controls.style.display = "none";
            } else if (row.stinky13) {
                controls.style.display = "block";
            } else {
                controls.style.display = "none";
            }
        }
    });
}