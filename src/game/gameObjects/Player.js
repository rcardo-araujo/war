export default class Player {
    constructor(name, color, colorKey = null) {
        this.name = name;
        this.color = color;
        this.colorKey = colorKey;
        this.ownedTerritories = new Set();
        this.territoryCards = [];
        this.objective = null;
        this.availableTroops = 0;
    }

    getColor() {
        return this.color;
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

    setAvailableTroops() {
        this.availableTroops = this.calculateReinforcements();
    }
    
    calculateContinentBonus() {
        return 0;
    }
}
