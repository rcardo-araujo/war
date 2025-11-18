import { EventEmitter } from 'phaser';
import MapManager from './MapManager';
import PlayerManager from './PlayerManager';
import TurnManager from './TurnManager';
import MovementController from './MovementController';
import GameController from './GameController';

export default class GameStateManager extends Phaser.Events.EventEmitter {
    constructor(scene, playerSetup = []) {
        super();
        this.mapManager = new MapManager(scene.cache.json.get('mapData'));
        this.territoryCardManager = new TerritoryCardManager(scene.cache.json.get('mapData'));
        this.playerManager = new PlayerManager(
            playerSetup,
            scene.cache.json.get('objectivesData')
        );
        this.turnManager = new TurnManager(this.playerManager.getPlayers());
        this.movementController = new MovementController(this);
        this.mapManager.distributeTerritories(this.playerManager.getPlayers());
        this.gameController = new GameController(this);
    }
    
    getCurrentPlayer() {
        return this.turnManager.getCurrentPlayer();
    }

    getCurrentPhase() {
        return this.turnManager.getCurrentPhase();
    }

    getTerritory(territoryId) {
        return this.mapManager.getTerritory(territoryId);
    }
}