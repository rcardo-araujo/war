export default class Player {
    constructor(name, color) {
        this.name = name;
        this.color = color;
        this.ownedTerritories = new Set();
        this.cards = [];
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
        const territoryBonus = Math.floor(this.ownedTerritories.size() / 2);
        const continentBonus = this.calculateContinentBonus();

        return Math.max(3, territoryBonus) + continentBonus;
    }

    calculateContinentBonus() {
        return 0;
    }
}
