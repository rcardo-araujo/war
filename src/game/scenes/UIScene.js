import { Scene } from 'phaser';
import { TURN_PHASES } from '../managers/TurnManager';
import { GameHUD } from '../ui/GameHUD';

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
        this.hud = new GameHUD(this);

        const initialPhase = this.gameStateManager.getCurrentPhase();
        this.hud.updatePhase(initialPhase);

        const padding = 20;
        const bottomY = this.cameras.main.height - padding;
        const leftX = padding;

        let currentPlayer = this.gameStateManager.getCurrentPlayer();

        this.phaseText = this.add.text(10, 10, `Fase: `);

        this.confirmButton = null;

        this.hud.updateColor(currentPlayer.color);

        this.createTargetButton();        
        this.setupEvents();
        this.updatePhaseText(this.gameStateManager.getCurrentPhase());
    }

    setupEvents() {
        this.gameStateManager.on('game:phaseChanged', (newPhase) => {
            this.hud.updatePhase(newPhase);
        }, this);
        this.hud.nextButton.on('pointerdown', () => {
            this.gameStateManager.emit('ui:endPhaseClicked');
        });
        this.gameStateManager.on('game:phaseChanged', this.updatePhaseText, this);
        this.gameStateManager.on('game:error', (message) => {
            alert(message);
        }, this);
        this.gameStateManager.on('territorySelected', (territory, currentPlayer) => {
            this.showTroopInput(territory, currentPlayer);
        });


        this.gameStateManager.on('game:defenderSelected', (defenderTerritory, attackerTerritory) => {
            this.showConfirmButton("Confirm Attack", () => {
                this.gameStateManager.emit('game:attackConfirmed', defenderTerritory, attackerTerritory, this);
            })
        }, this);
        this.gameStateManager.on('game:unselectAttacker', (territory) => {
            this.hideConfirmButton();
        }, this);
        this.gameStateManager.on('game:attackConfirmed', (defenderTerritory, attackerTerritory) => {
            this.hideConfirmButton();
            this.showAttackInput(attackerTerritory, defenderTerritory);
        }, this);

        this.gameStateManager.on('game:nextTurn', (player) => {
            this.hud.updateColor(player.color); 
        }, this);
        this.gameStateManager.on('game:destinationSelected', (destinationTerritory, originTerritory) => {
            this.showConfirmButton("Confirm Strategy", () => {
                this.gameStateManager.emit('game:strategyConfirmed', destinationTerritory, originTerritory, this);
            })
        }, this);
        this.gameStateManager.on('game:unselectOrigin', (territory) => {
            this.hideConfirmButton();
        }, this);
        this.gameStateManager.on('game:strategyConfirmed', (destinationTerritory, originTerritory) => {
            this.hideConfirmButton();
            this.showStrategyInput(originTerritory, destinationTerritory);
        }, this);
        this.gameStateManager.on('game:nextTurn', (newPlayer) => {
            if (this.targetElipse && newPlayer && newPlayer.color) {
                this.targetElipse.setTint(newPlayer.color);
            }
        }, this);
    }

    updatePhaseText(newPhase) {
        this.phaseText.setText(`Fase: ${newPhase}`);
    }

    showTroopInput(territory, currentPlayer) {
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
                    <p>Tropas disponíveis: <strong>${currentPlayer.availableTroops+currentPlayer.getContinentBonus(territory)}</strong></p>
                    <p>Quantas tropas colocar?</p>
                    <input id="troops" type="number" min="1" max="${currentPlayer.availableTroops+currentPlayer.getContinentBonus(territory)}" value="1" style="width: 60px; text-align: center;">
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

                    if (!isNaN(value) && value <= (currentPlayer.availableTroops+currentPlayer.getContinentBonus(territory))) {
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

    showAttackInput(attackerTerritory, defenderTerritory) {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const maxAttackDice = Math.min(3, attackerTerritory.troops - 1);

        const html = `
            <div style="
                background: rgba(0,0,0,0.8);
                padding: 20px;
                border-radius: 10px;
                text-align: center;
                color: white;
                font-family: Arial;
            ">
                <p style="font-size: 18px; margin-top: 0;"><strong>ATAQUE</strong></p>
                <p>De: <strong>${attackerTerritory.name}</strong> (${attackerTerritory.troops} tropas)</p>
                <p>Para: <strong>${defenderTerritory.name}</strong> (${defenderTerritory.troops} tropas)</p>
                <hr style="border-color: #555;">
                <p>Atacar com quantas tropas (dados)?</p>
                
                <input 
                    id="attack-troops-input" 
                    type="number" 
                    min="1" 
                    max="${maxAttackDice}" 
                    value="${maxAttackDice}" 
                    style="width: 60px; text-align: center;"
                >
                
                <br><br>
                <button id="confirmAttackButton">Atacar!</button>
                <button id="cancelAttackButton">Cancelar</button>
            </div>
            `;

        const inputContainer = this.add.dom(centerX, centerY).createFromHTML(html);

        inputContainer.addListener('click');
        inputContainer.on('click', (event) => {

            if (event.target.id === 'confirmAttackButton') {
                const value = parseInt(inputContainer.getChildByID('attack-troops-input').value, 10);
                if (!isNaN(value) && value >= 1 && value <= maxAttackDice) {
                    this.gameStateManager.emit('game:attackCommitted', {
                        attackDice: value,
                        attacker: attackerTerritory,
                        defender: defenderTerritory
                    });
                    inputContainer.destroy();

                } else {
                    this.gameStateManager.emit('game:error', `Número inválido. Deve ser entre 1 e ${maxAttackDice}.`, this);
                }

            } else if (event.target.id === 'cancelAttackButton') {
                this.gameStateManager.emit('game:attackCommitted', {
                    attackDice: 0,
                    attacker: attackerTerritory,
                    defender: defenderTerritory
                });
                inputContainer.destroy();

            }
        });
    }

    showStrategyInput(originTerritory, destinationTerritory) {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        let availableTroops = this.gameStateManager.movementController.getAvailableTroops(originTerritory);

        const html = `
                <div style="
                    background: rgba(0,0,0,0.8);
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                    color: white;
                    font-family: Arial;
                ">
                    <p>Território: <strong>${originTerritory.name}</strong></p>
                    <p>Tropas disponíveis: <strong>${availableTroops}</strong></p>
                    <p>Quantas tropas colocar?</p>
                    <input id="troops" type="number" min="1" max="${availableTroops}" value="1" style="width: 60px; text-align: center;">
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

                if (!isNaN(value) && value <= availableTroops) {
                    this.gameStateManager.emit('game:strategyCommitted', {
                        troopsAllocated: value,
                        origin: originTerritory,
                        destination: destinationTerritory
                    });
                    inputContainer.destroy();
                } else {
                    this.gameStateManager.emit('game:error', `Digite um número válido entre 1 e ${availableTroops}!`, this);
                }
            } else if (event.target.id === 'cancelButton') {
                this.gameStateManager.emit('game:strategyCommitted', {
                    troopsAllocated: 0,
                    origin: originTerritory,
                    destination: destinationTerritory
                });
                inputContainer.destroy();
            }
        });
    }

    showConfirmButton(text, callback) {
        const centerX = this.cameras.main.centerX;
        const bottomY = this.cameras.main.height - 20;

        this.confirmButton = this.add.text(centerX, bottomY, text, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#dc3545',
            padding: { x: 10, y: 10 },
            align: 'center'
        })
            .setOrigin(0, 1)
            .setInteractive();

        this.confirmButton.on('pointerdown', callback);
    }

    hideConfirmButton() {
        if (this.confirmButton) {
            this.confirmButton.destroy();
            this.confirmButton = null;
        }
    }

    createTargetButton() {
        const padding = 60;
        const x = this.cameras.main.width - padding;
        const y = this.cameras.main.height - padding;

        this.targetContainer = this.add.container(x, y);

        const elipse = this.add.image(0, 0, 'target-elipse').setOrigin(0.5);
        const aim = this.add.image(0, 0, 'target-aim').setOrigin(0.5);

        const currentPlayer = this.gameStateManager.getCurrentPlayer();
        if (currentPlayer && currentPlayer.color) {
            elipse.setTint(currentPlayer.color);
        }
        this.targetElipse = elipse;

        this.targetContainer.add([elipse, aim]);
        this.targetContainer.setDepth(10000);

        try {
            elipse.setInteractive({ pixelPerfect: true });
        } catch (e) {
            elipse.setInteractive();
        }
        aim.setInteractive({ pixelPerfect: true });

        const onClick = () => this.showObjectiveModal();
        elipse.on('pointerdown', onClick);
        aim.on('pointerdown', onClick);
    }

    showObjectiveModal() {
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.gameStateManager.emit('game:setMapInteractive', false);

        this.modalOverlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.65).setOrigin(0).setDepth(10001).setInteractive();

        const card = this.add.image(w / 2, h / 2, 'objective-card').setDepth(10002);

        const player = this.gameStateManager.getCurrentPlayer();
        let objectiveText = 'Objetivo não disponível';
        if (player && player.objective) {
            objectiveText = player.objective.description || player.objective.main || player.objective.main?.text || objectiveText;
        }

        const displayW = card.displayWidth || card.width;
        const textStyle = {
            font: '18px JetBrainsMono',
            color: '#ffffff',
            align: 'center',
            wordWrap: { width: Math.max(100, displayW - 40) }
        };

        this.objectiveText = this.add.text(w / 2, h / 2, objectiveText, textStyle).setOrigin(0.5).setDepth(10003);

        const maxW = w - 80;
        const maxH = h - 80;
        if (card.width > maxW || card.height > maxH) {
            const scale = Math.min(maxW / card.width, maxH / card.height);
            card.setScale(scale);
        }

        this.modalOverlay.on('pointerdown', () => this.hideObjectiveModal());
    }

    hideObjectiveModal() {
        if (this.modalOverlay) {
            this.modalOverlay.destroy();
            this.modalOverlay = null;
        }
        const card = this.children.getByName && this.children.getByName('objective-card');
        this.children.list.slice().forEach(child => {
            if (child.texture && child.texture.key === 'objective-card') child.destroy();
        });

        if (this.objectiveText) {
            this.objectiveText.destroy();
            this.objectiveText = null;
        }

        this.gameStateManager.emit('game:setMapInteractive', true);
    }

    update(time, delta) {
    }
}