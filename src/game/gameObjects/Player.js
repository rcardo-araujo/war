export default class Player {
    constructor(name, color, colorKey = null, type = 'human') {
        this.name = name;
        this.color = color;
        this.colorKey = colorKey;
        this.ownedTerritories = new Set();
        this.territoryCards = [];
        this.objective = null;
        this.availableTroops = 0;
        this.continentTroopsSouthAmerica = 0;
        this.continentTroopsNorthAmerica = 0;
        this.continentTroopsEurope = 0;
        this.continentTroopsAsia = 0;
        this.continentTroopsAfrica = 0;
        this.continentTroopsOceania = 0;
        this.type = type
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
            this.continentTroopsSouthAmerica = 2;
        }
        if (na == 9){
            this.continentTroopsNorthAmerica = 5;
        }
        if (eu == 7){
            this.continentTroopsEurope = 5;
        }
        if (af == 6){
            this.continentTroopsAfrica = 3;
        }
        if (as == 12){
            this.continentTroopsAsia = 7;
        }
        if (oc == 4){
            this.continentTroopsOceania = 2;
        }
    }

    getContinentBonus(territory){
        switch(territory.getContinent()) {
            case "south_america":
                return this.continentTroopsSouthAmerica;
            case "north_america":
                return this.continentTroopsNorthAmerica;
            case "europe":
                return this. continentTroopsEurope;
            case "africa":
                return this.continentTroopsAfrica;
            case "asia":
                return this.continentTroopsAsia;
            case "oceania":
                return this.continentTroopsOceania;
        }
    }

    allocateTroops(territory, troops){
        switch(territory.getContinent()) {
            case "south_america":
                if (this.continentTroopsSouthAmerica <= troops){
                    this.availableTroops -= (troops - this.continentTroopsSouthAmerica);
                    this.continentTroopsSouthAmerica = 0;
                } else {
                    this.continentTroopsSouthAmerica -= troops;
                }
                break;
            case "north_america":
                if (this.continentTroopsNorthAmerica <= troops){
                    this.availableTroops -= (troops - this.continentTroopsNorthAmerica);
                    this.continentTroopsNorthAmerica = 0;
                } else {
                    this.continentTroopsNorthAmerica -= troops;
                }
                break;
            case "europe":
                if (this.continentTroopsEurope <= troops){
                    this.availableTroops -= (troops - this.continentTroopsEurope);
                    this.continentTroopsEurope = 0;
                } else {
                    this.continentTroopsEurope -= troops;
                }
                break;
            case "africa":
                if (this.continentTroopsAfrica <= troops){
                    this.availableTroops -= (troops - this.continentTroopsAfrica);
                    this.continentTroopsAfrica = 0;
                } else {
                    this.continentTroopsAfrica -= troops;
                }
                break;
            case "asia":
                if (this.continentTroopsAsia <= troops){
                    this.availableTroops -= (troops - this.continentTroopsAsia);
                    this.continentTroopsAsia = 0;
                } else {
                    this.continentTroopsAsia -= troops;
                }
                break;
            case "oceania":
                if (this.continentTroopsOceania <= troops){
                    this.availableTroops -= (troops - this.continentTroopsOceania);
                    this.continentTroopsOceania = 0;
                } else {
                    this.continentTroopsOceania -= troops;
                }
                break;
        }
    }

    getTotalAvailableTroops(){
        return this.availableTroops + 
        this.continentTroopsSouthAmerica +
        this.continentTroopsNorthAmerica +
        this.continentTroopsEurope +
        this.continentTroopsAsia +
        this.continentTroopsAfrica +
        this.continentTroopsOceania;
    }

}
