import Phaser from 'phaser';
import TerritoryCard from "../gameObjects/TerritoryCard";

export default class TerritoryCardManager {
    constructor(mapData) {
        this.territoryCards = {};
        this.drawPile = [];
        this.initializeTerritoryCards(mapData);
        this.usedTerritoryCards = new Set();
        this.currentTrade = 1;
    }

    initializeTerritoryCards(mapData) {
        mapData.territories.forEach((data) => {
            let territory = new TerritoryCard(data.id, data.name, data.type);
            this.territoryCards[data.id] = territory;
            this.drawPile.push(territory);
            this.shuffleDeck();
        });
    }

    addUsedTerritoryCards(cardIds) {
        cardIds.forEach((cardId) => {
            this.usedTerritoryCards.add(cardId);
        });
    }

    changePlayerTerritoryCardOwnership(territoryCardId, newOwner) {
        const territoryCard = this.getTerritoryCard(territoryCardId);
        territoryCard.setOwner(newOwner);
        newOwner.territoryCards.push(territoryCardId);
    }

    selectTerritoryCardsForTradeAutomatically(player) {
        console.log(
            `Selecting territory cards for trade for player ${player.name}`
        );
        let playerOwnedCards = [];

        for (let cardId of player.territoryCards) {
            let card = this.getTerritoryCard(cardId);
            playerOwnedCards.push(card);
        }

        let selectedCards = [];
        let selectedCardsIds = [];

        // Prioriza trios do mesmo tipo
        const typeCounts = {};

        for (let card of playerOwnedCards) {
            if (!typeCounts[card.type]) {
                typeCounts[card.type] = [];
            }
            typeCounts[card.type].push(card);
        }

        for (let type in typeCounts) {
            if (typeCounts[type].length >= 3) {
                selectedCards = typeCounts[type].slice(0, 3);
                for (let card of selectedCards) {
                    selectedCardsIds.push(card.id);
                }
                return selectedCardsIds;
            }
        }

        // Se não houver trios, tenta um de cada tipo
        const types = ["circle", "square", "triangle"];
        const oneOfEach = [];
        for (let type of types) {
            const card = playerOwnedCards.find((card) => card.type === type);
            if (card) {
                oneOfEach.push(card);
            }
        }

        if (oneOfEach.length === 3) {
            selectedCards = oneOfEach;
        }

        for (let card of selectedCards) {
            selectedCardsIds.push(card.id);
        }

        return selectedCardsIds;
    }

    isPlayerObligatedToTrade(player) {
        if (player.territoryCards.length >= 5) {
            return true;
        }
        return false;
    }

    checkTradeEligibility(player) {
        const playerOwnedCards = player.territoryCards.map((cardId) =>
            this.getTerritoryCard(cardId)
        );

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
            if (card.type === "circle") {
                circle_count += 1;
            } else if (card.type === "square") {
                square_count += 1;
            } else if (card.type === "triangle") {
                triangle_count += 1;
            }
        }

        // Retorna true se tiver trio do mesmo tipo OU um de cada tipo
        if (
            circle_count >= 3 ||
            square_count >= 3 ||
            triangle_count >= 3 ||
            (circle_count >= 1 && square_count >= 1 && triangle_count >= 1)
        ) {
            return true;
        }
        return false;
    }

    calculateTradeBonus(player, tradedCardIds) {
        let baseBonus = 4;

        baseBonus += this.calculeBonusForTerritoriesOwnedByPlayer(
            player,
            tradedCardIds
        );

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

        console.log(JSON.stringify(tradedCardIds));

        for (let cardId of tradedCardIds) {
            let card = this.getTerritoryCard(cardId);
            for (let territory of player.ownedTerritories) {
                if (territory.id === card.id) {
                    bonusTroops += 2;
                    break;
                }
            }
        }
        return bonusTroops;
    }

    shuffleDeck() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            let k = this.drawPile[i];
            this.drawPile[i] = this.drawPile[j];
            this.drawPile[j] = k;
        }
    }

    drawCard(player) {
        if (this.drawPile.length === 0) {
            this.usedTerritoryCards.forEach(function (element) {
                this.drawPile.push(element);
                this.usedTerritoryCards.delete(element);
            });
            this.shuffleDeck();
        }
        let card = this.drawPile[this.drawPile.length - 1];
        this.drawPile.pop();
        this.changePlayerTerritoryCardOwnership(card.id, player);
    }

    getTerritoryCard(territoryCardId) {
        return this.territoryCards[territoryCardId];
    }

    clearOwnershipAfterTrade(player, tradedCardIds) {
        tradedCardIds.forEach((cardId) => {
            const card = this.getTerritoryCard(cardId);
            card.setOwner(null);
            const index = player.territoryCards.indexOf(cardId);
            if (index > -1) {
                player.territoryCards.splice(index, 1);
            }
        });
    }
}
