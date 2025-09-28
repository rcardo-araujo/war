import { Scene } from "phaser"
import { EventBus } from "../EventBus";
import { GameConfig } from "../config/gameConfig";
import { COLOR } from "../config/colors";
import { ARROW_Y, CARD, CARD_LAYOUTS, COMPONENTS } from "../config/playerSelectionCardData";

export class PlayerSelection extends Scene {
    constructor () {
        super('PlayerSelection');
    }

    createNameComponent(player) {
        const componentRectangle = this.add
            .rectangle(
                player.x, COMPONENTS.name.y, 
                CARD.width, COMPONENTS.name.height, 
                player.color, 1
            )
            .setOrigin(0)
            .setVisible(true);   
    }

    createImageComponent(player) {
        const componentRectangle = this.add
            .image(
                player.x, COMPONENTS.image.y, 
                'image-component-background'
            )
            .setOrigin(0)
            .setVisible(true); 
    }

    createSelectorComponent(player) {
        const componentRectangle = this.add
            .rectangle(
                player.x, COMPONENTS.selector.y, 
                CARD.width, COMPONENTS.selector.height, 
                COLOR.secondary, 1
            )
            .setOrigin(0)
            .setVisible(true);   
        
        const leftArrow = this.add.image(
            player.leftArrowX, ARROW_Y,
            'left-arrow'
        )
        .setOrigin(0)
        .setVisible(true);

        const rightArrow = this.add.image(
            player.rightArrowX, ARROW_Y,
            'right-arrow'
        )
        .setOrigin(0)
        .setVisible(true);
    }

    createCard(player) {
        const name = this.createNameComponent(player);
        const image = this.createImageComponent(player);
        const selector = this.createSelectorComponent(player);
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

        CARD_LAYOUTS.forEach((player) => this.createCard(player));

        EventBus.emit('current-scene-ready', this);
    }

    changeScene() {
        this.scene.start('Game');
    }
}