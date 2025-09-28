import { Scene } from "phaser"
import { EventBus } from "../EventBus";
import { GameConfig } from "../config/gameConfig";
import { CARD_LAYOUTS, CARD_WIDTH, IMAGE_COMPONENT, NAME_COMPONENT, SELECTOR_COMPONENT } from "../config/playerSelectionCardData";
import { COLOR } from "../config/colors";

export class PlayerSelection extends Scene {
    constructor () {
        super('PlayerSelection');
    }

    createNameComponent(player) {
        const componentRectangle = this.add
            .rectangle(
                player.x, NAME_COMPONENT.y, 
                CARD_WIDTH, NAME_COMPONENT.height, 
                player.color, 1
            )
            .setOrigin(0)
            .setVisible(true);   
        
        return componentRectangle;
    }

    createImageComponent(player) {
        const componentRectangle = this.add
            .image(
                player.x, IMAGE_COMPONENT.y, 
                'image-component-background'
            )
            .setOrigin(0)
            .setVisible(true); 
        
        return componentRectangle;
    }

    createSelectorComponent(player) {
        const componentRectangle = this.add
            .rectangle(
                player.x, SELECTOR_COMPONENT.y, 
                CARD_WIDTH, SELECTOR_COMPONENT.height, 
                COLOR.secondary, 1
            )
            .setOrigin(0)
            .setVisible(true);   
        
        return componentRectangle;
    }

    create () {
        this.add.image(0, 0, 'main-background').setOrigin(0);

        const buttonText = this.add.text(
            (GameConfig.width / 2), (GameConfig.height - 20), 
            'INICIAR', 
            {
                fontFamily: 'JetBrainsMono',
                fontSize: 20,
                color: '#ffffff',
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setInteractive();

        buttonText.on('pointerdown', () => {
            this.changeScene();
        });

        this.createNameComponent(CARD_LAYOUTS.player1);
        this.createNameComponent(CARD_LAYOUTS.player2);
        this.createNameComponent(CARD_LAYOUTS.player3);
        this.createNameComponent(CARD_LAYOUTS.player4);
        this.createNameComponent(CARD_LAYOUTS.player5);

        this.createImageComponent(CARD_LAYOUTS.player1);
        this.createImageComponent(CARD_LAYOUTS.player2);
        this.createImageComponent(CARD_LAYOUTS.player3);
        this.createImageComponent(CARD_LAYOUTS.player4);
        this.createImageComponent(CARD_LAYOUTS.player5);
        
        this.createSelectorComponent(CARD_LAYOUTS.player1);
        this.createSelectorComponent(CARD_LAYOUTS.player2);
        this.createSelectorComponent(CARD_LAYOUTS.player3);
        this.createSelectorComponent(CARD_LAYOUTS.player4);
        this.createSelectorComponent(CARD_LAYOUTS.player5);

        EventBus.emit('current-scene-ready', this);
    }

    changeScene() {
        this.scene.start('Game');
    }
}