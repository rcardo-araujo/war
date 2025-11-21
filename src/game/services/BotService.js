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

    async getReinforcementDecision(gameStateManager, phase){
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const objectiveType = currentPlayer.objective.type;
        const objectiveDescription = currentPlayer.objective.description;
        const freeTroops = currentPlayer.availableTroops;
        const continentBonusTroops = {
            south_america: currentPlayer.availableTroopsSouthAmerica,
            north_america: currentPlayer.availableTroopsNorthAmerica,
            europe: currentPlayer.availableTroopsEurope,
            asia: currentPlayer.availableTroopsAsia,
            africa: currentPlayer.availableTroopsAfrica,
            oecania: currentPlayer.availableTroopsOceania,
        };
        const totalAvailableTroops = currentPlayer.getTotalAvailableTroops();
        const ownedTerritories = Array.from(currentPlayer.ownedTerritories).map(t => {
            const neighborsList = Array.from(t.neighbors)
            const enemyNeighbors = neighborsList.reduce((acc, neighborId) => {
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
                freeTroops: freeTroops,
                continentBonusTroops: continentBonusTroops,
                totalAvailableTroops: totalAvailableTroops,
                ownedTerritories: ownedTerritories,
            }
        };
        
        return await this.getBotResponse(requestData, phase)

    }

    async getAttackDecision(gameStateManager){
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const objectiveType = currentPlayer.objective.type;
        const objectiveDescription = currentPlayer.objective.description;
        const attackableTerritories = Array.from(currentPlayer.ownedTerritories).reduce((acc, t) => {
            const neighborIds = Array.from(t.neighbor);
            const enemyNeighbors = neighborIds.reduce((enemies, neighborId) => {
                const neighbor = gameStateManager.mapManager.getTerritory(neighborId);
                if (neighbor && neighbor.owner !== currentPlayer){
                    enemies.push({
                        id: neighbor.id,
                        name: neighbor.name,
                        troops: neighbor.troops,
                        owner: neighbor.owner.name,
                        continent: neighbor.continent
                    });
                }
                return enemies;
            }, []);
            if (enemyNeighbors.length > 0){
                acc.push({
                    id: t.id,
                    territoryName: t.name,
                    continent: t.continent,
                    troops: t.troops,
                    maxDice: Math.min(3, t.troops - 1),
                    enemyNeighbors: enemyNeighbors
                });
            }
            return acc;
        }, []);

        const requestData = {
            data: {
                objectiveType: objectiveType,
                objectiveDescription: objectiveDescription,
                attackableTerritories: attackableTerritories,
            }
        };
        return await this.getBotResponse(requestData, "attack");
    }

}