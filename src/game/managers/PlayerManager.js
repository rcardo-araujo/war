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

    initializeObjectives(objectivesData) {
        if (this.players.length == 0) {
            return;
        }
        if (!objectivesData) {
            return;
        }

        const fallbackDefinition = objectivesData.fallback;

        const conquestDeck = Array.isArray(objectivesData.conquest) ?
            objectivesData.conquest.map(definition => new Objective({
                type: 'conquest',
                description: definition.description,
                main: definition.main,
                fallback: fallbackDefinition
            })) : [];

        shuffleInPlace(conquestDeck);

        const availableTypes = Array.isArray(objectivesData.types) ? [...objectivesData.types] : ["conquest"];
        const destructionDefinition = objectivesData.destruction ?? null;

        this.players.forEach(player => {
            const type = chooseObjectiveType(availableTypes, conquestDeck.length, this.players.length);
            if (type === "destruction" && destructionDefinition) {
                const opponent = getRandomOpponent(player, this.players);
                if (opponent) {
                    const colorKey = opponent.colorKey;
                    const colorLabel = destructionDefinition.colorLabels?.[colorKey];
                    const descriptionTemplate = destructionDefinition.description ?? '';
                    const description = descriptionTemplate.replace(/{{colorLabel}}/g, colorLabel);
                    const objective = new Objective({
                        type: 'destruction',
                        description: description,
                        main: { targetColor: colorKey },
                        fallback: fallbackDefinition,
                        target: opponent
                    });
                    player.setObjective(objective);
                    return;
                }
            }

            const conquestObjective = conquestDeck.pop();
            if (conquestObjective) {
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

    totalTroopsForPlayer(player) {
        let totalTroops = 0;
        player.ownedTerritories.forEach(territory => {
            totalTroops += territory.getTroopCount();
        });
        return totalTroops;
    }

    checkAccumulateObjective(player) {
        if (!player || !player.objective) return false;
        const obj = player.objective;
        const main = obj.main || {};


        if (typeof main.accumulate === 'number') {
            const needed = main.accumulate;
            if (typeof main.occupy === 'number') {
                let count = 0;
                player.ownedTerritories.forEach(t => {
                    if ((t && t.getTroopCount() >= main.occupy) || (!main.occupy)) count++;
                });
                if (count >= needed) return true;
            } else {
                if (player.ownedTerritories.size >= needed) return true;
            }
        }
        return false;
    }

    checkContinentObjective(player, mapManager) {
        if (!player || !player.objective) return false;
        const obj = player.objective;
        const main = obj.main || {};

        if (Array.isArray(main.continents) && main.continents.length > 0) {
            const territories = Object.values(mapManager.territories);
            const normalize = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]/g, '');

            for (let continentName of main.continents) {
                if (continentName === 'X') {
                    continue;
                }
                const neededTerritories = territories.filter(t => normalize(t.continent) === normalize(continentName));
                if (neededTerritories.length === 0) {
                    return false;
                }

                const ownsAll = neededTerritories.every(t => player.ownedTerritories.has(t));
                if (!ownsAll) return false;
            }
            return true;
        }
    }

    checkDestructionObjective(player, defender) {
        if (!player || !player.objective) return false;
        const obj = player.objective;
        const main = obj.main || {};

        if (defender) {
            const totalTroops = this.totalTroopsForPlayer(defender);
            if (totalTroops === 0) {
                if (obj.type === 'destruction' && player.objective.target === defender) {
                    return true;
                }
                else {
                    for (let p of this.players) {
                        if (p.objective.type === 'destruction') {
                            if (p.objective.target === defender) {
                                p.objective = p.objective.default;
                            }
                        }
                    }
                }
            }
        }

        return false;
    }

    isObjectiveComplete(player, mapManager, defender) {
        if (this.checkAccumulateObjective(player)) {
            return true;
        }
        if (this.checkContinentObjective(player, mapManager)) {
            return true;
        }
        if (this.checkDestructionObjective(player, defender)) {
            return true;
        }
        return false;
    }

    removePlayer(player) {
        let index = this.players.findIndex(p => p === player);
        this.players.splice(index, 1);
    }
}

