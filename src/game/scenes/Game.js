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

        const countryImages = {}
        Object.entries(countries).forEach(
            ([name, coords]) => {
                let stroke = this.add.image(coords[0] - strokeWeight / 2, coords[1] - strokeWeight / 2, `${name}-stroke`).setOrigin(0).setTintFill(0xffff00);
                let filled = this.add.image(coords[0], coords[1], `${name}-filled`).setOrigin(0).setTintFill(0x000000);
                
                const obj = {stroke, filled}
                countryImages[name] = obj

                countryImages[name].filled.setInteractive({ pixelPerfect: true});
                countryImages[name].filled.on('pointerover', () => {
                    countryImages[name].filled.setScale(1.1);
                    countryImages[name].stroke.setScale(1.1);
                    countryImages[name].stroke.setTintFill(0xffffff);
                    
                    let x = countryImages[name].filled.x + countryImages[name].filled.width/2 - 1.1*(countryImages[name].filled.width/2) 
                    let y = countryImages[name].filled.y + countryImages[name].filled.height/2 - 1.1*(countryImages[name].filled.height/2)
                    
                    let x_ = countryImages[name].filled.x - strokeWeight / 2 + countryImages[name].filled.width/2 - 1.1*(countryImages[name].filled.width/2)
                    let y_ = countryImages[name].filled.y - strokeWeight / 2 + countryImages[name].filled.height/2 - 1.1*(countryImages[name].filled.height/2)
                    
                    countryImages[name].filled.setPosition(x, y)
                    countryImages[name].stroke.setPosition(x_, y_)
                    this.children.bringToTop(countryImages[name].stroke);
                    this.children.bringToTop(countryImages[name].filled);
                    countryImages[name]
                });
                countryImages[name].filled.on('pointerout', () => {
                    countryImages[name].stroke.setTintFill(0xffff00);
                    countryImages[name].filled.setScale(1);
                    countryImages[name].stroke.setScale(1);
                    countryImages[name].stroke.setPosition(countries[name][0] - strokeWeight / 2, countries[name][1] - strokeWeight / 2)
                    countryImages[name].filled.setPosition(countries[name][0], countries[name][1])
                    countryImages[name].stroke.setZ(0)
                    countryImages[name].filled.setZ(0)
                });


            }
        )

        this.add.image().setPosition

    }

    loop ()
    { 

    }

    changeScene ()
    {
        this.scene.start('GameOver');
    }
}
