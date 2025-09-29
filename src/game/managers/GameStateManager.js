import Territory from '../gameObjects/Territory';
import { TurnManager } from './TurnManager';


export default class GameStateManager extends Phaser.Events.EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.players = this.scene.players;
        this.territories = {};
        this.continents = {};
        this.initializeMap();

        this.turnManager = new TurnManager(this.players);
    }

    initializeMap() {
        const mapData = this.scene.cache.json.get('mapData');
        this.continents = mapData.continents;

        mapData.territories.forEach(data => {
            this.territories[data.id] = new Territory(data.id, data.name, data.continent);
        });

        mapData.territories.forEach(data => {
            const territory = this.territories[data.id];
            data.neighbors.forEach(neighborId => {
                const neighbor = this.territories[neighborId];
                if (neighbor) {
                    territory.addNeighbor(neighbor);
                }
            });
        });
    }
}