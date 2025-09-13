import { Scene } from 'phaser';

export class Boot extends Scene
{
    constructor ()
    {
        super('Boot');
    }

    preload ()
    {
        this.load.image('menu-background', 'assets/images/menu-background.png');
    }

    create ()
    {
        this.scene.start('Preloader');
    }
}
