import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameConfig } from '../config/gameConfig';
import GameStateManager from '../managers/GameStateManager';
import { Colors } from '../config/colors';
import Player from '../gameObjects/Player';

export class Game extends Scene
{
    constructor ()
    {
        super('Game');
    }

    create ()
    {
        this.gameState = new GameStateManager(this);

        // UI is in a different scene that overlaps
        this.scene.launch("UIScene", {gameStateManager: this.gameState});

        this.add.image(0, 0, 'board-background')
            .setOrigin(0)
            .setDisplaySize(GameConfig.width, GameConfig.height);

        this.territorySprites = {};

        this.drawMap();
        this.setupInteractivity();
    }
    
    update ()
    { 
        
    }
    
    changeScene ()
    {
        this.scene.start('GameOver');
    }
    
    drawMap () {
        const mapData = this.cache.json.get('mapData');

        mapData.territories.forEach(territoryData => {
            const { id, name, position } = territoryData;
            const territoryLogic = this.gameState.territories[id];

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
                toops: troopCount
            };
            
            filledSprite.setTint(territoryLogic.color);
            strokeSprite.setTint(0xffff00);
        })
    }

    setupInteractivity () {
        this.input.on('gameobjectover', (pointer, gameObject) => {
            gameObject.setScale(1.1);
            const stroke = this.territorySprites[gameObject.getData('logic').id].stroke;
            stroke.setScale(1.1);
            stroke.setTint(0xffffff);
            const troopCount = this.territorySprites[gameObject.getData('logic').id].toops;
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
            const troopCount = this.territorySprites[gameObject.getData('logic').id].toops;
            troopCount.setScale(1);
        });
    }

}
