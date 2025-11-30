import { TURN_PHASES } from './TurnManager';
import { executeCombat } from '../utils/diceRoller';
import BotService from '../services/BotService';
import { PLAYER_TYPES } from '../config/playerTypes';
import { storePlayers } from "../utils/store";
import { storeTerritories } from "../utils/store";

export default class GameController {
    constructor(gsm) {
        this.gsm = gsm;
        
        // MERGE: Inicialização de ambos os serviços
        this.botService = new BotService();
        this.movementController = this.gsm.movementController;

        const firstPlayer = this.gsm.playerManager.getPlayers()[0];
        this.gsm.playerManager.calculateReinforcements(firstPlayer);
        
        // MERGE: Propriedades de ataque e estratégia
        this.attackTerritories = {
            attacker: null,
            defender: null,
        };

        this.strategyTerritories = {
            origin: null,
            destination: null
        };
        
        this.capture = false;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.gsm.on("ui:endPhaseClicked", this.handleEndPhaseRequest, this);
        this.gsm.on("troopsAllocated", this.handleTroopsAllocated, this);
        this.gsm.on("ui:territoryClicked", this.handleTerritoryClick, this);

        this.gsm.on("game:attackConfirmed", this.handleAttackConfirm, this);
        this.gsm.on("game:attackCommitted", this.onAttackCommit, this);

        this.gsm.on("game:strategyConfirmed", this.handleStrategyConfirm, this);
        this.gsm.on("game:strategyCommitted", this.onStrategyCommit, this);

        // MERGE: Listeners do Bot (HEAD) e da DEV
        this.gsm.on('scene:ready', this.onSceneReady, this); // Bot
        
        this.gsm.turnManager.on("phaseChanged", this.onPhaseChanged, this);
        this.gsm.turnManager.on("nextTurn", this.onNextTurn, this);

        this.gsm.on("ui:tradeCardsClicked", this.handleTradeClick, this);
        this.gsm.on("game:tradeCardsConfirmed", this.onTradeCommit, this);
    }

    checkObjectiveForPlayer(player, defender) {
        if (!player || !player.objective) return;
        if (player.objective._completed) return;

        const ok = this.gsm.playerManager.isObjectiveComplete(
            player,
            this.gsm.mapManager,
            defender
        );
        if (ok) {
            player.objective._completed = true;
            this.gsm.emit("game:objectiveAchieved", {
                player,
                objective: player.objective,
            });
            console.log(`Jogador ${player.name} completou seu objetivo!`);
        }
    }

    handleEndPhaseRequest() {
        const player = this.gsm.getCurrentPlayer();
        const phase = this.gsm.getCurrentPhase();

        if (
            (player.availableTroops > 0 ||
                player.availableTroopsSouthAmerica > 0 ||
                player.availableTroopsNorthAmerica > 0 ||
                player.availableTroopsEurope > 0 ||
                player.availableTroopsAfrica > 0 ||
                player.availableTroopsAsia > 0 ||
                player.availableTroopsOceania > 0) &&
            (phase === TURN_PHASES.REINFORCEMENT ||
                phase === TURN_PHASES.FIRST_REINFORCEMENT)
        ) {
            this.gsm.emit(
                "game:error",
                `Você ainda tem ${player.availableTroops +
                player.availableTroopsSouthAmerica +
                player.availableTroopsNorthAmerica +
                player.availableTroopsEurope +
                player.availableTroopsAfrica +
                player.availableTroopsAsia +
                player.availableTroopsOceania
                } tropas para alocar!`
            );
            return;
        }

        this.gsm.turnManager.endPhase();
    }

    handleTroopsAllocated({ troops, territory }) {
        if (troops === 0 || !territory) {
            this.gsm.emit("game:setMapInteractive", true);
            return;
        }

        const currentPlayer = this.gsm.getCurrentPlayer();
        const continentBonus = currentPlayer.getContinentBonus(territory);

        if (troops > currentPlayer.availableTroops + continentBonus) {
            this.gsm.emit(
                "game:error",
                "Você não tem tropas suficientes para alocar."
            );
            this.gsm.emit("game:setMapInteractive", true);
            return;
        }
        territory.addTroops(troops);
        currentPlayer.allocateTroops(territory, troops);
        this.gsm.emit("game:troopCountChanged", territory.id);
        this.gsm.emit("game:setMapInteractive", true);

        this.checkObjectiveForPlayer(currentPlayer);
        console.log(
            `Alocadas ${troops} tropas para o território ${territory.name}`
        );
    }

