import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig'
import { Colors } from '../config/colors';

export class MainMenu extends Scene
{
     constructor ()
    {
        super('MainMenu');
    }

    createMenuButton(x, y, label, onClick) {
        const buttonText = this.add.text(0, 0, label, {
            fontFamily: 'JetBrainsMono',
            fontSize: 30,
            color: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);

        const paddingX = 20;
        const paddingY = 10;
        
        const buttonBackground = this.add
            .rectangle(0, 0, buttonText.width + paddingX, buttonText.height + paddingY, Colors.brand, 1)
            .setOrigin(0.5)
            .setVisible(false); 

        const buttonWidth = buttonText.width + paddingX;
        const adjustedX = x + (buttonWidth / 2);
        
        const container = this.add.container(adjustedX, y, [buttonBackground, buttonText]);

        container.setSize(buttonBackground.width, buttonBackground.height);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            buttonBackground.setVisible(true);       
            buttonText.setColor(Colors.primary); 
            this.sound.play('hover-sound', { volume: 0.9 }); 
        });

        container.on('pointerout', () => {
            buttonBackground.setVisible(false);    
            buttonText.setColor('#ffffff'); 
        });

        container.on('pointerdown', () => {
            this.sound.play('click-sound', { volume: 0.5 });
            onClick(); 
        });

        return container;
    }


    create () {
        this.add.image(0, 0, 'menu-background').setOrigin(0)  
        
        this.backgroundMusic = this.sound.add('background-music', {
            volume: 0.5,
            loop: true   
        });

        this.backgroundMusic.play();

        const marginX = GameConfig.width * 0.075;
        const marginY = GameConfig.height * 0.15;

        this.logo = this.add.image(marginX, marginY, 'logo')
            .setOrigin(0) 
            .setDepth(100);

        const buttonSpacing = 60;
        const startY = GameConfig.height - marginY * 2;

        this.createMenuButton(marginX, startY - buttonSpacing * 2, 'JOGAR', () => this.changeScene());
        this.createMenuButton(marginX, startY - buttonSpacing, 'HISTÓRICO', () => console.log('Abrir histórico'));
        this.createMenuButton(marginX, startY, 'OPÇÕES', () => console.log('Abrir opções'));

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        this.scene.start('Game');
    }
}
