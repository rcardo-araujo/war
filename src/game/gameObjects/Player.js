export default class Player {
    constructor(name, type, color, colorKey = null) {
        this.name = name;
        this.type = type;
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

    getName() {
        return this.name;
    }

    getColor() {
        return this.color;
    }
    
    getType() {
        return this.type;
    }

    getOwnedTerritories() {
        return this.ownedTerritories;
    }

    setObjective(objective) {
        this.objective = objective;
    }

    getObjective() {
        return this.objective;
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
    
    setContinentBonus() {
        let sa = 0;
        let na = 0;
        let eu = 0;
        let af = 0;
        let as = 0;
        let oc = 0;

        for (let x of this.ownedTerritories) {
            switch(x.getContinent()) {
                case "south_america":
                    sa += 1;
                    break;
                case "north_america":
                    na += 1;
                    break;
                case "europe":
                    eu += 1;
                    break;
                case "africa":
                    af += 1;
                    break;
                case "asia":
                    as += 1;
                    break;
                case "oceania":
                    oc += 1;
                    break;
            }
        }
        if (sa == 4){
            this.availableTroopsSouthAmerica = 2;
        }
        if (na == 9){
            this.availableTroopsNorthAmerica = 5;
        }
        if (eu == 7){
            this.availableTroopsEurope = 5;
        }
        if (af == 6){
            this.availableTroopsAfrica = 3;
        }
        if (as == 12){
            this.availableTroopsAsia = 7;
        }
        if (oc == 4){
            this.availableTroopsOceania = 2;
        }
    }

    getContinentBonus(territory){
        switch(territory.getContinent()) {
            case "south_america":
                return this.availableTroopsSouthAmerica;
            case "north_america":
                return this.availableTroopsNorthAmerica;
            case "europe":
                return this. availableTroopsEurope;
            case "africa":
                return this.availableTroopsAfrica;
            case "asia":
                return this.availableTroopsAsia;
            case "oceania":
                return this.availableTroopsOceania;
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
