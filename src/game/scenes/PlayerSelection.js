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
        .setVisible(true)
        .setInteractive();

        const rightArrow = this.add.image(
            player.rightArrowX, ARROW_Y,
            'right-arrow'
        )
        .setOrigin(0)
        .setVisible(true)
        .setInteractive();

        

        return { componentRectangle, leftArrow, rightArrow };
    }

    createCard(player) {
        const name = this.createNameComponent(player);
        const image = this.createImageComponent(player);
        const selector = this.createSelectorComponent(player);

        return { selector };
    }

    typeTexts() {
        const iaText = this.add.text(
            (CARD_LAYOUTS[0].x * 2 + CARD.width) / 2, 
            (COMPONENTS.selector.y * 2 + COMPONENTS.selector.height) / 2, 
            'IA', 
            {
                fontFamily: 'JetBrainsMono',
                fontSize: 18,
                color: '#ffffff',
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setVisible(false);

        const playerText = this.add.text(
            (CARD_LAYOUTS[0].x * 2 + CARD.width) / 2, 
            (COMPONENTS.selector.y * 2 + COMPONENTS.selector.height) / 2, 
            'PLAYER', 
            {
                fontFamily: 'JetBrainsMono',
                fontSize: 18,
                color: '#ffffff',
                align: 'center'
            }
        )
        .setOrigin(0.5)
        .setVisible(false);

        return { iaText, playerText }
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

        const cards = CARD_LAYOUTS.map((player) => this.createCard(player));

        let cardOneState = 'player';
        const cardOneTexts = this.typeTexts();
        
        cardOneTexts.playerText.setVisible(true);

        cards[0].selector.leftArrow.on('pointerdown', () => {
            if (cardOneState.localeCompare('player') == 0) {
                cardOneState = 'ia';
                cardOneTexts.playerText.setVisible(false);
                cardOneTexts.iaText.setVisible(true);
            } else {
                cardOneState = 'player';
                cardOneTexts.iaText.setVisible(false);
                cardOneTexts.playerText.setVisible(true);
            }
        });

        cards[0].selector.rightArrow.on('pointerdown', () => {
            if (cardOneState.localeCompare('player') == 0) {
                cardOneState = 'ia';
                cardOneTexts.playerText.setVisible(false);
                cardOneTexts.iaText.setVisible(true);
            } else {
                cardOneState = 'player';
                cardOneTexts.iaText.setVisible(false);
                cardOneTexts.playerText.setVisible(true);
            }
        });

        EventBus.emit('current-scene-ready', this);
    }

    changeScene() {
        this.scene.start('Game');
    }
}