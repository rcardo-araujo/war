import { Scene } from 'phaser';

export class UIScene extends Phaser.Scene {
    constructor ()
    {
        super({ key: 'UIScene' });
    }

    preload ()
    {
    }

    init(data) {
        this.gameStateManager = data.gameStateManager;
    }

    create ()
    {
        this.label = this.add.text(400, 100, 'Turno do Jogador #', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#ff0000', // Cor de fundo vermelha
            padding: { x: 10, y: 10 },  // Preenchimento do texto
            align: 'center'             // Alinha o texto ao centro
        }).setOrigin(0.5, 1);

        let button = this.add.text(400, 300, 'Próximo turno', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#007bff'
        })
        .setOrigin(0.5)
        .setInteractive(); 

        button.on('pointerdown', () => {
            this.gameStateManager.turnManager.nextTurn();
        });

        this.gameStateManager.turnManager.on('nextTurn', (turn) => {
            this.label.setText("Turno do jogador # " + turn.getCurrentPlayer().name);
        });
    }

    update (time, delta)
    {
    }
}