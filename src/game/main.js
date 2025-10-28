import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';
import { UIScene } from './scenes/UIScene';

import { GameConfig } from './config/gameConfig'
import { PlayerSelection } from './scenes/PlayerSelection';

const config = {
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

const StartGame = (parent) => {
    return new Phaser.Game({ ...config, parent });
}

export default StartGame;
