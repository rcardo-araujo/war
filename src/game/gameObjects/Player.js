export default class Player {
    constructor(name, color, colorKey = null) {
        this.name = name;
        this.color = color;
        this.colorKey = colorKey;
        this.ownedTerritories = new Set();
        this.cards = [];
        this.objective = null;
        this.availableTroops = 0;
        this.availableTroopsSouthAmerica = 0;
        this.availableTroopsNorthAmerica = 0;
        this.availableTroopsEurope = 0;
        this.availableTroopsAsia = 0;
        this.availableTroopsAfrica = 0;
        this.availableTroopsOceania = 0;
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
    
    calculateContinentBonus(value, index, array){
        let SA = 0;
        let NA = 0;
        let EU = 0;
        let AF = 0;
        let AS = 0;
        let OC = 0

        switch(value.continent) {
            case "south_america":
                SA += 1
                break;
            case "north_america":
                NA += 1
                break;
            case "europe":
                EU += 1
                break;
            case "africa":
                AF += 1
                break;
            case "asia":
                AS += 1
                break;
            case "oceania":
                OC += 1
                break;
        }
        if (SA == 4){
            this.availableTroopsSouthAmerica = 2
        }
        if (NA == 9){
            this.availableTroopsSouthAmerica = 5
        }
        if (EU == 7){
            this.availableTroopsSouthAmerica = 5
        }
        if (AF == 6){
            this.availableTroopsSouthAmerica = 3
        }
        if (AS == 12){
            this.availableTroopsSouthAmerica = 7
        }
        if (OC == 4){
            this.availableTroopsSouthAmerica = 2
        }
    }

    setContinentBonus() {
        this.ownedTerritories.forEach(this.calculateContinentBonus)
    }
}
