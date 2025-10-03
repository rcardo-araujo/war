import { Scene } from "phaser"
import { EventBus } from "../EventBus";
import { GameConfig } from "../config/gameConfig";
import { COLORS } from "../config/colors";
import { ARROW_Y, CARDS, CARD_LAYOUTS, COMPONENTS, PLAYER_NAMES } from "../config/playerSelectionCardData";
import { PLAYER_TYPE_IMAGES, PLAYER_TYPE_LABELS, PLAYER_TYPES } from "../config/playerTypes";
import { createTextButton } from "../utils/createTextButton";

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

    createNameComponent(cardLayout, playerName) {
        const background = this.add
            .rectangle(
                cardLayout.x, COMPONENTS.name.y, 
                CARDS.width, COMPONENTS.name.height, 
                cardLayout.color, 1
            )
            .setOrigin(0)
            .setVisible(true);   
        
        const name = this.add.text(
            (cardLayout.x * 2 + CARDS.width) / 2, 
            (COMPONENTS.name.y * 2 + COMPONENTS.name.height) / 2, 
            playerName, 
            {
                fontFamily: 'JetBrainsMono',
                fontSize: 18,
                fontStyle: 'bold',
                lineSpacing: 10,
                color: COLORS.primary,
                align: 'center'
            }
        )
        .setOrigin(0.5);

        return {
            background, 
            name
        };
    }

    createImageComponent(cardLayout) {
        const background = this.add.image(
            cardLayout.x, COMPONENTS.image.y,
            'image-component-background'
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
                CARDS.width, COMPONENTS.selector.height, 
                COLORS.secondary, 1
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
                (CARD_LAYOUTS[cardIndex].x * 2 + CARDS.width) / 2, 
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

    createCard(cardLayout, cardIndex, playerName) {
        const card = {
            name: this.createNameComponent(cardLayout, playerName),
            image: this.createImageComponent(cardLayout),
            selector: this.createSelectorComponent(cardLayout, cardIndex),

            playerType: PLAYER_TYPES.HUMAN,
            playerName: playerName,
            playerColor: cardLayout.color
        };

        return card;
    }

    getPlayersData() {
        return this.cards.map(card => ({
            name: card.playerName,
            type: card.playerType,
            color: card.playerColor
        }));
    }

    create () {
        this.add.image(0, 0, 'main-background').setOrigin(0);

        createTextButton(this,
            (GameConfig.width / 2),
            (GameConfig.height + (CARDS.y + CARDS.height)) / 2,
            'INICIAR', 20, () => this.changeScene() 
        );

        CARD_LAYOUTS.forEach((cardLayout, index) => {
            const playerName = PLAYER_NAMES[index];

            const card = this.createCard(cardLayout, index, playerName);
            this.cards.push(card);
        });

        EventBus.emit('current-scene-ready', this);
    }

    preload () {
        this.load.image('image-component-background', 'assets/images/selector_cards/image-component-background.png');

        this.load.image('human-image', 'assets/images/selector_cards/human.png');
        this.load.image('bot-image', 'assets/images/selector_cards/bot.png');
        this.load.image('none-image', 'assets/images/selector_cards/human-transparent.png');

        this.load.image('left-arrow', 'assets/images/selector_cards/left-arrow.png');
        this.load.image('right-arrow', 'assets/images/selector_cards/right-arrow.png');
    }

    changeScene () {
        const playersData = this.getPlayersData();

        this.scene.start('Game', { players: playersData });
    }
}