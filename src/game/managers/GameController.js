import { TURN_PHASES } from "./TurnManager";
import { executeCombat } from "../utils/diceRoller";

export default class GameController {
    constructor(gsm) {
        this.gsm = gsm;
        this.movementController = this.gsm.movementController;

        this.setupEventListeners();
        const firstPlayer = this.gsm.playerManager.getPlayers()[0];
        this.gsm.playerManager.calculateReinforcements(firstPlayer);
        this.attackTerritories = {
            attacker: null,
            defender: null,
        };

        this.strategyTerritories = {
            origin: null,
            destination: null
        };
        this.capture = false;
    }

    setupEventListeners() {
        this.gsm.on("ui:endPhaseClicked", this.handleEndPhaseRequest, this);
        this.gsm.on("troopsAllocated", this.handleTroopsAllocated, this);
        this.gsm.on("ui:territoryClicked", this.handleTerritoryClick, this);

        this.gsm.on("game:attackConfirmed", this.handleAttackConfirm, this);
        this.gsm.on("game:attackCommitted", this.onAttackCommit, this);

        this.gsm.on("game:strategyConfirmed", this.handleStrategyConfirm, this);
        this.gsm.on("game:strategyCommitted", this.onStrategyCommit, this);

        this.gsm.turnManager.on("phaseChanged", this.onPhaseChanged, this);
        this.gsm.turnManager.on("nextTurn", this.onNextTurn, this);

        this.gsm.on("ui:tradeCardsClicked", this.handleTradeClick, this);
        this.gsm.on("game:tradeCardsSelected", this.onTradeCommit, this);
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
                `Você ainda tem ${
                    player.availableTroops +
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
        if (newPhase === TURN_PHASES.END){
            this.gsm.territoryCardManager.drawCard(this.gsm.getCurrentPlayer());
        }
    }

    onNextTurn(turnManager) {
        this.capture = false;
        const newPlayer = turnManager.getCurrentPlayer();
        this.gsm.playerManager.calculateReinforcements(newPlayer);
        this.movementController.reset();
        this.gsm.emit("game:nextTurn", newPlayer);
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
                "Você não possui cartas suficientes para trocar!"
            );
        }
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
