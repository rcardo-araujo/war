import { Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig';
import GameStateManager from '../managers/GameStateManager';
import { COLORS } from '../config/colors';

export class Game extends Scene {
    constructor() {
        super('Game');
    }

    init(data) {
        this.playerSetup = data.players;
    }

    create() {
        this.gameState = new GameStateManager(this, this.playerSetup);

        this.add.image(0, 0, 'board-background')
            .setOrigin(0)
            .setDisplaySize(GameConfig.width, GameConfig.height);

        this.territorySprites = {};

        this.drawMap();
        this.setupInteractivity();
        this.setupGameEventListeners();

        this.scene.launch('UIScene', { gameStateManager: this.gameState });
    }

    update() {
    }

    drawMap() {
        const mapData = this.cache.json.get('mapData');

        mapData.territories.forEach(territoryData => {
            const { id, name, position } = territoryData;
            const territoryLogic = this.gameState.mapManager.getTerritory(id);

            const filledSprite = this.add.image(position.x, position.y, `${id}-filled`).setOrigin(0);
            const strokeSprite = this.add.image(position.x - 5 / 2, position.y - 5 / 2, `${id}-stroke`).setOrigin(0);
            const troopCount = this.add.text(position.x + filledSprite.width / 2, position.y + filledSprite.height / 2, territoryLogic.troops, {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            filledSprite.setData('logic', territoryLogic);
            filledSprite.setInteractive({ pixelPerfect: true });

            this.territorySprites[id] = {
                filled: filledSprite,
                stroke: strokeSprite,
                troops: troopCount
            };

            filledSprite.setTint(territoryLogic.color);
            strokeSprite.setTint(0xffff00);
        });
    }

    setupGameEventListeners() {
        this.gameState.on('game:troopCountChanged', (territoryId, newTroopCount) => {
            this.updateTroops(territoryId, newTroopCount);
        }, this);

        this.gameState.on('game:ownerChanged', (territoryId, newColor) => {
            this.updateTerritoryColor(territoryId, newColor);
        }, this);
        
        this.gameState.on('game:setMapInteractive', (isInteractive) => {
            if (isInteractive) {
                this.enableInteractivity();
            } else {
                this.disableInteractivity();
            }
        }, this);
    }
    
    updateTroops(territoryId, newTroopCount) {
        const troopText = this.territorySprites[territoryId].troops;
        troopText.setText(newTroopCount);
    }

    updateTerritoryColor(territoryId, newColor) {
        this.territorySprites[territoryId].filled.setTint(newColor);
    }

    setupInteractivity() {
        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setScale(1.1);
            const stroke = this.territorySprites[gameObject.getData('logic').id].stroke;
            stroke.setScale(1.1);
            stroke.setTint(0xffffff);
            const troopCount = this.territorySprites[gameObject.getData('logic').id].troops;
            troopCount.setScale(1.1);
            this.children.bringToTop(gameObject);
            this.children.bringToTop(stroke);
            this.children.bringToTop(troopCount); 
        });

        this.input.on('gameobjectout', (pointer, gameObject) => {
            gameObject.setScale(1);
            const stroke = this.territorySprites[gameObject.getData('logic').id].stroke;
            stroke.setScale(1);
            stroke.setTint(0xffff00);
            const troopCount = this.territorySprites[gameObject.getData('logic').id].troops;
            troopCount.setScale(1); 
        });

        this.input.on('gameobjectdown', (pointer, gameObject) => {
            this.gameState.emit('ui:territoryClicked', gameObject.getData('logic'));
        });
    }

    disableInteractivity() {
        Object.values(this.territorySprites).forEach(({ filled, stroke, troops }) => {
            stroke.setScale(1);
            troops.setScale(1);
            filled.setScale(1);
            filled.disableInteractive();
        }); 
    }

    enableInteractivity() {
        Object.values(this.territorySprites).forEach(({ filled, stroke, troops }) => {
            stroke.setScale(1);
            troops.setScale(1);
            filled.setScale(1);
            filled.setInteractive({ pixelPerfect: true });
        }); 
    }
}