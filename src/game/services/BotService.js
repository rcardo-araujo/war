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
                },
                body: JSON.stringify(requestData)
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
    async getFirstReinforcementDecision(gameStateManager){
        
        const currentPlayer = gameStateManager.getCurrentPlayer();
        //const allPlayers = gameStateManager.playerManager.getPlayers();
        //const allTerritories = Object.values(gameStateManager.mapManager.territories);
        const objectiveType = currentPlayer.objective.type;
        const objectiveDescription = currentPlayer.objective.description
        const availableTroops = currentPlayer.availableTroops;
        const ownedTerritories = Array.from(currentPlayer.ownedTerritories).map(t => ({
            id: t.id,
            territoryName: t.name,
            continet: t.continent,
            troops: t.troops,
        }))
        // const currentPlayerData = {
        //     objective: currentPlayer.objective ? {
        //         type: currentPlayer.objective.type,
        //         description: currentPlayer.objective.description
        //     } : null,
        //     availabeTroops: currentPlayer.availableTroops,
        //     availableTroopsSouthAmerica: currentPlayer.availableTroopsSouthAmerica,
        //     availabeTroopsNorthAmerica: currentPlayer.availableTroopsNorthAmerica,
        //     availableTroopsEurope: currentPlayer.availableTroopsEurope,
        //     availabeTroopsAsia: currentPlayer.availableTroopsAsia,
        //     availabeTroopsAfrica: currentPlayer.availableTroopsAfrica,
        //     availabeTroopsOceania: currentPlayer.availableTroopsOceania,
        //     ownedTerritories: Array.from(currentPlayer.ownedTerritories).map(t => ({
        //         id: t.id,
        //         territoryName: t.name,
        //         continent: t.continent,
        //         troops: t.troops
        //     })),
        // };
        // const allPlayersData = allPlayers.map(player => ({
        //     name: player.name,
        //     color: player.color,
        //     colorKey: player.colorKey,
        //     territoryCount: player.ownedTerritories.size,
        //     ownedTerritories: Array.from(player.ownedTerritories).map(t => ({
        //         id: t.id,
        //         territoryName: t.name,
        //         continent: t.continent,
        //         troops: t.troops,
        //     }))
        // }));
        const requestData = {
            data: {
                objectiveType: objectiveType,
                objectiveDescription: objectiveDescription,
                totalAvailableTroops: availableTroops,
                ownedTerritories: ownedTerritories,
            }
        };

        return await this.getBotResponse(requestData, "first-reinforcement")
    }
}