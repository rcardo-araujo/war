import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.image('background', 'assets/bg.png');

        this.load.audio('bgMusic', 'assets/audio/background.mp3');
        this.load.audio('hoverSound', 'assets/audio/hover.mp3');
        this.load.audio('clickSound', 'assets/audio/click.wav');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
