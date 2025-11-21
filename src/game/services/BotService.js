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

    async getReinforcementDecision(gameStateManager){
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const allTerritories = Object.values(gameStateManager.mapManager.territories);
        const objectiveType = currentPlayer.objective.type;
        const objectiveDescription = currentPlayer.objective.description;

        const totalAvailableTroops = currentPlayer.availableTroops;
        const ownedTerritories = Array.from(currentPlayer.ownedTerritories).map(t => {
            const enemyNeighbors = t.neighbors.reduce((acc, neighborId) => {
                const neighbor = gameStateManager.mapManager.getTerritory(neighborId);
                if (neighbor && neighbor.owner !== currentPlayer) {
                    acc.push({
                        id: neighbor.id,
                        name: neighbor.name,
                        troops: neighbor.troops
                    });
                }
                return acc;
            }, []); 
            return {
                id: t.id,
                territoryName: t.name,
                continent: t.continent,
                troops: t.troops,
                enemyNeighbors: enemyNeighbors
            };
        });

        const requestData = {
            data: {
                objectiveType: objectiveType,
                objectiveDescription: objectiveDescription,
                totalAvailableTroops: totalAvailableTroops,
                ownedTerritories: ownedTerritories,
            }
        };
        
        return await this.getBotResponse(requestData, "reinforcement")

    }

}