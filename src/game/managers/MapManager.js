import Territory from '../gameObjects/Territory';

export default class MapManager {
    constructor(mapData) {
        this.territories = {};
        this.continents = {};
        this.initializeMap(mapData);
    }

    initializeMap(mapData) {
        this.continents = mapData.continents;

        mapData.territories.forEach(data => {
            this.territories[data.id] = new Territory(data.id, data.name, data.continent);
        });

        mapData.territories.forEach(data => {
            const territory = this.territories[data.id];
            data.neighbors.forEach(neighborId => {
                const neighbor = this.territories[neighborId];
                if (neighbor) {
                    territory.addNeighbor(neighbor);
                }
            });
        });
    }

    distributeTerritories(players) {
        if (!players || players.length === 0) return;

        const territoriesIds = Object.values(this.territories).map(terrt => terrt.id);

        for (let i = territoriesIds.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [territoriesIds[i], territoriesIds[j]] = [territoriesIds[j], territoriesIds[i]];
        }

        territoriesIds.forEach((id, index) => {
            const playerIndex = index % players.length;
            const player = players[playerIndex];
            const territory = this.territories[id];
            player.addTerritory(territory);
            territory.setOwner(player);
            territory.addTroops(1);
        });
    }

    changePlayerTerritoryOwnership(territoryId, newOwner) {
        const territory = this.getTerritory(territoryId);
        const oldOwner = territory.owner;

        oldOwner.removeTerritory(territory);
        newOwner.addTerritory(territory);
        if (territory) {
            territory.setOwner(newOwner);
        }
    }

    attackResolution(attackerTroops, defenderTroops, attackerTerritory, defenseTerritory) {

        attackerTerritory.removeTroops(attackerTroops);
        defenseTerritory.removeTroops(defenderTroops);
        
        if (defenderTroops <= 0) {
            changePlayerTerritoryOwnership(defenseTerritory.id, attackerTerritory.owner);
            //Logica de UI
        }
    }

    getTerritory(id) {
        return this.territories[id];
    }
}