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

        return Math.max(3, territoryBonus);
    }

    setAvailableTroops() {
        this.availableTroops = this.calculateReinforcements();
        this.setContinentBonus();
    }
    
    calculateContinentBonus(value, index, array){
        let sa = 0;
        let na = 0;
        let eu = 0;
        let af = 0;
        let as = 0;
        let oc = 0;

        switch(value.getContinent()) {
            case "south_america":
                sa += 1
                break;
            case "north_america":
                na += 1
                break;
            case "europe":
                eu += 1
                break;
            case "africa":
                af += 1
                break;
            case "asia":
                as += 1
                break;
            case "oceania":
                oc += 1
                break;
        }
        if (sa == 4){
            this.availableTroopsSouthAmerica = 2
        }
        if (na == 9){
            this.availableTroopsSouthAmerica = 5
        }
        if (eu == 7){
            this.availableTroopsSouthAmerica = 5
        }
        if (af == 6){
            this.availableTroopsSouthAmerica = 3
        }
        if (as == 12){
            this.availableTroopsSouthAmerica = 7
        }
        if (oc == 4){
            this.availableTroopsSouthAmerica = 2
        }
    }

    setContinentBonus() {
        this.ownedTerritories.forEach(this.calculateContinentBonus)
    }

    getContinentBonus(territory){
        switch(territory.getContinent()) {
            case "south_america":
                return this.availableTroopsSouthAmerica
                break;
            case "north_america":
                return this.availableTroopsNorthAmerica
                break;
            case "europe":
                return this. availableTroopsEurope
                break;
            case "africa":
                return this.availableTroopsAfrica
                break;
            case "asia":
                return this.availableTroopsAsia
                break;
            case "oceania":
                return this.availableTroopsOceania
                break;
        }
    }

    allocateTroops(territory, troops){
        switch(territory.getContinent()) {
            case "south_america":
                if (this.availableTroopsSouthAmerica <= troops){
                    this.availableTroops -= (troops - this.availableTroopsSouthAmerica);
                    this.availableTroopsSouthAmerica = 0;
                } else {
                    this.availableTroopsSouthAmerica -= troops;
                }
                break;
            case "north_america":
                if (this.availableTroopsNorthAmerica <= troops){
                    this.availableTroops -= (troops - this.availableTroopsNorthAmerica);
                    this.availableTroopsNorthAmerica = 0;
                } else {
                    this.availableTroopsNorthAmerica -= troops;
                }
                break;
            case "europe":
                if (this.availableTroopsEurope <= troops){
                    this.availableTroops -= (troops - this.availableTroopsEurope);
                    this.availableTroopsEurope = 0;
                } else {
                    this.availableTroopsEurope -= troops;
                }
                break;
            case "africa":
                if (this.availableTroopsAfrica <= troops){
                    this.availableTroops -= (troops - this.availableTroopsAfrica);
                    this.availableTroopsAfrica = 0;
                } else {
                    this.availableTroopsAfrica -= troops;
                }
                break;
            case "asia":
                if (this.availableTroopsAsia <= troops){
                    this.availableTroops -= (troops - this.availableTroopsAsia);
                    this.availableTroopsAsia = 0;
                } else {
                    this.availableTroopsAsia -= troops;
                }
                break;
            case "oceania":
                if (this.availableTroopsOceania <= troops){
                    this.availableTroops -= (troops - this.availableTroopsOceania);
                    this.availableTroopsOceania = 0;
                } else {
                    this.availableTroopsOceania -= troops;
                }
                break;
        }
    }

}
