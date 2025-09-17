import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig';
import { countries, strokeWeight } from '../config/countriesData';
import { Colors } from '../config/colors';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.add.image(0, 0, 'board-background')
            .setOrigin(0)
            .setDisplaySize(GameConfig.width, GameConfig.height);

        countries.forEach(country => {
            this.add.image(country.x - strokeWeight / 2, country.y - strokeWeight / 2, `${country.key}-stroke`).setOrigin(0).setTintFill(0xffffff);
            this.add.image(country.x, country.y, `${country.key}-filled`).setOrigin(0).setTintFill(Colors.primary);
        });
    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
