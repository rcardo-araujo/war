import { PLAYER_TYPES } from '../config/playerTypes';
import Player from '../gameObjects/Player';
import Objective from '../gameObjects/Objective';
import { COLORS } from "../config/colors";
import { shuffleInPlace, chooseObjectiveType, getRandomOpponent } from '../utils/objectiveDistribution';

export default class PlayerManager {
    constructor(playerConfigs, objectivesData) {
        this.players = [];
        this.initializePlayers(playerConfigs);
        this.initializeObjectives(objectivesData);
    }

    initializePlayers(playerConfigs = []) {
        this.players = playerConfigs
            .filter(cfg => cfg.type !== PLAYER_TYPES.NONE)
            .map(cfg => new Player(cfg.name, cfg.color, this.getPlayerColorName(cfg.color)));
    }

    initializeObjectives(objectivesData){
        if (this.players.length == 0){
            return;
        }
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

    calculateReinforcements(player) {
        console.log(`Calculando reforços para ${player.name}`);
        player.setAvailableTroops();
    }

    getPlayerColorName(hexColor) {
        const colorEntry = Object.entries(COLORS).find(([, value]) => value === hexColor);
        return colorEntry ? colorEntry[0] : null;
    }

    getPlayers() {
        return this.players;
    }

    getCurrentPlayer(turnManager) {
        return turnManager.getCurrentPlayer();
    }
}