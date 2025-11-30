export default class DebugTools {
    constructor(gameStateManager) {
        this.gsm = gameStateManager;
    }

    attackTerritory(atackerName, territoryId) {
        let territory = this.gsm.getTerritory(territoryId);
        let attacker = this.gsm.playerManager.getPlayers().find(p => p.name === atackerName);
        let defender = territory.owner;

        this.gsm.mapManager.changePlayerTerritoryOwnership(
            territory.id,
            attacker
        );
        this.gsm.emit("game:ownerChanged", territory.id);
        territory.removeTroops(territory.getTroopCount());
        territory.addTroops(1);
        
        this.gsm.gameController.checkObjectiveForPlayer(attacker, defender);
        console.log(`DebugTools: ${attacker.name} is the owner of ${territory.name}`);
    }

    eliminatePlayer(playerName) {
        let player = this.gsm.playerManager.getPlayers().find(p => p.name === playerName);
        let playerIndex = 0;
        let players = this.gsm.playerManager.getPlayers();
        for (let territory of player.ownedTerritories) {
            if (players[playerIndex].name === player.name) {
                playerIndex = (playerIndex + 1) % players.length;
            }

            this.attackTerritory(players[playerIndex].name, territory.id);
            playerIndex = (playerIndex + 1) % players.length;
        }

        this.gsm.gameController.checkPlayerElimination();
    }

    skipFirstRound(){
        let players = this.gsm.playerManager.getPlayers();
        for (let player of players){
            let territory = player.ownedTerritories.values().next().value;

            this.gsm.emit("troopsAllocated", { troops: 4, territory: territory });
            this.gsm.gameController.handleEndPhaseRequest();
            console.log(`DebugTools: Skipping first reinforcement for ${player.name}`);
        }
    }
}