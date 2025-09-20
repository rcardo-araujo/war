import Phaser from 'phaser';
import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import { MainMenu } from './scenes/MainMenu';
import { Preloader } from './scenes/Preloader';

import { GameConfig } from './config/gameConfig'

const config = {
    type: Phaser.AUTO,
    ...GameConfig,
    parent: 'game-container',
    scene: [
        Boot,
        Preloader,
        MainMenu,
        Game,
    ]
};

const StartGame = (parent) => {
    return new Phaser.Game({ ...config, parent });
}

export default StartGame;
