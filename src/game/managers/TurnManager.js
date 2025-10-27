import Player from '../gameObjects/Player';

export class TurnManager extends Phaser.Events.EventEmitter {
    constructor (players) {
        super();
        this.currentTurn = 0;
        this.players = players;
        this.currentPlayerIndex = 0;
        this.currentRound = 0;
    }

    nextTurn() {
        this.currentTurn++;
        if(this.currentTurn % this.players.length === 0){
            this.currentRound++;
        }
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        this.emit("nextTurn", this);
    }

    getCurrentPlayer(){
        return this.players[this.currentPlayerIndex];
    }
}
