export default class BotService{
    constructor(apiUrl = 'http://localhost:8080'){
        this.apiUrl = apiUrl;
    }

    async getBotResponse(requestData, phase){
        try{
            const response = await fetch(`${this.apiUrl}/${phase}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    body: JSON.stringify(requestData)
                }
            });
            if (!response.ok){
                throw new Error(`API error: ${response.status}`)
            }
            const data = await response.json();
            return data.generated_json;
        } catch (error){
            console.log('Erro ao chamar API do bot: ',error);
        }

    }
    getFirstReinforcementDecision(gameStateManager){
        
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const allPlayers = gameStateManager.playerManager.getPlayers();
        const allTerritories = Object.values(gameStateManager.mapManager.territories);
        const currentPlayerData = {
            objective: currentPlayer.objective ? {
                type: currentPlayer.objective.type,
                description: currentPlayer.objective.description
            } : null,
            availabeTroops: currentPlayer.availabeTroops,
            availableTroopsSouthAmerica: currentPlayer.availableTroopsSouthAmerica,
            availabeTroopsNorthAmerica: currentPlayer.availabeTroopsNorthAmerica,
            availableTroopsEurope: currentPlayer.availableTroopsEurope,
            availabeTroopsAsia: currentPlayer.availabeTroopsAsia,
            availabeTroopsAfrica: currentPlayer.availabeTroopsAfrica,
            availabeTroopsOceania: currentPlayer.availabeTroopsOceania,
            ownedTerritories: Array.from(currentPlayer.ownedTerritories).map(t => ({
                id: t.id,
                territoryName: t.name,
                continent: t.continent,
                troops: t.troops
            })),
        };
        const allPlayersData = allPlayers.map(player => ({
            name: player.name,
            color: player.color,
            colorKey: player.colorKey,
            territoryCount: player.ownedTerritories.size,
            ownedTerritories: Array.from(player.ownedTerritories).map(t => ({
                id: t.id,
                territoryName: t.name,
                continent: t.continent,
                troops: t.troops,
            }))
        }));
        const requestData = {
            data: {
                currentPlayer: currentPlayerData,
                allPlayers: allPlayersData,
                phase: "first_reinforcement"
            }
        };

        this.getBotResponse(requestData, "first_reinforcement")
    }
}