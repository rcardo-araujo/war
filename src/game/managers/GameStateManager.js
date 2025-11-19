import { EventEmitter } from 'phaser';
import MapManager from './MapManager';
import PlayerManager from './PlayerManager';
import TurnManager from './TurnManager';
import MovementController from './MovementController';
import GameController from './GameController';
import { BotService } from '../gameObjects/BotService';

export default class GameStateManager extends Phaser.Events.EventEmitter {
    constructor(scene, playerSetup = []) {
        super();
        this.mapManager = new MapManager(scene.cache.json.get('mapData'));
        this.playerManager = new PlayerManager(
            playerSetup,
            scene.cache.json.get('objectivesData')
        );
        this.turnManager = new TurnManager(this.playerManager.getPlayers());
        this.movementController = new MovementController(this);
        this.mapManager.distributeTerritories(this.playerManager.getPlayers());
        this.gameController = new GameController(this);
        this.botService = new BotService();
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

    getStateForLLM(){
        const player = this.getCurrentPlayer();
        const territories = [...player.getOwnedTerritories()];
        
        const formattedList = territories.map(territory => {
            return {
                territory: territory.id,
                troops: territory.getTroopCount(),
                neighbors: territory.getNeighborIds().map(neighborId => {
                    const neighborObj = this.getTerritory(neighborId); 
                    return {
                        id: neighborId,
                        troops: neighborObj.getTroopCount(),
                        owner: neighborObj.getOwnerColor ? neighborObj.getOwnerColor() : "unknown" 
                    };
                })
            };
        });

        const info = {
            "player": player.getName(),
            "phase": this.getCurrentPhase(),
            "objective": player.getObjective().getDescription(),
            "ownedTerritories": formattedList
        }

        return info;
    }

    handleBotTurn(){
        const state = this.getStateForLLM();
        console.log(state)
        response = this.botService.getBotMove(state);
        console.log(response);
    }
}