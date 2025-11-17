import { TURN_PHASES} from "./TurnManager";

export default class MovementController {
    constructor(gameStateManager){
        this.gameStateManager = gameStateManager;
        this.availableTroops = new Map();
    }

    ensureStrategicPhase(){
        const turnManager = this.gameStateManager.turnManager;
        if (!turnManager){
            throw new Error('Turn manager not available');
        }
        if (turnManager.getCurrentPhase() !== TURN_PHASES.STRATEGIC){
            throw new Error('Strategic movement is only allowed during the strategic phase');
        }

    }

    startStrategicMovement(){
        this.ensureStrategicPhase();
        this.availableTroops.clear();

        const currentPlayer = this.gameStateManager.getCurrentPlayer();
        if (!currentPlayer){
            throw new Error('No current player available for strategic movement');
        }
        currentPlayer.ownedTerritories.forEach((territory) => {
            const movable = Math.max(0, territory.getTroopCount() - 1);
            this.availableTroops.set(territory.id, movable);
        })
    }

    endStrategicMovement(){
        this.availableTroops.clear();
    }

    moveTroopsBetweenTerritories({fromId, toId, troops}){
        this.ensureStrategicPhase();
        if (typeof troops !== 'number' || troops <= 0){
            throw new Error('Você deve ter pelo menos uma tropa');
        }
        const fromTerritory = this.gameStateManager.territories[fromId];
        const toTerritory = this.gameStateManager.territories[toId];
        if (!fromTerritory || !toTerritory){
            throw new Error('Ambos territórios devem existir para executar a movimentação de tropas');
        }

        const currentPlayer = this.gameStateManager.getCurrentPlayer();
        if (!currentPlayer){
            throw new Error('Nenhum jogador ativo');
        }

        if (fromTerritory.owner !== currentPlayer || toTerritory.owner !== currentPlayer){
            throw new Error('Você pode mover tropas apenas entre seus territórios');
        }

        if (!fromTerritory.isNeighbor(toTerritory)){
            throw new Error("Movemento estratégico é permitido apenas entre territórios adjacentes");
        }

        const availableFrom = this.availableTroops.get(fromTerritory.id);
        if (availableFrom == undefined){
            throw new Error("Nenhum registro de tropas disponível para o território de origem. Garanta que a fase estratégica começou");
        }
        
        if (troops > availableFrom){
            throw new Error('Número de tropas insuficiente');
        }

        if (fromTerritory.getTroopCount() - troops < 1){
            throw new Error('Território de origem deve permanecer com pelo menos uma tropa');
        }

        fromTerritory.removeTroops(troops);
        toTerritory.addTroops(troops);
        this.availableTroops.set(fromTerritory.id, availableFrom - troops);

        return {
            fromId,
            toId,
            movedTroops: troops,
            remainingAvailableFrom: this.availableTroops.get(fromTerritory.id)
        }

    }
    
}