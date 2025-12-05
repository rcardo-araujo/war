export default class MovementController {
    constructor(gameStateManager) {
        this.gameStateManager = gameStateManager;
        this.availableTroops = new Map();
    }

    moveTroops(origin, destination, troopsAllocated) {
        if (!this.availableTroops.has(origin)) {
            this.availableTroops.set(origin, origin.troops - 1);
        }

        if (!this.availableTroops.has(destination)) {
            this.availableTroops.set(destination, destination.troops - 1);
        }

        if (origin.troops - troopsAllocated > 0) {
            origin.removeTroops(troopsAllocated);
            this.availableTroops.set(origin, this.availableTroops.get(origin) - troopsAllocated);
            destination.addTroops(troopsAllocated);
        }
    }

    getAvailableTroops(territory){
        if (!this.availableTroops.has(territory)) {
            this.availableTroops.set(territory, territory.troops - 1);
        }
        return this.availableTroops.get(territory);
    }

    reset(){
        this.availableTroops.clear();
    }

}