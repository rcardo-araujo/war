export const TURN_PHASES = Object.freeze({
    FIRST_REINFORCEMENT: "first_reinforcement",
    REINFORCEMENT: "reinforcement",
    ATTACK: "attack",
    STRATEGIC: "strategic",
    END: "end"
})

export default class TurnManager extends Phaser.Events.EventEmitter {
    constructor(players){
        super();
        this.players = players;
        this.currentPlayerIndex = 0;
        this.currentPhase = TURN_PHASES.FIRST_REINFORCEMENT;
        this.currentTurnCount = 0;
        this.currentRoundCount = 0;
    }

    setPlayers(players = []){
        this.players = players;
        this.currentPlayerIndex; // Nota: isso parece um typo no original, mas mantive para compatibilidade
        this.resetTurnState();
    }

    resetTurnState(){
        this.setPhase(TURN_PHASES.REINFORCEMENT);
        this.hasPerformedStrategicMove = false;
    }

    getCurrentPlayer(){
        return this.players[this.currentPlayerIndex] || null;
    }

    // MERGE: Adicionado da sua branch (necessário para o BotService)
    getPreviousPlayer(){
        const prevIndex = (this.currentPlayerIndex - 1 + this.players.length) % this.players.length;
        return this.players[prevIndex] || null;
    }

    getCurrentPhase(){
        return this.currentPhase;
    }

    setPhase(phase){
        if (!Object.values(TURN_PHASES).includes(phase)){
            throw new Error(`Invalid turn phase: ${phase}`)
        }

        this.currentPhase = phase;
        if (phase == TURN_PHASES.STRATEGIC){
            this.hasPerformedStrategicMove = false;
        }

        this.emit("phaseChanged", this.currentPhase);
    }

    markStrategicMovePerformed(){
        this.hasPerformedStrategicMove = true;
    }

    hasStrategicMoveAvailable(){
        return this.getCurrentPhase() === TURN_PHASES.STRATEGIC && !this.hasPerformedStrategicMove;
    }

    endPhase(){
        switch (this.currentPhase){
            case TURN_PHASES.REINFORCEMENT:
                this.setPhase(TURN_PHASES.ATTACK);
                break;
            case TURN_PHASES.ATTACK:
                this.setPhase(TURN_PHASES.STRATEGIC);
                break;
            case TURN_PHASES.STRATEGIC:
                this.setPhase(TURN_PHASES.END);
                break;
            default:
                this.endTurn();
                break;
        }
    }

    endTurn(){
        if(++this.currentTurnCount % this.players.length === 0){
            this.currentRoundCount++;
        }

        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

        if(this.currentRoundCount != 0){
            this.resetTurnState();
        }
        // Emitindo 'this' para que o GameController possa acessar getPreviousPlayer()
        this.emit("nextTurn", this);
    }

    reorganize(queue){
        for (let i = 0; i < queue.length; i++){
                for (let j = i+1; j < this.players.length; j++){
                    if (queue[i].name === this.players[j].name){
                        let aux = this.players[i];
                        this.players[i] = this.players[j];
                        this.players[j] = aux;
                    }
                }
        }
    }
}