import { TURN_PHASES } from './TurnManager';
import { executeCombat } from '../utils/diceRoller';

export default class GameController {
    constructor(gameStateManager) {
        this.gsm = gameStateManager;
        this.setupEventListeners();
        const firstPlayer = this.gsm.playerManager.getPlayers()[0];
        this.gsm.playerManager.calculateReinforcements(firstPlayer);
        this.attackTerritories = {
            attacker: null,
            defender: null
        }
    }

    setupEventListeners() {
        this.gsm.on('ui:endPhaseClicked', this.handleEndPhaseRequest, this);
        this.gsm.on('troopsAllocated', this.handleTroopsAllocated, this);
        this.gsm.on('ui:territoryClicked', this.handleTerritoryClick, this);

        this.gsm.on('game:attackConfirmed', this.handleAttackConfirm, this);
        this.gsm.on('game:attackCommitted', this.onAttackCommit, this);

        this.gsm.turnManager.on('phaseChanged', this.onPhaseChanged, this);
        this.gsm.turnManager.on('nextTurn', this.onNextTurn, this);
    }

    handleEndPhaseRequest() {
        const player = this.gsm.getCurrentPlayer();
        const phase = this.gsm.getCurrentPhase();

        if (player.availableTroops > 0 &&
            (phase === TURN_PHASES.REINFORCEMENT ||
             phase === TURN_PHASES.FIRST_REINFORCEMENT)
        ) {
            this.gsm.emit('game:error', `Você ainda tem ${player.availableTroops} tropas para alocar!`);
            return;
        }

        this.gsm.turnManager.endPhase();
    }

    handleTroopsAllocated({ troops, territory }) {
        if (troops === 0 || !territory) {
            this.gsm.emit('game:setMapInteractive', true);
            return;
        }

        const currentPlayer = this.gsm.getCurrentPlayer();
        
        if (troops > currentPlayer.availableTroops) {
            this.gsm.emit('game:error', "Você não tem tropas suficientes para alocar.");
            this.gsm.emit('game:setMapInteractive', true);
            return;
        }
        territory.addTroops(troops);
        currentPlayer.availableTroops -= troops;
        this.gsm.emit('game:troopCountChanged', territory.id, territory.troops);
        this.gsm.emit('game:setMapInteractive', true);
    }

    handleTerritoryClick(territory) {
        switch (this.gsm.getCurrentPhase()) {
            case TURN_PHASES.FIRST_REINFORCEMENT:
            case TURN_PHASES.REINFORCEMENT:
                this.handleReinforcementClick(territory);
                break;
            case TURN_PHASES.ATTACK:
                this.handleAttackClick(territory);
                break;
            case TURN_PHASES.STRATEGIC:
                // this.handleStrategicClick(territory);
                break;
            default:
                break;
        }
    }

    handleReinforcementClick(territory) {
        const currentPlayer = this.gsm.getCurrentPlayer();
        
        if (territory.owner === currentPlayer) {
            this.gsm.emit('game:setMapInteractive', false);
            this.gsm.emit('territorySelected', territory, currentPlayer);
        }
        else {
            this.gsm.emit('game:error', "Você não possui esse território!");
        }
    }

    handleAttackClick(territory) {
        const currentPlayer = this.gsm.getCurrentPlayer();
        console.log(this.attackTerritories);
        if (this.attackTerritories.attacker === null) {
            if (territory.owner !== currentPlayer) {
                this.gsm.emit('game:error', "Você só pode atacar a partir de seus próprios territórios!");
            } else if (territory.getTroopCount() < 2) {
                this.gsm.emit('game:error', "Você precisa de pelo menos 2 tropas para atacar!");
            } else {
                this.attackTerritories.attacker = territory;
                this.gsm.emit('game:attackerSelected', territory);
            }
        } else if (this.attackTerritories.defender === null) {
            if (territory === this.attackTerritories.attacker) {
                this.attackTerritories.attacker = null;
                this.gsm.emit('game:unselectAttacker', territory);
            } else if (territory.owner === currentPlayer) {
                this.attackTerritories.attacker = null;
                this.gsm.emit('game:unselectAttacker', territory);
                this.handleAttackClick(territory);
            } else if (!this.attackTerritories.attacker.isNeighbor(territory)) {
                this.gsm.emit('game:error', "Você só pode atacar territórios vizinhos!");
            } else {
                this.attackTerritories.defender = territory;
                this.gsm.emit('game:defenderSelected', territory, this.attackTerritories.attacker);
            }
        } else {
            this.attackTerritories.attacker = null;
            this.attackTerritories.defender = null;
            this.gsm.emit('game:unselectAttacker', territory);
        }
    }

    onAttackCommit({ attackDice, attacker, defender }) {
        if (attackDice === 0){
            this.gameStateManager.emit('game:unselectAttacker', attacker);
            this.attackTerritories.attacker = null;
            this.attackTerritories.defender = null;
            return;
        }
        const casualties = executeCombat(attackDice, defender);
        this.attackTerritories.attacker.removeTroops(casualties[0]);
        this.attackTerritories.defender.removeTroops(casualties[1]);
        
        if (defender.getTroopCount() === 0) {
            // this.gameStateManager.emit('game:territoryConquered', )
        }
        
        this.gsm.emit('setMapInteractive', true);
    }

    onPhaseChanged(newPhase) {
        this.gsm.emit('game:phaseChanged', newPhase);
    }

    onNextTurn(turnManager) {
        const newPlayer = turnManager.getCurrentPlayer();
        this.gsm.playerManager.calculateReinforcements(newPlayer);
        this.gsm.emit('game:nextTurn', newPlayer);
    }

    handleAttackConfirm(){
        this.gsm.emit('setMapInteractive', false);
    }
}