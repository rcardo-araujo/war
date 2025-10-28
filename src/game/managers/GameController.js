import { TURN_PHASES } from './TurnManager';

export default class GameController {
    constructor(gameStateManager) {
        this.gsm = gameStateManager;
        this.setupEventListeners();
        const firstPlayer = this.gsm.playerManager.getPlayers()[0];
        this.gsm.playerManager.calculateReinforcements(firstPlayer);
    }

    setupEventListeners() {
        this.gsm.on('ui:endPhaseClicked', this.handleEndPhaseRequest, this);
        this.gsm.on('troopsAllocated', this.handleTroopsAllocated, this);
        this.gsm.on('ui:territoryClicked', this.handleTerritoryClick, this);

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
                // this.handleAttackClick(territory);
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

    onPhaseChanged(newPhase) {
        this.gsm.emit('game:phaseChanged', newPhase);
    }

    onNextTurn(turnManager) {
        const newPlayer = turnManager.getCurrentPlayer();
        this.gsm.playerManager.calculateReinforcements(newPlayer);
        this.gsm.emit('game:nextTurn', newPlayer);
    }
}