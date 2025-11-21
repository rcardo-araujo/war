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
        this.gameState.emit('scene:ready');
    }

    update() {
    }

    drawMap() {
        const mapData = this.cache.json.get('mapData');

        const counterTexture = this.textures.get('army-counter-stroke');
        const counterWidth = counterTexture.getSourceImage().width;
        const counterHeight = counterTexture.getSourceImage().height;

        mapData.territories.forEach(territoryData => {
            const { id, name, position } = territoryData;
            const territoryLogic = this.gameState.mapManager.getTerritory(id);

            const filledSprite = this.add.image(position.x, position.y, `${id}-filled`).setOrigin(0);
            const strokeSprite = this.add.image(position.x - 5 / 2, position.y - 5 / 2, `${id}-stroke`).setOrigin(0);

            const territoryCenterX = position.x + (filledSprite.width / 2);
            const territoryCenterY = position.y + (filledSprite.height / 2);

            const counterX = territoryCenterX - (counterWidth / 2);
            const counterY = territoryCenterY - (counterHeight / 2);

            const counterStroke = this.add.image(0, 0, 'army-counter-stroke').setOrigin(0);
            const counterBackground = this.add.image(2, 2, 'army-counter-inner').setOrigin(0);

            const troopCount = this.add.text(counterWidth / 2, counterHeight / 2, territoryLogic.troops, {
                fontSize: '24px',
                color: '#ffffff',
                fontStyle: 'bold'
            })
            .setOrigin(0.5)

            const counterContainer = this.add.container(counterX, counterY, [counterStroke, counterBackground, troopCount]);
            counterContainer.setDepth(90);
            troopCount.setDepth(1);

            filledSprite.setData('logic', territoryLogic);
            filledSprite.setInteractive({ pixelPerfect: true });

            this.territorySprites[id] = {
                filled: filledSprite,
                stroke: strokeSprite,
                counter: counterContainer,
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
        this.gameState.on('game:attackResult', ({winnerId, loserId}) => {
            this.flashAttackResult(winnerId, loserId);
        })

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
        this.flashTerritory(territoryId);
    }

    updateTerritoryColor(territoryId) {
        const newColor = this.gameState.getTerritory(territoryId).owner.getColor();

        const sprites = this.territorySprites[territoryId];

        sprites.filled.setTint(newColor);

        const counterStroke = sprites.counter.list[0];
        const counterBackground = sprites.counter.list[1];

        counterBackground.setTint(newColor);
        counterStroke.clearTint()
        counterStroke.setTint(newColor);
    }

    flashTerritory(territoryId){
        const sprites = this.territorySprites[territoryId];
        const originalColor = this.gameState.getTerritory(territoryId).owner.getColor();
        this.tweens.add({
            targets: sprites.filled,
            alpha: {from: 1, to: 0.3},
            duration: 150,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        });
        this.tweens.add({
            targets: sprites.counter,
            scale: {from: 1, to: 1.3},
            duration: 150,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeInOut'
        })

        sprites.stroke.setTint(COLORS.green);
        this.time.delayedCall(900, () => {
            sprites.stroke.setTint(COLORS.yellow);
        })


    }

    flashAttackResult(winnerId, loserId){
        const winnerSprites = this.territorySprites[winnerId];
        const loserSprites = this.territorySprites[loserId];


        winnerSprites.stroke.setTint(COLORS.green);
        winnerSprites.filled.setTint(COLORS.green);
        this.tweens.add({
            targets: winnerSprites.filled,
            alpha: {from: 1, to: 0.6},
            duration: 100,
            yoyo: true,
            repeat: 2
        });


        loserSprites.stroke.setTint(COLORS.red);
        loserSprites.filled.setTint(COLORS.red);
        this.tweens.add({
            targets: loserSprites.filled,
            alpha: {from: 1, to: 0.6},
            duration: 100,
            yoyo: true,
            repeat: 2
        })


        this.time.delayedCall(600, () => {
            const winnerCurrentColor = this.gameState.getTerritory(winnerId).owner.getColor();
            const loserCurrentColor = this.gameState.getTerritory(loserId).owner.getColor();

            winnerSprites.stroke.setTint(COLORS.yellow);
            winnerSprites.filled.setTint(winnerCurrentColor);
            loserSprites.stroke.setTint(COLORS.yellow);
            loserSprites.filled.setTint(loserCurrentColor);
        })
    }

    highlightAttacker(territory){
        this.clearHighlights();

        this.highlightedAttacker = territory;
        const sprites = this.territorySprites[territory.id];

        sprites.stroke.setTint(0xff0000);
        sprites.filled.setScale(1.1);
        sprites.counter.setScale(1.1);

        this.children.bringToTop(sprites.filled);
        this.children.bringToTop(sprites.stroke);
        this.children.bringToTop(sprites.counter);
    }

    highlightDefender(territory) {
        this.highlightedDefender = territory;
        const sprites = this.territorySprites[territory.id];

        sprites.stroke.setTint(0x0000ff);
        sprites.filled.setScale(1.1);
        sprites.stroke.setScale(1.1);
        sprites.counter.setScale(1.1);

        this.children.bringToTop(sprites.filled);
        this.children.bringToTop(sprites.stroke);
        this.children.bringToTop(sprites.counter);
    }

    clearHighlights() {
        if (this.highlightedAttacker) {
            const sprites = this.territorySprites[this.highlightedAttacker.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.counter.setScale(1);
        }
        if (this.highlightedDefender) {
            const sprites = this.territorySprites[this.highlightedDefender.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.counter.setScale(1);
        }
        
        this.highlightedAttacker = null;
        this.highlightedDefender = null;
    }

    setupInteractivity() {
        this.input.on('gameobjectover', (pointer, gameObject) => {
            const sprites = this.territorySprites[gameObject.getData('logic').id];
            
            gameObject.setScale(1.1);
            sprites.stroke.setScale(1.1);
            
            if (this.highlightedAttacker && gameObject.getData('logic').id !== this.highlightedAttacker.id){
                sprites.stroke.setTint(0xffffff);
            }
            
            sprites.counter.setScale(1.1)

            this.children.bringToTop(gameObject);
            this.children.bringToTop(sprites.stroke);
            this.children.bringToTop(sprites.counter);
        });

        this.input.on('gameobjectout', (pointer, gameObject) => {
            const territoryLogic = gameObject.getData('logic');
            const sprites = this.territorySprites[territoryLogic.id];

            if (territoryLogic !== this.highlightedAttacker && territoryLogic !== this.highlightedDefender) {
                sprites.filled.setScale(1);
                sprites.stroke.setScale(1);
                sprites.counter.setScale(1);
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
        Object.values(this.territorySprites).forEach(({ filled, stroke, counter, troops }) => {
            counter.setScale(1);
            stroke.setScale(1);
            filled.setScale(1);
            filled.disableInteractive();
        }); 
    }

    enableInteractivity() {
        Object.values(this.territorySprites).forEach(({ filled, stroke, counter, troops }) => {
            counter.setScale(1);
            stroke.setScale(1);
            filled.setScale(1);
            filled.setInteractive({ pixelPerfect: true });
        }); 
    }
}