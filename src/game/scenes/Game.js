import { Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig';
import GameStateManager from '../managers/GameStateManager';
import { COLORS } from '../config/colors';

const highlightTerritoryNumber = Object.freeze({
    FIRST: "FIRST",
    SECOND: "SECOND"
});

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
        this.highlightedTerritories = [];
        this.highlightedFirst = null;
        this.highlightedSecond = null;

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
            this.highlightTerritorySelection(territory, 0xff0000, highlightTerritoryNumber.FIRST);
        }, this);
        this.gameState.on('game:defenderSelected', (territory) => {
            this.highlightTerritorySelection(territory, 0x0000ff, highlightTerritoryNumber.SECOND);
        }, this);
        this.gameState.on('game:unselectAttacker', (territory) => {
            this.clearHighlights();
        }, this);


        this.gameState.on('game:originSelected', (territory) => {
            this.highlightTerritorySelection(territory, 0xff0000, highlightTerritoryNumber.FIRST);
            for (const terr of territory.getNeighborIds()) {
                let t = this.gameState.getTerritory(terr);
                if (t.owner === this.gameState.getCurrentPlayer()) {
                    this.highlightTerritory(t, 0x00ff00);
                }
            }
        }, this);
        this.gameState.on('game:destinationSelected', (territory) => {
            this.highlightTerritorySelection(territory, 0x0000ff, highlightTerritoryNumber.SECOND);
        }, this);
        this.gameState.on('game:unselectOrigin', (territory) => {
            this.clearHighlights();
        }, this);

        this.gameState.on('game:phaseChanged', (newPhase) => {
            this.clearHighlights();
        });
    }

    updateTroops(territoryId) {
        const troopText = this.territorySprites[territoryId].troops;
        troopText.setText(this.gameState.getTerritory(territoryId).getTroopCount());
    }

    updateTerritoryColor(territoryId) {
        const newColor = this.gameState.getTerritory(territoryId).owner.getColor();
        this.territorySprites[territoryId].filled.setTint(newColor);
    }

    highlightTerritorySelection(territory, color, territoryNumber) {
        const sprites = this.territorySprites[territory.id];

        this.highlightTerritory(territory, color);
        if (territoryNumber === highlightTerritoryNumber.FIRST) {
            this.highlightedFirst = territory;
        }
        else if (territoryNumber === highlightTerritoryNumber.SECOND) {
            this.highlightedSecond = territory;
        }
    }

    highlightTerritory(territory, color) {
        this.highlightedTerritories.push(territory);
        const sprites = this.territorySprites[territory.id];
        sprites.stroke.setTint(color);

        this.children.bringToTop(sprites.filled);
        this.children.bringToTop(sprites.stroke);
        this.children.bringToTop(sprites.troops);
    }

    clearHighlights() {
        if (this.highlightedFirst) {
            const sprites = this.territorySprites[this.highlightedFirst.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.troops.setScale(1);
        }
        if (this.highlightedSecond) {
            const sprites = this.territorySprites[this.highlightedSecond.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.troops.setScale(1);
        }

        this.highlightedFirst = null;
        this.highlightedSecond = null;

        for (const territory of this.highlightedTerritories) {
            const sprites = this.territorySprites[territory.id];
            sprites.stroke.setTint(0xffff00);
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.troops.setScale(1);
        }

        this.highlightedTerritories.length = 0
    }

    setupInteractivity() {
        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setScale(1.1);
            const stroke = this.territorySprites[gameObject.getData('logic').id].stroke;
            stroke.setScale(1.1);
            const troopCount = this.territorySprites[gameObject.getData('logic').id].troops;
            troopCount.setScale(1.1);
            this.children.bringToTop(gameObject);
            this.children.bringToTop(stroke);
            this.children.bringToTop(troopCount);
        });

        this.input.on('gameobjectout', (pointer, gameObject) => {
            const territoryLogic = gameObject.getData('logic');
            const sprites = this.territorySprites[territoryLogic.id];
            sprites.filled.setScale(1);
            sprites.stroke.setScale(1);
            sprites.troops.setScale(1);

            if ((this.highlightedFirst != null && territoryLogic.id === this.highlightedFirst.id) || (this.highlightedSecond != null &&
                territoryLogic.id === this.highlightedSecond.id)) {
                sprites.filled.setScale(1.1);
                sprites.stroke.setScale(1.1);
                sprites.troops.setScale(1.1);
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