    checkPlayerElimination(attackerPlayer, defenderPlayer) {
        console.log("Checando eliminação de jogadores...");
        if (defenderPlayer.ownedTerritories.size === 0) {
            for(let card of defenderPlayer.territoryCards){
                this.gsm.territoryCardManager.changePlayerTerritoryCardOwnership(card.id, attackerPlayer);
            }

            this.gsm.playerManager.removePlayer(defenderPlayer);
            this.gsm.emit("game:playerEliminated", defenderPlayer);
            console.log(`Jogador ${defenderPlayer.name} foi eliminado!`);
        }
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
                this.handleStrategicClick(territory);
                break;
            default:
                break;
        }
    }

    handleReinforcementClick(territory) {
        const currentPlayer = this.gsm.getCurrentPlayer();

        if (territory.owner === currentPlayer) {
            this.gsm.emit("game:setMapInteractive", false);
            this.gsm.emit("territorySelected", territory, currentPlayer);
        } else {
            this.gsm.emit("game:error", "Você não possui esse território!");
        }
    }

    handleAttackClick(territory) {
        const currentPlayer = this.gsm.getCurrentPlayer();
        console.log(this.attackTerritories);
        if (this.attackTerritories.attacker === null) {
            if (territory.owner !== currentPlayer) {
                this.gsm.emit(
                    "game:error",
                    "Você só pode atacar a partir de seus próprios territórios!"
                );
            } else if (territory.getTroopCount() < 2) {
                this.gsm.emit(
                    "game:error",
                    "Você precisa de pelo menos 2 tropas para atacar!"
                );
            } else {
                this.attackTerritories.attacker = territory;
                this.gsm.emit("game:attackerSelected", territory);
            }
        } else if (this.attackTerritories.defender === null) {
            if (territory === this.attackTerritories.attacker) {
                this.attackTerritories.attacker = null;
                this.gsm.emit("game:unselectAttacker", territory);
            } else if (territory.owner === currentPlayer) {
                this.attackTerritories.attacker = null;
                this.gsm.emit("game:unselectAttacker", territory);
                this.handleAttackClick(territory);
            } else if (!this.attackTerritories.attacker.isNeighbor(territory)) {
                this.gsm.emit(
                    "game:error",
                    "Você só pode atacar territórios vizinhos!"
                );
            } else {
                this.attackTerritories.defender = territory;
                this.gsm.emit(
                    "game:defenderSelected",
                    territory,
                    this.attackTerritories.attacker
                );
            }
        } else {
            this.attackTerritories.attacker = null;
            this.attackTerritories.defender = null;
            this.gsm.emit("game:unselectAttacker", territory);
        }
    }

    onAttackCommit({ attackDice, attacker, defender }) {
        const defendingPlayer = defender.owner;
        if (attackDice !== 0) {
            const casualties = executeCombat(attackDice, defender);
            this.attackTerritories.attacker.removeTroops(casualties[0]);
            this.attackTerritories.defender.removeTroops(casualties[1]);
            
            // MERGE: Notificação para o Bot (HEAD)
            const attackerWon = casualties[1] > casualties[0];
            this.gsm.emit('game:attackResult', {
                winnerId: attackerWon ? attacker.id : defender.id,
                loserId: attackerWon ? defender.id: attacker.id
            });

            // Lógica de captura (DEV)
            if (defender.getTroopCount() <= 0) {
                this.gsm.mapManager.changePlayerTerritoryOwnership(
                    defender.id,
                    attacker.owner
                );
                this.gsm.emit("game:ownerChanged", defender.id);
                const movingTroops = attackDice;
                attacker.removeTroops(movingTroops);
                defender.addTroops(movingTroops);
                this.capture = true;
            }

            this.gsm.emit("game:troopCountChanged", attacker.id);
            this.gsm.emit("game:troopCountChanged", defender.id);
        }
        this.gsm.emit("game:setMapInteractive", true);
        this.gsm.emit("game:unselectAttacker", attacker);
        this.attackTerritories.attacker = null;
        this.attackTerritories.defender = null;
        console.log("Ataque concluído");
        this.checkPlayerElimination(attacker.owner, defender.owner);
        this.checkObjectiveForPlayer(attacker.owner, defendingPlayer);
    }

    handleAttackConfirm() {
        console.log("Ataque confirmado");
        this.gsm.emit("game:setMapInteractive", false);
    }

    handleStrategicClick(territory) {
        const currentPlayer = this.gsm.getCurrentPlayer();
        console.log(this.strategyTerritories);
        if (this.strategyTerritories.origin === null) {
            if (territory.owner !== currentPlayer) {
                this.gsm.emit(
                    "game:error",
                    "Você só pode deslocar tropas de seus próprios territórios!"
                );
            } else if (territory.getTroopCount() < 2) {
                this.gsm.emit(
                    "game:error",
                    "Você não pode retirar todas as tropas de um território!"
                );
            } else {
                this.strategyTerritories.origin = territory;
                this.gsm.emit("game:originSelected", territory);
            }
        } else if (this.strategyTerritories.destination === null) {
            if (territory === this.strategyTerritories.origin) {
                this.strategyTerritories.origin = null;
                this.gsm.emit("game:unselectOrigin", territory);
            } else if (territory.owner !== currentPlayer) {
                this.strategyTerritories.origin = null;
                this.gsm.emit("game:unselectOrigin", territory);
                this.handleStrategicClick(territory);
            } else if (!this.strategyTerritories.origin.isNeighbor(territory)) {
                this.gsm.emit(
                    "game:error",
                    "Você só pode deslocar tropas para territórios vizinhos!"
                );
            } else {
                this.strategyTerritories.destination = territory;
                this.gsm.emit(
                    "game:destinationSelected",
                    territory,
                    this.strategyTerritories.origin
                );
            }
        } else {
            this.strategyTerritories.origin = null;
            this.strategyTerritories.destination = null;
            this.gsm.emit("game:unselectOrigin", territory);
        }
    }

    onStrategyCommit({ troopsAllocated, origin, destination }) {
        this.movementController.moveTroops(
            origin,
            destination,
            troopsAllocated
        );

        this.gsm.emit("game:troopCountChanged", origin.id);
        this.gsm.emit("game:troopCountChanged", destination.id);

        this.gsm.emit("game:unselectOrigin", origin);
        this.gsm.emit("game:setMapInteractive", true);
        this.strategyTerritories.origin = null;
        this.strategyTerritories.destination = null;
    }

    handleStrategyConfirm() {
        console.log("Estratégia confirmada");
        this.gsm.emit("game:setMapInteractive", false);
    }

    onPhaseChanged(newPhase) {
        this.gsm.emit("game:phaseChanged", newPhase);
        
        this.strategyTerritories.origin = null;
        this.strategyTerritories.destination = null;
        this.attackTerritories.attacker = null;
        this.attackTerritories.defender = null;

        const currentPlayer = this.gsm.getCurrentPlayer();
        if (currentPlayer.type === PLAYER_TYPES.BOT){
            this.gsm.emit('game:setBotTurnActive', true);
            if (newPhase === TURN_PHASES.FIRST_REINFORCEMENT || newPhase === TURN_PHASES.REINFORCEMENT){
                this.executeBotReinforcement(currentPlayer, newPhase);
            } else if (newPhase === TURN_PHASES.ATTACK){
                this.executeBotAttack(currentPlayer);
            } else if (newPhase === TURN_PHASES.STRATEGIC){
                this.executeBotStrategic(currentPlayer);
            } else if (newPhase === TURN_PHASES.END){
                this.gsm.turnManager.endPhase();
            }
        } else {
            this.gsm.emit('game:setBotTurnActive', false);
        }

        if (newPhase === TURN_PHASES.END){
            this.gsm.territoryCardManager.drawCard(this.gsm.getCurrentPlayer());
        }
    }

    onNextTurn(turnManager) {
        const previousPlayer = turnManager.getPreviousPlayer()
        this.botService.checkIfPreviousPlayerWasBot(previousPlayer);

        this.capture = false;
        this.movementController.reset();
        storeTerritories(this.gsm.mapManager.territories);
        storePlayers(this.gsm.playerManager.getPlayers(), this.gsm.getCurrentPlayer());
        const newPlayer = turnManager.getCurrentPlayer();
        this.gsm.playerManager.calculateReinforcements(newPlayer);
        this.gsm.emit('game:nextTurn', newPlayer);
        const currentPhase = this.gsm.getCurrentPhase();
        if (newPlayer.type === PLAYER_TYPES.BOT) {
            this.gsm.emit('game:setBotTurnActive', true);
            if (currentPhase === TURN_PHASES.FIRST_REINFORCEMENT) {
                this.executeBotReinforcement(newPlayer, currentPhase);
            }
        } else {
            this.gsm.emit('game:setBotTurnActive', false);
        }     

    }

    handleTradeClick() {
        const currentPlayer = this.gsm.getCurrentPlayer();
        if (
            this.gsm.territoryCardManager.checkTradeEligibility(currentPlayer)
        ) {
            this.gsm.emit("game:tradeCards", currentPlayer);
        } else {
            this.gsm.emit(
                "game:error",
                "Você não possui cartas suficientes que satisfaçam a troca!"
            );
        }
    }

    onSceneReady(){
        const firstPlayer = this.gsm.getCurrentPlayer();
        if (firstPlayer.type === PLAYER_TYPES.BOT){
            this.gsm.emit('game:setBotTurnActive', true);
            this.gsm.emit('game:setMapInteractive', false);
            this.executeBotReinforcement(firstPlayer, this.gsm.getCurrentPhase());
        } else {
            this.gsm.emit('game:setBotTurnActive', false);
        }
    }

    ///////// BOT METHODS

    selectCardsForBotTrade(player) {
        const playerCards = Object.values(this.gsm.territoryCardManager.territoryCards)
            .filter(card => card.owner === player);

        const cardsByType = {
            circle: [],
            square: [],
            triangle: []
        };

        playerCards.forEach(card => {
            if (cardsByType[card.type]) {
                cardsByType[card.type].push(card.id);
            }
        });

        if (cardsByType.circle.length >= 3) {
            return cardsByType.circle.slice(0, 3);
        }
        if (cardsByType.square.length >= 3) {
            return cardsByType.square.slice(0, 3);
        }
        if (cardsByType.triangle.length >= 3) {
            return cardsByType.triangle.slice(0, 3);
        }

        if (cardsByType.circle.length >= 1 &&
            cardsByType.square.length >= 1 &&
            cardsByType.triangle.length >= 1) {
            return [
                cardsByType.circle[0],
                cardsByType.square[0],
                cardsByType.triangle[0]
            ];
        }

        return null;
    }

    
    executeBotCardTrade(player) {
        if (!this.gsm.territoryCardManager.checkTradeEligibility(player)) {
            return;
        }

        const cardsToTrade = this.selectCardsForBotTrade(player);

        if (!cardsToTrade || cardsToTrade.length !== 3) {
            console.log(`Bot ${player.name} não conseguiu selecionar cartas para troca`);
            return;
        }

        console.log(`Bot ${player.name} trocando cartas: ${cardsToTrade.join(', ')}`);

        this.onTradeCommit({ player, cards: cardsToTrade });
    }

    async executeBotReinforcement(currentPlayer, phase){
        console.log(`Bot ${currentPlayer.name} pensando (${phase})...`)
        this.gsm.emit('game:setMapInteractive', false);

        this.executeBotCardTrade(currentPlayer);

        let decision = null
        try {
            decision = await this.botService.getReinforcementDecision(this.gsm, phase);
            console.log(`Decisão do bot (${phase}): `,decision);
            if (decision && decision.message){
                console.log(`${currentPlayer.name}: "${decision.message}"`);
            }
        } catch (error){
            console.log(`Erro: ${error}. Ativando fallback"`);
            decision = this.botService.getFallbackReinforcement(this.gsm, currentPlayer);
        }
        let isDecisionValid = true;
        if (decision && decision.placements){
            for (const placement of decision.placements){
                const territory = this.gsm.mapManager.getTerritory(placement.territoryId);
                if (!territory || territory.owner !== currentPlayer){
                    console.log(`Decisão inválida: ${placement.territoryId}. Ativando fallback`);
                    isDecisionValid = false;
                    break;
                }
            }
        }
        if (!isDecisionValid){
            decision = this.botService.getFallbackReinforcement(this.gsm, currentPlayer);
        }
        for (const placement of decision.placements){
            const territory = this.gsm.mapManager.getTerritory(placement.territoryId);
            territory.addTroops(placement.troops);
            currentPlayer.allocateTroops(territory, placement.troops);
            this.gsm.emit('game:troopCountChanged', territory.id);

        }

        this.checkObjectiveForPlayer(currentPlayer);
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
            if (decision && decision.message){
                console.log(`${currentPlayer.name}: "${decision.message}"`);
            }
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
            this.botService.getFallbackAttack();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (attacker.owner !== currentPlayer){
            console.log("Bot tentou atacar de território que não possui - pulando ataque");
            this.botService.getFallbackAttack();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (!attacker.neighbors.has(defender.id)){
            console.log("Bot tentou atacar território que não é vizinho - pulando ataque");
            this.botService.getFallbackAttack();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (defender.owner === currentPlayer){
            console.log("Bot tentou atacar seu próprio território - pulando ataque");
            this.botService.getFallbackAttack();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        const maxDice = Math.min(3, attacker.troops - 1);
        const attackDice = Math.min(decision.attackDice, maxDice);
        if (attackDice < 1){
            console.log('Dados de ataque inválidos - pulando ataque');
            this.botService.getFallbackAttack();
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

    async executeBotStrategic(currentPlayer){
        console.log(`Bot ${currentPlayer.name} pensando (strategic)...`);
        this.gsm.emit('game:setMapInteractive', false);
        let decision = null;
        try {
            decision = await this.botService.getStrategicDecision(this.gsm);
            console.log('Decisão do bot (strategic): ', decision);
            if (decision && decision.message){
                console.log(`${currentPlayer.name}: "${decision.message}"`);
            }
        } catch (error){
            console.log(`Erro ao executar strategic do bot: ${error}. Pulando movimento`);
        }
        if (!decision){
            console.log(`Bot ${currentPlayer.name} retornou uma resposta inválida. Pulando movimento`);
            decision = this.botService.getFallbackStrategic();
        }
        if (decision.skipMove === true){
            console.log(`Bot ${currentPlayer.name} decidiu não fazer movimento estratégico.`);
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }

        const origin = this.gsm.mapManager.getTerritory(decision.fromTerritoryId);
        const destination = this.gsm.mapManager.getTerritory(decision.toTerritoryId);

        if (!origin || !destination){
            console.log('Território inválido - pulando movimento do bot');
            this.botService.getFallbackStrategic();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (origin.owner !== currentPlayer || destination.owner !== currentPlayer){
            console.log("Bot tentou mover tropas de/para território que não possui - pulando movimento");
            this.botService.getFallbackStrategic();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }
        if (!origin.neighbors.has(destination.id)){
            console.log("Bot tentou mover tropas para território que não é vizinho - pulando movimento");
            this.botService.getFallbackStrategic();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }

        const availableTroops = this.movementController.getAvailableTroops(origin);
        const troops = Math.min(decision.troops, availableTroops);
        if (troops < 1){
            console.log('Tropas inválidas - pulando movimento');
            this.botService.getFallbackStrategic();
            this.gsm.emit('game:setMapInteractive', true);
            this.gsm.turnManager.endPhase();
            return;
        }

        console.log(`Bot movendo: ${origin.name} -> ${destination.name} com ${troops} tropas`);
        this.strategyTerritories.origin = origin;
        this.strategyTerritories.destination = destination;
        this.gsm.emit('game:originSelected', origin);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.gsm.emit('game:destinationSelected', destination, origin);
        await new Promise(resolve => setTimeout(resolve, 500));
        this.gsm.emit('game:strategyCommitted', {
            troopsAllocated: troops,
            origin: origin,
            destination: destination
        });

        this.gsm.emit('game:setMapInteractive', true);
        this.gsm.turnManager.endPhase();
    }

    onTradeCommit({ player, cards }) {
        const bonusTroops = this.gsm.territoryCardManager.calculateTradeBonus(
            player,
            cards
        );
        player.availableTroops += bonusTroops;
        this.gsm.territoryCardManager.clearOwnershipAfterTrade(player, cards);
        this.gsm.territoryCardManager.addUsedTerritoryCards(cards);
        this.gsm.emit("game:cardsTraded", player);
    }
}