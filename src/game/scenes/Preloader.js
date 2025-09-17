import { Game, Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig'
import { countries, strokePath, filledPath } from '../config/countriesData'

export class Preloader extends Scene
{
    constructor ()
    {
        super('Preloader');
    }

    init ()
    {
        this.add.image(0, 0, 'menu-background').setOrigin(0);
    
        const centerX = GameConfig.width / 2;
        const centerY = GameConfig.height / 2;

        const barWidth = 500;
        const barHeight = 30;

        this.add.rectangle(centerX, centerY, barWidth, barHeight)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);

        const padding = 4;
        const innerWidth = barWidth - (padding * 2);
        const innerHeight = barHeight - (padding * 2);
         
        const bar = this.add.rectangle(
            centerX - (barWidth / 2) + padding, 
            centerY - (barHeight / 2) + padding, 
            0, innerHeight, 0xffffff
        ).setOrigin(0);

        this.load.on('progress', (progress) => {
            bar.width = innerWidth * progress;
        });
    }

    preload ()
    {
        this.load.image('logo', 'assets/images/logo.png');
        this.load.image('board-background', 'assets/images/maps/board-background.png');

        this.load.audio('background-music', 'assets/audio/background.mp3');
        this.load.audio('hover-sound', 'assets/audio/hover.mp3');
        this.load.audio('click-sound', 'assets/audio/click.wav');

        countries.forEach(country => {
            const name = country.key;
            this.load.image(`${name}-stroke`, `${strokePath}/${name}-stroke.png`);
            this.load.image(`${name}-filled`, `${filledPath}/${name}-filled.png`);
        });
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
