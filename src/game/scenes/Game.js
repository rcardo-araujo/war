import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameConfig } from '../configs/gameConfig';
import { countries, strokeWeight } from '../configs/countriesData';

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

        // countries.forEach(country => {
        //     this.add.image(country.x - strokeWeight / 2, country.y - strokeWeight / 2, `${country.key}-stroke`).setOrigin(0).setTintFill(0xffff00);
        //     this.add.image(country.x, country.y, `${country.key}-filled`).setOrigin(0).setTintFill(0x000000);
        // });
        const objs = {}
        Object.entries(countries).forEach(
            ([name, coords]) => {
                let stroke = this.add.image(coords[0] - strokeWeight / 2, coords[1] - strokeWeight / 2, `${name}-stroke`).setOrigin(0).setTintFill(0xffff00);
                let filled = this.add.image(coords[0], coords[1], `${name}-filled`).setOrigin(0).setTintFill(0x000000);
                
                const obj = {stroke, filled}
                objs[name] = obj

                objs[name].filled.setInteractive({ pixelPerfect: true});
                objs[name].filled.on('pointerover', () => {
                    objs[name].filled.setScale(1.1);
                    objs[name].stroke.setScale(1.1);
                    objs[name].stroke.setTintFill(0xffffff);
                    
                    let x = objs[name].filled.x + objs[name].filled.width/2 - 1.1*(objs[name].filled.width/2) 
                    let y = objs[name].filled.y + objs[name].filled.height/2 - 1.1*(objs[name].filled.height/2)
                    
                    let x_ = objs[name].filled.x - strokeWeight / 2 + objs[name].filled.width/2 - 1.1*(objs[name].filled.width/2)
                    let y_ = objs[name].filled.y - strokeWeight / 2 + objs[name].filled.height/2 - 1.1*(objs[name].filled.height/2)
                    
                    objs[name].filled.setPosition(x, y)
                    objs[name].stroke.setPosition(x_, y_)
                    this.children.bringToTop(objs[name].stroke);
                    this.children.bringToTop(objs[name].filled);
                    objs[name]
                });
                objs[name].filled.on('pointerout', () => {
                    objs[name].stroke.setTintFill(0xffff00);
                    objs[name].filled.setScale(1);
                    objs[name].stroke.setScale(1);
                    objs[name].stroke.setPosition(countries[name][0] - strokeWeight / 2, countries[name][1] - strokeWeight / 2)
                    objs[name].filled.setPosition(countries[name][0], countries[name][1])
                    objs[name].stroke.setZ(0)
                    objs[name].filled.setZ(0)
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
