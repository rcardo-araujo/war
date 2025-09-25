export default class Territory {
    constructor(id, name, continent) {
        this.id = id;
        this.name = name;
        this.continent = continent;
        this.neighbors = new Set();

        this.owner = null;
        this.troops = 0;
    }

    setOwner(player) {
        this.owner = player;
    }

    addTroops(amount) {
        this.troops += amount;
    }

    removeTroops(amount) {
        this.troops = Math.max(0, this.troops - amount);
    }

    addNeighbor(territory) {
        this.neighbors.add(territory.id);
    }

    isNeighbor(territory) {
        return this.neighbors.includes(territory.id);
    }
}