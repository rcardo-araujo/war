import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class MainMenu extends Scene
{
    logoTween;

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
        }).setOrigin(0.5, 0.5);

        const paddingX = 20;
        const paddingY = 10;
        
        const bg = this.add
            .rectangle(0, 0, buttonText.width + paddingX, buttonText.height + paddingY, 0xb3ff3b, 1)
            .setOrigin(0.5, 0.5)
            .setVisible(false); 

        const buttonWidth = buttonText.width + paddingX;
        const adjustedX = x + (buttonWidth / 2);
        
        const container = this.add.container(adjustedX, y, [bg, buttonText]);

        container.setSize(bg.width, bg.height);
        container.setInteractive({ useHandCursor: true });

        container.on('pointerover', () => {
            bg.setVisible(true);       
            buttonText.setColor('#000'); 
            this.sound.play('hoverSound', { volume: 0.9 }); 
        });

        container.on('pointerout', () => {
            bg.setVisible(false);    
            buttonText.setColor('#ffffff'); 
        });

        container.on('pointerdown', () => {
            this.sound.play('clickSound', { volume: 0.5 });
            onClick(); 
        });

        return container;
    }


    create () {
        this.bgMusic = this.sound.add('bgMusic', {
            volume: 0.5,
            loop: true   
        });

        this.bgMusic.play();

        const { width, height } = this.cameras.main;

        this.add.image(0, 0, 'background')
            .setOrigin(0)       
            .setDisplaySize(width, height); 

        const marginX = width * 0.075;
        const marginY = height * 0.15;

        this.logo = this.add.image(marginX, marginY, 'logo')
            .setOrigin(0, 0) 
            .setDepth(100);

        const buttonSpacing = 60;
        const startY = height - marginY * 2;

        this.createMenuButton(marginX, startY - buttonSpacing * 2, 'JOGAR', () => console.log('Iniciar jogo'));
        this.createMenuButton(marginX, startY - buttonSpacing, 'HISTÓRICO', () => console.log('Abrir histórico'));
        this.createMenuButton(marginX, startY, 'OPÇÕES', () => console.log('Abrir opções'));

        EventBus.emit('current-scene-ready', this);
    }

    changeScene ()
    {
        if (this.logoTween)
        {
            this.logoTween.stop();
            this.logoTween = null;
        }

        this.scene.start('Game');
    }

    moveLogo (reactCallback)
    {
        if (this.logoTween)
        {
            if (this.logoTween.isPlaying())
            {
                this.logoTween.pause();
            }
            else
            {
                this.logoTween.play();
            }
        }
        else
        {
            this.logoTween = this.tweens.add({
                targets: this.logo,
                x: { value: 750, duration: 3000, ease: 'Back.easeInOut' },
                y: { value: 80, duration: 1500, ease: 'Sine.easeOut' },
                yoyo: true,
                repeat: -1,
                onUpdate: () => {
                    if (reactCallback)
                    {
                        reactCallback({
                            x: Math.floor(this.logo.x),
                            y: Math.floor(this.logo.y)
                        });
                    }
                }
            });
        }
    }
}
