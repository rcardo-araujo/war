import { EventEmitter } from 'phaser';
import MapManager from './MapManager';
import PlayerManager from './PlayerManager';
import TurnManager from './TurnManager';
import MovementController from './MovementController';
import GameController from './GameController';
import { BotService } from '../gameObjects/BotService';
import { COLOR_NAMES } from '../config/colors';

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
                        owner: COLOR_NAMES[neighborObj.color] ? COLOR_NAMES[neighborObj.color] : "unknown" 
                    };
                })
            };
        });

        const info = {
            "player": COLOR_NAMES[player.color],
            "phase": this.getCurrentPhase(),
            "objective": player.getObjective().getDescription(),
            "troopsToPlace": player.getAvailableTroops(),
            "ownedTerritories": formattedList
        }

        return info;
    }

    handleBotTurn(){
        const state = this.getStateForLLM();
        console.log(state)
        const response = this.botService.getReinforcementMove(state);
        response.then((jogada) => {
            this.allocateBotTroops(jogada.alocacoes);
        });
        this.emit('ui:endPhaseClicked');
    }

    allocateBotTroops(allocations){
        allocations.forEach(allocation => {
            this.emit('troopsAllocated', { troops: allocation.tropas, territory: this.mapManager.getTerritory(allocation.territorio) })
        });
    }
}