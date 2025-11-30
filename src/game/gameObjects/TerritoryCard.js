export default class TerritoryCard {
    constructor (id, name, type){
        this.id = id;
        this.name = name;
        this.type = type;

        this.owner = null;
    }

    setOwner (player) {
        this.owner = player
    }
}