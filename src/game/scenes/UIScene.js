import { Scene } from 'phaser';

export class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    preload() {
    }

    init(data) {
        this.gameStateManager = data.gameStateManager;
    }

    create() {
        const padding = 20;
        const bottomY = this.cameras.main.height - padding;
        const leftX = padding;

        let currentPlayer = this.gameStateManager.getCurrentPlayer();
        this.label = this.add.text(leftX, bottomY, 'Turno do Jogador #' + currentPlayer.name, {
            font: '15px Arial',
            fill: '#ffffff',
            backgroundColor: `#${currentPlayer.color.toString(16).padStart(6, '0')}`,
            padding: { x: 10, y: 10 },
            align: 'center'
        }).setOrigin(0, 1);

        let button = this.add.text(leftX, bottomY - this.label.height, 'Próximo turno', {
            font: '12px Arial',
            fill: '#ffffff',
            backgroundColor: '#007bff',
            padding: { x: 8, y: 8 },
            align: 'center'
        })
            .setOrigin(0, 1)
            .setInteractive();

        button.on('pointerdown', () => {
            this.gameStateManager.endCurrentTurn();
        });

        this.gameStateManager.TurnManager.on('nextTurn', (turn) => {
            this.label.setText("Turno do jogador # " + turn.getCurrentPlayer().name);
            this.label.setStyle({
                backgroundColor: `#${turn.getCurrentPlayer().color.toString(16).padStart(6, '0')}`
            });
        });

        this.setupEvents();
    }


    setupEvents() {
        this.gameStateManager.on('territorySelected', (territory, currentPlayer) => {
            this.showTroopInput(territory, currentPlayer);
        });
    }

    showTroopInput(territory, currentPlayer) {
        console.log(currentPlayer.name);
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const html = `
    <div style="
        background: rgba(0,0,0,0.8);
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        color: white;
        font-family: Arial;
    ">
        <p>Território: <strong>${territory.name}</strong></p>
        <p>Tropas disponíveis: <strong>${currentPlayer.availableTroops}</strong></p>
        <p>Quantas tropas colocar?</p>
        <input id="troops" type="number" min="1" max="${currentPlayer.availableTroops}" value="1" style="width: 60px; text-align: center;">
        <br><br>
        <button id="confirmButton">Confirmar</button>
        <button id="cancelButton">Cancelar</button>
    </div>
    `;

        const inputContainer = this.add.dom(centerX, centerY).createFromHTML(html);

        inputContainer.addListener('click');
        inputContainer.on('click', (event) => {
            if (event.target.id === 'confirmButton') {
                const value = parseInt(inputContainer.getChildByID('troops').value, 10);

                if (!isNaN(value) && value <= currentPlayer.availableTroops) {
                    this.gameStateManager.emit('troopsAllocated', value);
                    inputContainer.destroy();
                } else {
                    alert(`Digite um número válido entre 1 e ${currentPlayer.availableTroops}!`);
                }
            } else if (event.target.id === 'cancelButton') {
                this.gameStateManager.emit('troopsAllocated', 0);
                inputContainer.destroy();
            }
        });
    }


    update(time, delta) {
    }
}