export default class Objective {
    constructor({main, fallback, type, description, target = null}){
        this.type = type;
        this.target = target;
        this.main = main;
        this.default = fallback;
        this.description = description
    }

    constructDescription(){
        this.description;
    }

    getDescription(){
        return this.description;
    }

}