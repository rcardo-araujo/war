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