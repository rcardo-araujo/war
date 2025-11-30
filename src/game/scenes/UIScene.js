import { Scene } from 'phaser';
import { TURN_PHASES } from '../managers/TurnManager';
import { PLAYER_TYPES } from '../config/playerTypes'; 
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
        const currentPlayer = this.gameStateManager.getCurrentPlayer();

        this.hud.updatePhase(initialPhase);

        if(currentPlayer) {
            this.hud.updateColor(currentPlayer.color);
            const isBot = currentPlayer.type === PLAYER_TYPES.BOT;
            this.setButtonInteractive(!isBot);
        }

        this.confirmButton = null;
        this.createTargetButton();

        this.setupEvents();
    }

    setupEvents() {
        this.hud.nextButton.on('pointerdown', () => {
            this.gameStateManager.emit('ui:endPhaseClicked');
        });

        this.gameStateManager.on('game:phaseChanged', (newPhase) => {
            this.hud.updatePhase(newPhase);
        }, this);

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
          
            this.hud.updateColor(newPlayer.color);
            
            if (this.targetElipse && newPlayer && newPlayer.color) {
                this.targetElipse.setTint(newPlayer.color);
            }
        }, this);

        this.gameStateManager.on('game:setBotTurnActive', (isActive) => {
            this.setButtonInteractive(!isActive);
        }, this);

        this.gameStateManager.on('game:objectiveAchieved', ({ player, objective }) => {
            this.showVictoryModal(player, objective);
        }, this);
    }

    setButtonInteractive(isInteractive) {
        if (!this.hud || !this.hud.nextButton) return;

        if (isInteractive) {
            this.hud.nextButton.setInteractive();
            this.hud.nextButton.setAlpha(1);
        } else {
            this.hud.nextButton.disableInteractive();
            this.hud.nextButton.setAlpha(0.5);
        }
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
        const bottomY = 20;

        this.confirmButton = this.add.text(centerX, bottomY, text, {
            font: '16px Arial',
            fill: '#ffffff',
            backgroundColor: '#dc3545',
            padding: { x: 10, y: 10 },
            align: 'center'
        })
            .setOrigin(0.5, 0)
            .setInteractive();

        this.confirmButton.on('pointerdown', callback);
    }

    hideConfirmButton() {
        if (this.confirmButton) {
            this.confirmButton.destroy();
            this.confirmButton = null;
        }
    }

    showVictoryModal(player, objective) {
        this.gameStateManager.emit("game:setMapInteractive", false);

        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        this.victoryOverlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.92)
            .setOrigin(0)
            .setDepth(30000)
            .setInteractive();

        const cardW = Math.min(760, w - 120);
        const cardH = Math.min(600, h - 200);
        const cardX = w / 2 - cardW / 2;
        const cardY = h / 2 - cardH / 2;
        const radius = 18;

        const winnerColor = player?.color ?? 0x007bff;

        const cardGraphics = this.add.graphics().setDepth(30001);
        cardGraphics.fillStyle(0x000000, 0.5);
        cardGraphics.lineStyle(4, winnerColor, 1);
        cardGraphics.fillRoundedRect(cardX, cardY, cardW, cardH, radius);
        cardGraphics.strokeRoundedRect(cardX, cardY, cardW, cardH, radius);
        this.victoryCardBg = cardGraphics;

        const PADDING_TOP = 28;
        const SIDE_PADDING = 40;
        const SPACING = 36;

        let cursorY = cardY + PADDING_TOP;

        this.victoryTitle = this.add.text(
            w / 2,
            cursorY,
            "⟡ VITÓRIA ⟡",
            {
                font: "30px JetBrainsMono",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: cardW - SIDE_PADDING * 2 }
            }
        )
            .setOrigin(0.5, 0)
            .setDepth(30003);

        let bounds = this.victoryTitle.getBounds();
        cursorY = bounds.y + bounds.height + SPACING;

        const msg = `O jogador ${player?.name ?? "Jogador"} alcançou seu objetivo e venceu a partida!`;
        this.victoryMessage = this.add.text(
            w / 2,
            cursorY,
            msg,
            {
                font: "18px JetBrainsMono",
                color: "#ffffff",
                align: "center",
                wordWrap: { width: cardW - SIDE_PADDING * 2 }
            }
        )
            .setOrigin(0.5, 0)
            .setDepth(30003);

        bounds = this.victoryMessage.getBounds();
        cursorY = bounds.y + bounds.height + SPACING;

        if (objective && (objective.description || objective.main)) {
            const obj = objective.description ?? objective.main ?? "";
            this.victoryObjective = this.add.text(
                w / 2,
                cursorY,
                obj,
                {
                    font: "16px JetBrainsMono",
                    color: "#cccccc",
                    align: "center",
                    wordWrap: { width: cardW - SIDE_PADDING * 2 }
                }
            )
                .setOrigin(0.5, 0)
                .setDepth(30003);

            bounds = this.victoryObjective.getBounds();
            cursorY = bounds.y + bounds.height + SPACING;
        }

        const contentHeight = cursorY - (cardY + PADDING_TOP);
        const freeSpace = cardH - (PADDING_TOP * 2) - contentHeight;
        if (freeSpace > 0) {
            const offset = Math.floor(freeSpace / 2);
            this.victoryTitle.y += offset;
            this.victoryMessage.y += offset;
            if (this.victoryObjective) this.victoryObjective.y += offset;
        }


        const BUTTON_WIDTH = 280;
        const BUTTON_HEIGHT = 48;
        const BUTTON_RADIUS = 12;

        const buttonBottomMargin = 32;
        const btnY = cardY + cardH - BUTTON_HEIGHT - buttonBottomMargin;

        this.victoryReturnBg = this.add.graphics().setDepth(30004);
        this.victoryReturnBg.fillStyle(winnerColor, 0.75); 
        this.victoryReturnBg.fillRoundedRect(
            w / 2 - BUTTON_WIDTH / 2,
            btnY,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            BUTTON_RADIUS
        );

        this.victoryReturn = this.add.text(
            w / 2,
            btnY + BUTTON_HEIGHT / 2,
            'Voltar ao menu inicial',
            {
                font: '18px JetBrainsMono',
                color: '#ffffff'
            }
        )
            .setOrigin(0.5)
            .setDepth(30005)
            .setInteractive({ useHandCursor: true });

        this.victoryReturn.on('pointerdown', () => {
            try {
                this.scene.stop('Game');
            } catch (e) { }
            this.scene.start('MainMenu');
        });
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