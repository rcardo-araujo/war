import { PLAYER_TYPES } from '../config/playerTypes';
import Player from '../gameObjects/Player';
import Territory from '../gameObjects/Territory';
import { COLORS } from "../config/colors";
import Objective from '../gameObjects/Objective';
import { shuffleInPlace, chooseObjectiveType, getRandomOpponent} from '../utils/objectiveDistribution';

export default class GameStateManager extends Phaser.Events.EventEmitter {
    constructor(scene, playerSetup = []) {
        super();
        this.scene = scene;
        this.territories = {};
        this.continents = {};
        this.players = []
        this.initializeMap();
        this.initializePlayers(playerSetup);
        this.initializeObjectives(this.players);
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

    distributeTerritories() {
        if (this.players.length === 0)
            return
        const territoriesIds = Object.values(this.territories).map(terrt => terrt.id);

        for (let i = territoriesIds.length - 1; i > 0; i--) {
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
                territory.addTroops(1);
            }
        )
    }
    
    initializePlayers(playerConfigs = []){
        this.players = playerConfigs.filter(
            cfg => cfg.type != PLAYER_TYPES.NONE
        ).map(cfg => new Player(cfg.name, cfg.color, this.getPlayerColorName(cfg.color)));
    } 

    initializeObjectives(){
        if (this.players.length == 0){
            return;
        }
        const objectivesData = this.scene.cache.json.get("objectivesData");
        if (!objectivesData){
            return;
        }

        const fallbackDefinition = objectivesData.fallback;

        const conquestDeck = Array.isArray(objectivesData.conquest) ? 
        objectivesData.conquest.map(definition => new Objective({
            type: 'conquest',
            description: definition.description,
            main: definition.main,
            fallback:  fallbackDefinition
        })) : [];
        
        shuffleInPlace(conquestDeck);
        
        const availableTypes = Array.isArray(objectivesData.types) ? [...objectivesData.types] : ["conquest"];
        const destructionDefinition = objectivesData.destruction ?? null;

        this.players.forEach(player => {
            const type = chooseObjectiveType(availableTypes, conquestDeck.length, this.players.length);
            if (type === "destruction" && destructionDefinition){
                const opponent = getRandomOpponent(player, this.players);
                if (opponent){
                    const colorKey = opponent.colorKey;
                    const colorLabel = destructionDefinition.colorLabels?.[colorKey];
                    const descriptionTemplate = destructionDefinition.description ?? '';
                    const description = descriptionTemplate.replace(/{{colorLabel}}/g, colorLabel);
                    const objective = new Objective({
                        type: 'destruction',
                        description: description,
                        main: {targetColor: colorKey},
                        fallback: fallbackDefinition,
                        target: opponent
                    });
                    player.setObjective(objective);
                    return;
                }
            }

            const conquestObjective = conquestDeck.pop();
            if (conquestObjective){
                player.setObjective(conquestObjective);
            }
        });
        
        

    }

    getPlayerColorName(hexColor){
        const colorEntry = Object.entries(COLORS).find(([, value]) => value === hexColor);
        return colorEntry ? colorEntry[0] : null;
    }

}