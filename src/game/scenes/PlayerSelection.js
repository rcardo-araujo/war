import { Scene } from "phaser"
import { EventBus } from "../EventBus";
import { GameConfig } from "../config/gameConfig";
import { COLOR } from "../config/colors";
import { ARROW_Y, CARD, CARD_LAYOUTS, COMPONENTS } from "../config/playerSelectionCardData";
import { PLAYER_TYPE_IMAGES, PLAYER_TYPE_LABELS, PLAYER_TYPES } from "../config/playerTypes";

export class PlayerSelection extends Scene {
    constructor () {
        super('PlayerSelection');
        
        this.cards = [];
        this.typeOrder = [
            PLAYER_TYPES.HUMAN, 
            PLAYER_TYPES.BOT, 
            PLAYER_TYPES.NONE
        ];
    }

    createNameComponent(cardLayout) {
        const background = this.add
            .rectangle(
                cardLayout.x, COMPONENTS.name.y, 
                CARD.width, COMPONENTS.name.height, 
                cardLayout.color, 1
            )
            .setOrigin(0)
            .setVisible(true);   
    }

    createImageComponent(cardLayout) {
        const background = this.add.rectangle(
            cardLayout.x, COMPONENTS.image.y,
            CARD.width, COMPONENTS.image.height,
            COLOR.primary
        )
        .setOrigin(0);
        
        const typeImages = {};
        this.typeOrder.forEach(type => {
            const imageName = PLAYER_TYPE_IMAGES[type];

            typeImages[type] = this.add.image(
                cardLayout.x, COMPONENTS.image.y,
                imageName
            )
            .setOrigin(0)
            .setVisible(type === PLAYER_TYPES.HUMAN);
        });

        return {
            background,
            typeImages
        };
    }

    createSelectorComponent(cardLayout, cardIndex) {
        const background = this.add
            .rectangle(
                cardLayout.x, COMPONENTS.selector.y, 
                CARD.width, COMPONENTS.selector.height, 
                COLOR.secondary, 1
            )
            .setOrigin(0)
            .setVisible(true);   
        
        const leftArrow = this.add.image(
            cardLayout.leftArrowX, ARROW_Y,
            'left-arrow'
        )
        .setOrigin(0)
        .setVisible(true)
        .setInteractive();

        const rightArrow = this.add.image(
            cardLayout.rightArrowX, ARROW_Y,
            'right-arrow'
        )
        .setOrigin(0)
        .setVisible(true)
        .setInteractive();

        const typeTexts = {};
        this.typeOrder.forEach(type => {
            typeTexts[type] = this.add.text(
                (CARD_LAYOUTS[cardIndex].x * 2 + CARD.width) / 2, 
                (COMPONENTS.selector.y * 2 + COMPONENTS.selector.height) / 2, 
                PLAYER_TYPE_LABELS[type], 
                {
                    fontFamily: 'JetBrainsMono',
                    fontSize: 18,
                    color: '#ffffff',
                    align: 'center'
                }
            )
            .setOrigin(0.5)
            .setVisible(type === PLAYER_TYPES.HUMAN);
        });

        const toggleHandler = () => this.togglePlayerType(cardIndex);
        leftArrow.on('pointerdown', toggleHandler);
        rightArrow.on('pointerdown', toggleHandler);

        return {
            background,
            leftArrow,
            rightArrow,
            typeTexts 
        };
    }

    updateSelectorDisplay(card) {
        const { playerType, selector, image } = card;
        
        this.typeOrder.forEach(type => {
            selector.typeTexts[type].setVisible(type === playerType);
        });

        this.typeOrder.forEach(type => {
            image.typeImages[type].setVisible(type === playerType);
        });
    }

    togglePlayerType(cardIndex) {
        const card = this.cards[cardIndex];
        
        const currentIndex = this.typeOrder.indexOf(card.playerType);
        const nextIndex = (currentIndex + 1) % this.typeOrder.length;
        
        card.playerType = this.typeOrder[nextIndex];
        
        this.updateSelectorDisplay(card);
    }

    createCard(cardLayout, cardIndex) {
        const card = {
            name: this.createNameComponent(cardLayout),
            image: this.createImageComponent(cardLayout),
            selector: this.createSelectorComponent(cardLayout, cardIndex),
            playerType: PLAYER_TYPES.HUMAN
        };

        return card;
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

        CARD_LAYOUTS.forEach((cardLayout, index) => {
            const card = this.createCard(cardLayout, index);
            this.cards.push(card);
        });

        EventBus.emit('current-scene-ready', this);
    }

    preload () {
        this.load.image('human-image', 'assets/images/selector_cards/human.png');
        this.load.image('bot-image', 'assets/images/selector_cards/bot.png');
        this.load.image('none-image', 'assets/images/selector_cards/human-transparent.png');
    }

    changeScene () {
        this.scene.start('Game');
    }
}