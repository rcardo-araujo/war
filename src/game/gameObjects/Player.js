export default class Player {
    constructor(name, color, colorKey = null) {
        this.name = name;
        this.color = color;
        this.colorKey = colorKey;
        this.ownedTerritories = new Set();
        this.cards = [];
        this.objective = null;
    }

    setObjective(objective) {
        this.objective = objective;
    }

    addTerritory(territory) {
        this.ownedTerritories.add(territory);
    }

    removeTerritory(territory) {
        this.ownedTerritories.delete(territory);
    }

    addCard(card) {
        this.cards.push(card);
    }

    calculateReinforcements() {
        const territoryBonus = Math.floor(this.ownedTerritories.size / 2);
        const continentBonus = this.calculateContinentBonus();

        return Math.max(3, territoryBonus) + continentBonus;
    }

    calculateContinentBonus() {
        return 0;
    }
}
