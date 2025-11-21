import { TURN_PHASES } from './TurnManager';
import { executeCombat } from '../utils/diceRoller';
import BotService from '../services/BotService';
import { PLAYER_TYPES } from '../config/playerTypes';

export default class GameController {
    constructor(gsm) {
        this.gsm = gsm;
        this.botService = new BotService()
        const firstPlayer = this.gsm.playerManager.getPlayers()[0];
        this.gsm.playerManager.calculateReinforcements(firstPlayer);
        this.attackTerritories = {
            attacker: null,
            defender: null
        }
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.gsm.on('ui:endPhaseClicked', this.handleEndPhaseRequest, this);
        this.gsm.on('troopsAllocated', this.handleTroopsAllocated, this);
        this.gsm.on('ui:territoryClicked', this.handleTerritoryClick, this);

        this.gsm.on('game:attackConfirmed', this.handleAttackConfirm, this);
        this.gsm.on('game:attackCommitted', this.onAttackCommit, this);

        this.gsm.turnManager.on('phaseChanged', this.onPhaseChanged, this);
        this.gsm.turnManager.on('nextTurn', this.onNextTurn, this);

        this.gsm.on('scene:ready', this.onSceneReady, this);
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

        if ((player.availableTroops > 0 || player.availableTroopsSouthAmerica >0 || player.availableTroopsNorthAmerica > 0 || player.availableTroopsEurope > 0 || player.availableTroopsAfrica > 0 || player.availableTroopsAsia > 0 || player.availableTroopsOceania > 0) &&
            (phase === TURN_PHASES.REINFORCEMENT ||
             phase === TURN_PHASES.FIRST_REINFORCEMENT)
        ) {
            this.gsm.emit('game:error', `Você ainda tem ${player.availableTroops+player.availableTroopsSouthAmerica+player.availableTroopsNorthAmerica+player.availableTroopsEurope+player.availableTroopsAfrica+player.availableTroopsAsia+player.availableTroopsOceania} tropas para alocar!`);
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
        const continentBonus = currentPlayer.getContinentBonus(territory);

        if (troops > currentPlayer.availableTroops + continentBonus) {
            this.gsm.emit('game:error', "Você não tem tropas suficientes para alocar.");
            this.gsm.emit('game:setMapInteractive', true);
            return;
        }
        territory.addTroops(troops);
        currentPlayer.allocateTroops(territory, troops);
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
            const attackerWon = casualties[1] > casualties[0];
            this.gsm.emit('game:attackResult', {
                winnerId: attackerWon ? attacker.id : defender.id,
                loserId: attackerWon ? defender.id: attacker.id
            })
            
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
        const currentPlayer = this.gsm.getCurrentPlayer();
        if (currentPlayer.type === PLAYER_TYPES.BOT){
            if (newPhase === TURN_PHASES.FIRST_REINFORCEMENT || newPhase === TURN_PHASES.REINFORCEMENT){
                this.executeBotReinforcement(currentPlayer, newPhase);
            } else if (newPhase === TURN_PHASES.ATTACK){
                this.executeBotAttack(currentPlayer);
            }
        }
    }

    onNextTurn(turnManager) {
        const newPlayer = turnManager.getCurrentPlayer();
        this.gsm.playerManager.calculateReinforcements(newPlayer);
        this.gsm.emit('game:nextTurn', newPlayer);

        const currentPhase = this.gsm.getCurrentPhase();
        if (currentPhase === TURN_PHASES.FIRST_REINFORCEMENT && newPlayer.type === PLAYER_TYPES.BOT) {
            this.executeBotReinforcement(newPlayer, currentPhase);
        }
    }

    handleAttackConfirm(){
        this.checkObjectiveForPlayer(this.gsm.getCurrentPlayer());
        console.log("Ataque confirmado");
        this.gsm.emit('game:setMapInteractive', false);
    }

    onSceneReady(){
        const firstPlayer = this.gsm.getCurrentPlayer();
        if (firstPlayer.type === PLAYER_TYPES.BOT){
            this.gsm.emit('game:setMapInteractive', false);
            this.executeBotReinforcement(firstPlayer, this.gsm.getCurrentPhase());
        }
    }

    /// BOT METHODS
    async executeBotReinforcement(currentPlayer, phase){
        console.log(`Bot ${currentPlayer.name} pensando (${phase})...`)
        this.gsm.emit('game:setMapInteractive', false);
        let decision = null
        let apiError = false;
        try {
            decision = await this.botService.getReinforcementDecision(this.gsm, phase);
            console.log(`Decisão do bot (${phase}): `,decision);
            if (decision === "jsonParseFaile"){
                throw new Error("erro no parse do JSON da API")
            }
        } catch (error){
            console.log(`Erro: ${error}. Ativando fallback"`);
        }
        decision = null
        if (!decision || !decision.placements){
            apiError = true;
            decision = this.botService.getFallbackReinforcement(this.gsm, currentPlayer);
        }
        if (decision && decision.placements){
            for (const placement of decision.placements){
                const territory = this.gsm.mapManager.getTerritory(placement.territoryId);
                if (!territory){
                    console.log(`Território não encontrado: ${placement.territoryId}`);
                    continue;
                }
                if (territory.owner !== currentPlayer){
                    console.log(`Bot tentou alocar tropas em território que não possui: ${territory.name}`)
                    continue;
                }
                territory.addTroops(placement.troops);
                currentPlayer.allocateTroops(territory, placement.troops);
                this.gsm.emit('game:troopCountChanged', territory.id);
                if (apiError){
                    await new Promise(resolve => setTimeout(resolve, 2000))
                }
            }
        }
        this.gsm.emit('game:setMapInteractive', true);
        this.gsm.turnManager.endPhase();
        
    }

    async executeBotAttack(currentPlayer){
        console.log(`Bot ${currentPlayer.name} pensando (attack)...`);
        this.gsm.emit('game:setMapInteractive', false);
        let decision = null;
        try {
            decision = await this.botService.getAttackDecision(this.gsm);
            console.log('Decisão do bot (attack): ', decision);
        } catch (error){
            console.log(`Erro ao executar attack do bot: ${error}. Pulando ataque`);

        }
        if (!decision){
            console.log(`Bot ${currentPlayer.name} retornou uma resposta inválida. Pulando ataque`);
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (decision.skipAttack === true){
            console.log(`Bot ${currentPlayer.name} decidiu não atacar.`);
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        const attacker = this.gsm.mapManager.getTerritory(decision.attackerTerritoryId);
        const defender = this.gsm.mapManager.getTerritory(decision.defenderTerritoryId);
        if (!attacker || !defender){
            console.log('Território inválido - pulando ataque do bot');
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (attacker.owner !== currentPlayer){
            console.log("Bot tentou atacar de território que não possui - pulando ataque");
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (!attacker.neighbors.has(defender.id)){
            console.log("Bot tentou atacar território que não é vizinho - pulando ataque");
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (defender.owner === currentPlayer){
            console.log("Bot tentou atacar seu próprio território - pulando ataque");
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        const maxDice = Math.min(3, attacker.troops - 1);
        const attackDice = Math.min(decision.attackDice, maxDice);
        if (attackDice < 1){
            console.log('Dados de ataque inválidos - pulando ataque');
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }

        console.log(`Bot atacando: ${attacker.name} -> ${defender.name} com ${attackDice} dados`);
        this.attackTerritories.attacker = attacker;
        this.attackTerritories.defender = defender;
        this.gsm.emit('game:attackerSelected', attacker);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.gsm.emit('game:defenderSelected', defender, attacker);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.gsm.emit('game:attackCommitted', {
            attackDice: attackDice,
            attacker: attacker,
            defender: defender
        })

        const canStillAttack = Array.from(currentPlayer.ownedTerritories).some(t => {
            if (t.troops < 2) return false;
            return Array.from(t.neighbors).some(neighborId => {
                const neighbor = this.gsm.mapManager.getTerritory(neighborId);
                return neighbor && neighbor.owner !== currentPlayer;
            });
        });
        if (canStillAttack) {
            this.executeBotAttack(currentPlayer);
        }
        else {
            console.log(`Bot ${currentPlayer.name} não tem mais ataques possíveis`);
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
        }
    }


}