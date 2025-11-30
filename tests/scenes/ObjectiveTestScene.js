import { Scene } from 'phaser'; import { PLAYER_TYPES } from '../../src/game/config/playerTypes';
import { COLORS } from '../../src/game/config/colors';
import GameStateManager from '../../src/game/managers/GameStateManager';
import DebugTools from '../../src/game/config/DebugTools';
import Objective from '../../src/game/gameObjects/Objective';
;

export class ObjectiveTestScene extends Scene {
    constructor() {
        super('ObjectiveTestScene');
    }

    preload() {
        this.load.json('mapData', 'assets/data/mapData.json');
        this.load.json('objectivesData', 'assets/data/objectives.json');
    }

    create() {
        const mapData = this.cache.json.get('mapData');
        const objectivesData = this.cache.json.get('objectivesData');

        console.log(mapData);

        const players_init = [
            { name: "Alice", type: PLAYER_TYPES.HUMAN, color: COLORS.blue },
            { name: "Bob", type: PLAYER_TYPES.HUMAN, color: COLORS.pink },
            { name: "Carlos", type: PLAYER_TYPES.HUMAN, color: COLORS.purple }
        ];

        this.gsm = new GameStateManager(this, players_init);
        this.debug = new DebugTools(this.gsm);

        this.gsm.on("game:objectiveAchieved", (data) => {
            const { player, objective } = data;
            console.log("Objetivo alcançado!", player, objective);
        });

        console.log(this.gsm.playerManager.getPlayers());

        // const fallbackDefinition = objectivesData.fallback;
        // const conquestDeck = Array.isArray(objectivesData.conquest) ?
        //             objectivesData.conquest.map(definition => new Objective({
        //                 type: 'conquest',
        //                 description: definition.description,
        //                 main: definition.main,
        //                 fallback: fallbackDefinition
        //             })) : [];

        // console.log(conquestDeck);

        let players = this.gsm.playerManager.getPlayers();
        if (players[0].objective.type === 'destruction') {
            this.debug.eliminatePlayerWithAttacker(players[0].objective.target.name, players[0].name);
        }
    }

    update() {
    }
}