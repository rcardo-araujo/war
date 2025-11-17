import { TURN_PHASES } from './TurnManager';
import { executeCombat } from '../utils/diceRoller';

export default class GameController {
    constructor(gsm) {
        this.gsm = gsm;
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

    checkObjectiveForPlayer(player, defender) {
        if (!player || !player.objective) return;
        if (player.objective._completed) return;

        const ok = this.gsm.playerManager.isObjectiveComplete(player, this.gsm.mapManager, defender);
        if (ok) {
            player.objective._completed = true;
            this.gsm.emit('game:objectiveAchieved', { player, objective: player.objective });
            console.log(`Jogador ${player.name} completou seu objetivo!`);
        }
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
        this.gsm.emit('game:troopCountChanged', territory.id);
        this.gsm.emit('game:setMapInteractive', true);

        this.checkObjectiveForPlayer(currentPlayer);
        console.log(`Alocadas ${troops} tropas para o território ${territory.name}`);
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
        const defendingPlayer = defender.owner;
        if (attackDice !== 0){
            const casualties = executeCombat(attackDice, defender);
            this.attackTerritories.attacker.removeTroops(casualties[0]);
            this.attackTerritories.defender.removeTroops(casualties[1]);
            
            if (defender.getTroopCount() <= 0) {
                this.gsm.mapManager.changePlayerTerritoryOwnership(defender.id, attacker.owner);
                this.gsm.emit('game:ownerChanged', defender.id);
                const movingTroops = attackDice;
                attacker.removeTroops(movingTroops);
                defender.addTroops(movingTroops);
                
            }

            this.gsm.emit('game:troopCountChanged', attacker.id);
            this.gsm.emit('game:troopCountChanged', defender.id);
            this.gsm.emit('game:setMapInteractive', true);
        }

        this.gsm.emit('game:unselectAttacker', attacker);
        this.attackTerritories.attacker = null;
        this.attackTerritories.defender = null;
        console.log('Ataque concluído');
        this.checkObjectiveForPlayer(attacker.owner, defendingPlayer);
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
        this.checkObjectiveForPlayer(this.gsm.getCurrentPlayer());
        console.log("Ataque confirmado");
        this.gsm.emit('game:setMapInteractive', false);
    }
}