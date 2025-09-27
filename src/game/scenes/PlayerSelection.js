import { Scene } from "phaser"
import { EventBus } from "../EventBus";
import { GameConfig } from "../config/gameConfig";
import { CARD_LAYOUTS, CARD_WIDTH, NAME_COMPONENT } from "../config/playerSelectionCardData";

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

        EventBus.emit('current-scene-ready', this);
    }

    changeScene() {
        this.scene.start('Game');
    }
}