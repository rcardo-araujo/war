import { PLAYER_TYPES } from "../config/playerTypes";
import TurnManager from "../managers/TurnManager";

export default class BotService{
    constructor(apiUrl = 'https://warllm.gdac7.xyz', statusUrl = 'https://warstats.gdac7.xyz'){
        this.apiUrl = apiUrl;
        this.statusUrl = statusUrl;
        this.wantsStatus = true
        this.totalReinforcementCalls = 0;
        this.totalAttackCalls = 0;
        this.totalStrategicCalls = 0;
        this.reinforcementFallbackCount = 0;
        this.attackFallbackCount = 0;
        this.strategicFallbackCount = 0;
        this.apiErrors = 0;
    }

    getBotStats(){
        const data = {
            "totalAttackCalls": this.totalAttackCalls,
            "attackFallbackCount": this.attackFallbackCount,
            "totalReinforcementCalls": this.totalReinforcementCalls,
            "reinforcementFallbackCount": this.reinforcementFallbackCount,
            "totalStrategicCalls": this.totalStrategicCalls,
            "strategicFallbackCount": this.strategicFallbackCount,
            "apiErrors": this.apiErrors,
        }
        return data;
    }

    checkIfPreviousPlayerWasBot(player){
        if (this.wantsStatus){
            if (player && player.type == PLAYER_TYPES.BOT){
                this.sendBotStatsToServer()
            }
        }
    }

    sendBotStatsToServer(){
        const stats = this.getBotStats()
        console.log('Enviando stats:', stats)
        fetch(`${this.statusUrl}/stats`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: stats })
        })
        .then(response => {
            if (response.ok) {
                console.log('Stats enviados com sucesso:', stats);
            } else {
                console.log(`Erro ao enviar stats: ${response.status}`);
            }
        })
        .catch(error => {
            console.log(`Erro ao enviar stats:`, error.message);
        });
    }

    async getBotResponse(requestData, phase){
        let endpoint = phase
        if (phase === "reinforcement" || phase === "first_reinforcement"){
            endpoint = "reinforcement"
        }

        try{
            const response = await fetch(`${this.apiUrl}/${endpoint}`, {
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
            this.apiErrors += 1;
        }

    }

    async getReinforcementDecision(gameStateManager, phase){
        this.totalReinforcementCalls += 1
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
                color: t.color,
                troops: t.troops,
                is_border: isBorder
            });
        });
        const requestData = {
            data: {
                objective: currentPlayer.objective.description,
                anywhereTroops: currentPlayer.availableTroops,
                restrictedTroops: continentBonusTroops,
                ownedTerritories: groupedTerritories,
                totalAvailableTroops: currentPlayer.getTotalAvailableTroops(),
                phase: phase,
                botName: currentPlayer.name,
            }
        };
        
        return await this.getBotResponse(requestData, phase);

    }

    async getAttackDecision(gameStateManager){
        this.totalAttackCalls += 1
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const objectiveType = currentPlayer.objective.type;
        const objectiveDescription = currentPlayer.objective.description;
        const possibleAttacks = [];
        Array.from(currentPlayer.ownedTerritories).forEach(source => {
            if (source.troops < 2) {
                return;
            }
            Array.from(source.neighbors).forEach(neighborId => {
                const target = gameStateManager.mapManager.getTerritory(neighborId);
                if (target && target.owner !== currentPlayer){
                    const ratio = (source.troops - 1) / target.troops;
                    possibleAttacks.push({
                        sourceId: source.id,
                        sourceTroops: source.troops,
                        sourceContinent: source.continent,
                        targetId: target.id,
                        targetTroops: target.troops,
                        targetColor: target.color,
                        targetContinent: target.continent,
                        advantage: ratio > 1.5 ? "high": (ratio > 1 ? "medium": "low"),
                    });
                }
            });

        });
        const requestData = {
            data: {
                objectiveType: objectiveType,
                objectiveDescription: objectiveDescription,
                validAttacks: possibleAttacks,
                botName: currentPlayer.name,
            }
        };
        return await this.getBotResponse(requestData, "attack");
    }

    async getStrategicDecision(gameStateManager){
        this.totalStrategicCalls += 1
        const currentPlayer = gameStateManager.getCurrentPlayer();
        const mapManager = gameStateManager.mapManager;
        const movementController = gameStateManager.movementController;
        const objectiveDescription = currentPlayer.objective.description;
        const validMoves = [];

        Array.from(currentPlayer.ownedTerritories).forEach(source => {
            const availableTroops = movementController.getAvailableTroops(source);
            if (availableTroops < 1) {
                return;
            }

            const isBorderSource = Array.from(source.neighbors).some(neighborId => {
                const neighbor = mapManager.getTerritory(neighborId);
                return neighbor && neighbor.owner !== currentPlayer;
            });

            Array.from(source.neighbors).forEach(neighborId => {
                const target = mapManager.getTerritory(neighborId);
                if (target && target.owner === currentPlayer){
                    const isBorderTarget = Array.from(target.neighbors).some(nId => {
                        const neighbor = mapManager.getTerritory(nId);
                        return neighbor && neighbor.owner !== currentPlayer;
                    });

                    validMoves.push({
                        fromId: source.id,
                        fromName: source.name,
                        fromTroops: source.troops,
                        fromContinent: source.continent,
                        fromIsBorder: isBorderSource,
                        toId: target.id,
                        toName: target.name,
                        toTroops: target.troops,
                        toContinent: target.continent,
                        toIsBorder: isBorderTarget,
                        availableTroops: availableTroops
                    });
                }
            });
        });

        const requestData = {
            data: {
                objectiveDescription: objectiveDescription,
                validMoves: validMoves,
                botName: currentPlayer.name,
            }
        };
        return await this.getBotResponse(requestData, "strategic");
    }

    // FALLBACKS

    getFallbackReinforcement(gsm, currentPlayer){
        this.reinforcementFallbackCount += 1
        const available = currentPlayer.availableTroops;
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
        this.attackFallbackCount += 1;
    }

    getFallbackStrategic(){
        this.strategicFallbackCount += 1;
        return {action: "strategic", skipMove: true};
    }

}