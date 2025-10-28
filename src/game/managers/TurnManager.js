export const TURN_PHASES = Object.freeze({
    REINFORCEMENT: "reinforcement",
    ATTACK: "attack",
    STRATEGIC: "strategic",
    END: "END"
})

export default class TurnManager extends Phaser.Events.EventEmitter {
    constructor(players){
        super();
        this.players = players;
        this.currentPlayerIndex = 0;
        this.currentPhase = TURN_PHASES.FIRST_REINFORCEMENT;
        this.currentTurnCount = 0;
        this.currentRoundCount = 0;   
        this.hasPerformedStrategicMove = false;
    }

    setPlayers(players = []){
        this.players = players;
        this.currentPlayerIndex;
        this.resetTurnState();
    }

    resetTurnState(){
        this.currentPhase = TURN_PHASES.REINFORCEMENT;
        this.hasPerformedStrategicMove = false;
    }

    getCurrentPlayer(){
        return this.players[this.currentPlayerIndex] || null;
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
    }

    markStrategicMovePerformed(){
        this.hasPerformedStrategicMove = true;
    }

    hasStrategicMoveAvailable(){
        return this.getCurrentPhase === TURN_PHASES.STRATEGIC && !this.hasPerformedStrategicMove;
    }

    endTurn(){
        if(++this.currentTurnCount % this.players.length === 0){
            this.currentRoundCount++;
        }
        
        if (this.players.length === 0){
            this.currentPlayerIndex = 0;
            this.resetTurnState();
            this.emit("nextTurn", this);
            return;
        }
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.resetTurnState();
        this.emit("nextTurn", this);
    }
}