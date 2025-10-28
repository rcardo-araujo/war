    import { Scene } from 'phaser';
    import { TURN_PHASES } from '../managers/TurnManager';

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
            
            this.button = this.add.text(leftX, bottomY - this.label.height, 'Próximo turno', {
                font: '12px Arial',
                fill: '#ffffff',
                backgroundColor: '#007bff',
                padding: { x: 8, y: 8 },
                align: 'center'
            })
            .setOrigin(0, 1)
            .setInteractive();

            this.phaseText = this.add.text(10, 10, `Fase: `);

            this.button.on('pointerdown', () => {
                this.gameStateManager.emit('ui:endPhaseClicked');
            });

            this.setupEvents();
            this.updateButtonText(this.gameStateManager.getCurrentPhase());
            this.updatePhaseText(this.gameStateManager.getCurrentPhase());
        }

        setupEvents() {
            this.gameStateManager.on('game:nextTurn', this.updateTurnLabel, this);
            this.gameStateManager.on('game:phaseChanged', this.updateButtonText, this);
            this.gameStateManager.on('game:phaseChanged', this.updatePhaseText, this);
            this.gameStateManager.on('game:error', (message) => {
                alert(message);
            }, this);
            this.gameStateManager.on('territorySelected', (territory, currentPlayer) => {
                this.showTroopInput(territory, currentPlayer);
            });
        }

        updateTurnLabel(newPlayer) {
            this.label.setText("Turno do jogador # " + newPlayer.name);
            this.label.setStyle({
                backgroundColor: `#${newPlayer.color.toString(16).padStart(6, '0')}`
            });
        }

        updateButtonText(newPhase) {
            if (newPhase === TURN_PHASES.FIRST_REINFORCEMENT || newPhase === TURN_PHASES.END) {
                this.button.setText('Finalizar turno');
            } else {
                this.button.setText('Próxima fase');
            }
        }

        updatePhaseText(newPhase) {
            this.phaseText.setText(`Fase: ${newPhase}`);
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
                        this.gameStateManager.emit('troopsAllocated', { troops: value, territory: territory });
                        inputContainer.destroy();
                    } else {
                        this.gameStateManager.emit('game:error', `Digite um número válido entre 1 e ${currentPlayer.availableTroops}!`, this);
                    }
                } else if (event.target.id === 'cancelButton') {
                    this.gameStateManager.emit('troopsAllocated', { troops: 0, territory: territory });
                    inputContainer.destroy();
                }
            });
        }

        update(time, delta) {
        }
    }