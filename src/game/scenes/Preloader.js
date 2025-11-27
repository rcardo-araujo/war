import { Game, Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig'
import { bordersData } from '../config/bordersData';

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

        this.load.image('target-aim', 'assets/images/ui/target-aim.png');
        this.load.image('target-elipse', 'assets/images/ui/target-elipse.png');
        this.load.image('objective-card', 'assets/images/ui/objective-card.png');

        this.load.image('button-next-turn', 'assets/images/ui/hud/button-next-turn.png');
        this.load.image('center-bar-stroke', 'assets/images/ui/hud/center-bar-stroke.png');
        this.load.image('center-bar', 'assets/images/ui/hud/center-bar.png');
        this.load.image('side-panel', 'assets/images/ui/hud/side-panel.png');
        this.load.image('icon-attack-phase', 'assets/images/ui/hud/icon-attack-phase.png');
        this.load.image('icon-fortify-phase', 'assets/images/ui/hud/icon-fortify-phase.png');
        this.load.image('icon-relocation-phase', 'assets/images/ui/hud/icon-relocation-phase.png');
        this.load.image('phase-bar-active', 'assets/images/ui/hud/phase-bar-active.png');
        this.load.image('phase-bar-inactive', 'assets/images/ui/hud/phase-bar-inactive.png');
        this.load.image('phase-label-background', 'assets/images/ui/hud/phase-label-background.png');
        this.load.image('territory-cards', 'assets/images/ui/hud/territory-cards.png');
        
        this.load.image('army-counter-inner', 'assets/images/ui/army-counter-inner.png');
        this.load.image('army-counter-stroke', 'assets/images/ui/army-counter-stroke.png');

        this.load.audio('background-music', 'assets/audio/background.mp3');
        this.load.audio('hover-sound', 'assets/audio/hover.mp3');
        this.load.audio('click-sound', 'assets/audio/click.wav');

        this.load.json('mapData', 'assets/data/mapData.json');
        this.load.json('objectivesData', 'assets/data/objectives.json');
        this.load.on('filecomplete-json-mapData', (key, type, data) => {
            data.territories.forEach(territory => {
                const id = territory.id;
                this.load.image(`${id}-filled`, `assets/images/maps/filled/${id}-filled.png`);
                this.load.image(`${id}-stroke`, `assets/images/maps/stroke/${id}-stroke.png`);
            });
        }, this);

        Object.keys(bordersData).forEach(key => {
            this.load.image(`border-${key}`, `assets/images/maps/border/border-${key}.png`);
        });
    }

    create ()
    {
        this.scene.start('MainMenu');
    }
}
