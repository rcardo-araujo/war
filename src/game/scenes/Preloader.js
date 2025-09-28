import { Game, Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig'

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
        this.load.image('main-background', 'assets/images/main-background.png');
        this.load.image('image-component-background', 'assets/images/selector_cards/image-component-background.png');

        this.load.image('left-arrow', 'assets/images/selector_cards/left-arrow.png');
        this.load.image('right-arrow', 'assets/images/selector_cards/right-arrow.png');

        this.load.audio('background-music', 'assets/audio/background.mp3');
        this.load.audio('hover-sound', 'assets/audio/hover.mp3');
        this.load.audio('click-sound', 'assets/audio/click.wav');

        this.load.json('mapData', 'assets/data/mapData.json');

        this.load.on('filecomplete-json-mapData', (key, type, data) => {
            data.territories.forEach(territory => {
                const id = territory.id;
                this.load.image(`${id}-filled`, `assets/images/maps/filled/${id}-filled.png`);
                this.load.image(`${id}-stroke`, `assets/images/maps/stroke/${id}-stroke.png`);
            });
        }, this);
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
