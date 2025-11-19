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
        this.capture = false;
    }

    setPlayers(players = []){
        this.players = players;
        this.currentPlayerIndex;
        this.resetTurnState();
    }

    resetTurnState(){
        this.setPhase(TURN_PHASES.REINFORCEMENT);
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
        this.setCapture(false);

        if(this.currentRoundCount != 0){
            this.resetTurnState();
        }
        this.emit("nextTurn", this);
    }

    setCapture(boolean){
        this.capture = boolean;
    }
}