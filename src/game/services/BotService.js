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
        const mapManager = gameStateManager.mapManager;
        const continentBonusTroops = {
            "South America": currentPlayer.availableTroopsSouthAmerica,
            "North America": currentPlayer.availableTroopsNorthAmerica,
            "Europe": currentPlayer.availableTroopsEurope,
            "Asia": currentPlayer.availableTroopsAsia,
            "Africa": currentPlayer.availableTroopsAfrica,
            "Oceania": currentPlayer.availableTroopsOceania
        };
        const groupedTerritories = {}
        Array.from(currentPlayer.ownedTerritories).forEach(t => {
            const isBorder = Array.from(t.neighbors).some(neighborId => {
                const neighbor = mapManager.getTerritory(neighborId);
                return neighbor && neighbor.owner !== currentPlayer;
            });
            if (!groupedTerritories[t.continent]){
                groupedTerritories[t.continent] = []
            }
            groupedTerritories[t.continent].push({
                id: t.id,
                name: t.name,
                troops: t.troops,
                is_border: isBorder
            });
        });
        const requestData = {
            data: {
                objective: currentPlayer.objective.description,
                freeTroops: currentPlayer.availableTroops,
                continentBonusTroops: continentBonusTroops,
                groupeddTerritories: groupedTerritories
            }
        };
        
        return await this.getBotResponse(requestData, phase);

    }

    async getAttackDecision(gameStateManager){
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const objectiveType = currentPlayer.objective.type;
        const objectiveDescription = currentPlayer.objective.description;
        const territoriesCanAttackFrom = Array.from(currentPlayer.ownedTerritories).reduce((acc, t) => {
            const neighborIds = Array.from(t.neighbors || []);
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
                territoriesCanAttackFrom: territoriesCanAttackFrom,
            }
        };
        return await this.getBotResponse(requestData, "attack");
    }

    getFallbackReinforcement(gsm, currentPlayer){
        const avaialble = currentPlayer.availableTroops;
        const placements = [];
        const borderTerritories = Array.from(currentPlayer.ownedTerritories).filter(t => {
            return Array.from(t.neighbors).some(nid => {
                const neighbor = gsm.mapManager.getTerritory(nid);
                return neighbor && neighbor.owner !== currentPlayer;
            });
        });
        const targets = borderTerritories.length > 0 ? borderTerritories : Array.from(currentPlayer.ownedTerritories);
        if (targets.length > 0 && available > 0){
            const randomTarget = targets[Math.floor(Math.random() * targets.length)];
            placements.push({
                territoryId: randomTarget.id,
                troops: available
            });
        }
        return {action: "reinforcement_fallback", placements: placements};
    }

    getFallbackAttack(){
        return {action: "attack", skipAttack: true};
    }

}