import TerritoryCard from "../gameObjects/TerritoryCard";

export default class TerritoryCardManager {
    constructor (mapData) {
        this.territoryCards = {};
        this.drawPile = [];
        this.initializeTerritoryCards(mapData);
        this.usedTerritoryCards = new Set();
        this.currentTrade = 1;
    }

    initializeTerritoryCards (mapData) {
        mapData.territories.forEach(data => {
            let territory = new TerritoryCard(data.id, data.name, data.type);
            this.territoryCards[data.id] = territory;
            this.drawPile.push(territory);
            this.shuffleDeck();
        });
    }

    addUsedTerritoryCards(cardIds) {
        cardIds.forEach(cardId => {
            this.usedTerritoryCards.add(cardId);
        });
    }

    changePlayerTerritoryCardOwnership(territoryCardId, newOwner) {
        const territoryCard = this.getTerritoryCard(territoryCardId);
        territoryCard.setOwner(newOwner);
        newOwner.territoryCards.push(territoryCardId);
    }

    checkTradeEligibility(player) {
        const playerOwnedCards = Object.values(this.territoryCards).filter(card => card.owner === player);

        // Precisa de pelo menos 3 cartas para trocar
        if (playerOwnedCards.length < 3) {
            return false;
        }

        // Com 5 ou mais cartas, a troca é obrigatória
        if (playerOwnedCards.length >= 5) {
            return true;
        }

        // Com 3-4 cartas, verifica se tem combinação válida
        let circle_count = 0;
        let square_count = 0;
        let triangle_count = 0;

        for (let card of playerOwnedCards) {
            if (card.type === 'circle') {
                circle_count += 1;
            } else if (card.type === 'square') {
                square_count += 1;
            } else if (card.type === 'triangle') {
                triangle_count += 1;
            }
        }

        // Retorna true se tiver trio do mesmo tipo OU um de cada tipo
        if (circle_count >= 3 || square_count >= 3 || triangle_count >= 3 ||
            (circle_count >= 1 && square_count >= 1 && triangle_count >= 1)) {
            return true;
        }
        return false;
    }   
    

    calculateTradeBonus(player, tradedCardIds) {
        let baseBonus = 4;

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
        let bonusTroops = 0;

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
        for (let i = this.drawPile.length -1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i+1));
          let k = this.drawPile[i];
          this.drawPile[i] = this.drawPile[j];
          this.drawPile[j] = k;
        }
    }

    drawCard(player){
        if (this.drawPile.length === 0){
            this.usedTerritoryCards.forEach(function(element){
                this.drawPile.push(element);
                this.usedTerritoryCards.delete(element);
            })
            this.shuffleDeck();
        }
        let card = this.drawPile[this.drawPile.length - 1];
        this.changePlayerTerritoryCardOwnership(card.id, player);
    }

    getTerritoryCard(territoryCardId){
       return this.territoryCards[territoryCardId];
    }
    
    clearOwnershipAfterTrade(player, tradedCardIds) {
        tradedCardIds.forEach(cardId => {
            const card = this.getTerritoryCard(cardId);
            card.setOwner(null);
            const index = player.territoryCards.indexOf(cardId);
            if (index > -1) {
                player.territoryCards.splice(index, 1);
            }
        });
    }
}
