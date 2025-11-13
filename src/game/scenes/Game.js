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
        this.highlightedAttacker = null;
        this.highlightedDefender = null;

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

            const territoryCenterX = position.x + (filledSprite.width / 2);
            const territoryCenterY = position.y + (filledSprite.height / 2);

            const counterBackground = this.add.image(territoryCenterX, territoryCenterY, 'army-counter-inner').setOrigin(0.5).setDepth(91);
            const counterStroke = this.add.image(territoryCenterX, territoryCenterY + 1, 'army-counter-stroke').setOrigin(0.5).setDepth(90);
            const troopCount = this.add.text(position.x + filledSprite.width / 2, position.y + filledSprite.height / 2, territoryLogic.troops, {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            })
            .setOrigin(0.5)
            .setDepth(92);

            filledSprite.setData('logic', territoryLogic);
            filledSprite.setInteractive({ pixelPerfect: true });

            this.territorySprites[id] = {
                filled: filledSprite,
                stroke: strokeSprite,
                counterBackground: counterBackground,
                counterStroke: counterStroke,
                troops: troopCount
            };

            filledSprite.setTint(territoryLogic.color);
            strokeSprite.setTint(0xffff00);

            counterBackground.setTint(territoryLogic.color);
            counterStroke.setTint(territoryLogic.color);
        });
    }

    setupGameEventListeners() {
        this.gameState.on('game:troopCountChanged', (territoryId) => {
            this.updateTroops(territoryId);
        }, this);

        this.gameState.on('game:ownerChanged', (territoryId) => {
            this.updateTerritoryColor(territoryId);
        }, this);
        
        this.gameState.on('game:setMapInteractive', (isInteractive) => {
            if (isInteractive) {
                this.enableInteractivity();
            } else {
                this.disableInteractivity();
            }
        }, this);

        this.gameState.on('game:attackerSelected', (territory) => {
            this.highlightAttacker(territory);
        }, this);
        this.gameState.on('game:defenderSelected', (territory) => {
            this.highlightDefender(territory);
        }, this);
        this.gameState.on('game:unselectAttacker', (territory) => {
            this.clearHighlights();
        }, this);
    }
    
    updateTroops(territoryId) {
        const troopText = this.territorySprites[territoryId].troops;
        troopText.setText(this.gameState.getTerritory(territoryId).getTroopCount());
    }

    updateTerritoryColor(territoryId) {
        const newColor = this.gameState.getTerritory(territoryId).owner.getColor();
        this.territorySprites[territoryId].filled.setTint(newColor);
    }

    highlightAttacker(territory){
        this.clearHighlights();

        this.highlightedAttacker = territory;
        const sprites = this.territorySprites[territory.id];
        sprites.stroke.setTint(0xff0000);
        sprites.filled.setScale(1.1);
        sprites.stroke.setScale(1.1);
        sprites.troops.setScale(1.1);

        this.children.bringToTop(sprites.filled);
        this.children.bringToTop(sprites.stroke);
        this.children.bringToTop(sprites.troops);
    }

    highlightDefender(territory) {
        this.highlightedDefender = territory;
        const sprites = this.territorySprites[territory.id];

        sprites.stroke.setTint(0x0000ff);
        sprites.filled.setScale(1.1);
        sprites.stroke.setScale(1.1);
        sprites.troops.setScale(1.1);

        this.children.bringToTop(sprites.filled);
        this.children.bringToTop(sprites.stroke);
        this.children.bringToTop(sprites.troops);
    }

    clearHighlights() {
        if (this.highlightedAttacker) {
            const sprites = this.territorySprites[this.highlightedAttacker.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.troops.setScale(1);
        }
        if (this.highlightedDefender) {
            const sprites = this.territorySprites[this.highlightedDefender.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.troops.setScale(1);
        }
        
        this.highlightedAttacker = null;
        this.highlightedDefender = null;
    }

    setupInteractivity() {
        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setScale(1.1);
            const stroke = this.territorySprites[gameObject.getData('logic').id].stroke;
            stroke.setScale(1.1);
            if (this.highlightedAttacker && gameObject.getData('logic').id !== this.highlightedAttacker.id){
                stroke.setTint(0xffffff);
            }
            const troopCount = this.territorySprites[gameObject.getData('logic').id].troops;
            troopCount.setScale(1.1);
            this.children.bringToTop(gameObject);
            this.children.bringToTop(stroke);
            this.children.bringToTop(troopCount); 
        });

        this.input.on('gameobjectout', (pointer, gameObject) => {
            const territoryLogic = gameObject.getData('logic');
            const sprites = this.territorySprites[territoryLogic.id];

            if (territoryLogic !== this.highlightedAttacker && territoryLogic !== this.highlightedDefender) {
                sprites.filled.setScale(1);
                sprites.stroke.setScale(1);
                sprites.troops.setScale(1);
                sprites.stroke.setTint(0xffff00);
            } else if (territoryLogic === this.highlightedAttacker) {
                sprites.stroke.setTint(0xff0000);
            } else if (territoryLogic === this.highlightedDefender) {
                sprites.stroke.setTint(0x0000ff);
            }
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