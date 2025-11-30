import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { UIScene } from './scenes/UIScene';

import { GameConfig } from './config/gameConfig'
import { PlayerSelection } from './scenes/PlayerSelection';
import { ObjectiveTestScene } from '../../tests/scenes/objectiveTestScene';

let config;
if (import.meta.env.MODE !== "test") {
    config = {
        type: Phaser.AUTO,
        ...GameConfig,
        parent: 'game-container',
        scene: [
            Boot,
            Preloader,
            MainMenu,
            PlayerSelection,
            Game,
            UIScene
        ],
        dom: {
            createContainer: true
        }
    };
}
else {
    config = {
        type: Phaser.AUTO,
        ...GameConfig,
        parent: 'game-container',
        scene: [
            ObjectiveTestScene
        ],
        dom: {
            createContainer: true
        }
    };
}

const StartGame = (parent) => {
    return new Phaser.Game({ ...config, parent });
}

export default StartGame;
