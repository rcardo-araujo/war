import Player from '../gameObjects/Player';
import Territory from '../gameObjects/Territory';


export default class GameStateManager extends Phaser.Events.EventEmitter {
    constructor(scene) {
        super();
        this.scene = scene;
        this.territories = {};
        this.continents = {};
        this.players = []
        this.initializeMap();
        this.initializePlayers();
        console.log(this.players)
        this.distributeTerritories();
    
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

    distributeTerritories(){
        const territoriesIds = Object.values(this.territories).map(terrt => terrt.id);
        
        for (let i = territoriesIds.length - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [territoriesIds[i], territoriesIds[j]] = [territoriesIds[j], territoriesIds[i]];
        }

        
        territoriesIds.forEach(
            (id, index) => {
                const playerIndex = index % this.players.length;
                const player = this.players[playerIndex];
                const territory = this.territories[id];
                player.addTerritory(territory);
                territory.setOwner(player);
            }
        )
    }
    
    initializePlayers(playerParams = []){
        // TODO: Implementation
        // Create players and add to this.players
        return null;
    }




        

        
}
