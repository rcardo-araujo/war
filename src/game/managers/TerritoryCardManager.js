import TerritoryCard from "../gameObjects/TerritoryCard";

export default class TerritoryCardManager {
    constructor (mapData) {
        this.territoryCards = {};
        this.initializeTerritoryCards(mapData);
    }

    initializeTerritoryCards (mapData) {
        mapData.territories.forEach(data => {
            this.territoryCards[data.id] = new TerritoryCard(data.id, data.name, data.type);
        });
    }

    changePlayerTerritoryCardOwnership(territoryCardId, newOwner) {
        const territoryCard = this.getTerritoryCard(territoryCardId);
        territoryCard.setOwner(newOwner);
    }

}
