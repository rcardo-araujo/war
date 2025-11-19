import TerritoryCard from "../gameObjects/TerritoryCard";

export default class TerritoryCardManager {
    constructor (mapData) {
        this.territoryCards = {};
        this.initializeTerritoryCards(mapData);
        
        this.usedTerritoryCards = new Set();
        this.currentTrade = 1;
    }

    initializeTerritoryCards (mapData) {
        mapData.territories.forEach(data => {
            this.territoryCards[data.id] = new TerritoryCard(data.id, data.name, data.type);
            this.shuffleDeck();
        });
    }

    changePlayerTerritoryCardOwnership(territoryCardId, newOwner) {
        const territoryCard = this.getTerritoryCard(territoryCardId);
        territoryCard.setOwner(newOwner);
        this.usedTerritoryCards.add(territoryCardId);
        newOwner.territoryCards.push(territoryCardId);
    }

    checkTradeEligibility(player) {
        const playerOwnedCards = Object.values(this.territoryCards).filter(card => card.owner === player);
        if (playerOwnedCards.length > 2) {
            if (playerOwnedCards.length > 2 && playerOwnedCards.length < 5) {
                circle_count = 0;
                square_count = 0;
                triangle_count = 0;

                for (let card of playerOwnedCards) {
                    if (card.type === 'circle') {
                        circle_count += 1;
                    } else if (card.type === 'square') {
                        square_count += 1;
                    } else if (card.type === 'triangle') {
                        triangle_count += 1;
                    }
                }

                if (circle_count === 3 || square_count === 3 || triangle_count === 3 || 
                    (circle_count >= 1 && square_count >= 1 && triangle_count >= 1)) {
                    return true;
                }
                return false;
            }
        }
        else {
            return true;
        }
    }   
    

    calculateTradeBonus(player, tradedCardIds) {
        const baseBonus = 4;

        baseBonus += this.calculeBonusForTerritoriesOwnedByPlayer(player, tradedCardIds);
        
        switch (this.currentTrade) {
            case 1:
                this.currentTrade += 1;
                return baseBonus;
            case 2:
                this.currentTrade += 1;
                return baseBonus + 2;
            case 3: 
                this.currentTrade += 1;
                return baseBonus + 4;
            case 4:
                this.currentTrade += 1;
                return baseBonus + 6;
            case 5:
                this.currentTrade += 1;
                return baseBonus + 8;
            case 6:
                this.currentTrade += 1;
                return baseBonus + 11;
            default:
                return baseBonus + 11 + (this.currentTrade - 6) * 5;
        }
    }

    calculeBonusForTerritoriesOwnedByPlayer(player, tradedCardIds) {
        const bonusTroops = 0;

        tradedCardIds.forEach(cardId => {
            const card = this.getTerritoryCard(cardId);

            if (card.owner === player) {

                const territory = card.id;
                if (player.ownedTerritories.has(territory)) {
                    bonusTroops += 2;
                }

            }
        });
        return bonusTroops;
    }

    shuffleDeck() {
        for (let i = this.territoryCards.length -1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i+1));
          let k = this.territoryCards[i];
          this.territoryCards[i] = this.territoryCards[j];
          this.territoryCards[j] = k;
        }
    }

    drawCard(player){
        let card = this.territoryCards[this.territoryCards.length - 1];
        this.changePlayerTerritoryCardOwnership(card.id, player);
    }
}