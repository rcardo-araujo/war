export class BotService {
    constructor(apiUrl = 'http://localhost:8000') {
        self.apiUrl = apiUrl;
    }

    async getBotMove(gameState) {
        try {
            const payload = {
                dados_jogo: gameState
            };

            console.log("Enviando estado para o General Python...", payload);

            const response = await fetch(`${self.apiUrl}/pedir-jogada`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Erro na API: ${response.statusText}`);
            }

            const jogada = await response.json();
            console.log("Jogada recebida do General:", jogada);
            return jogada;

        } catch (error) {
            console.error("Falha ao conectar com o cérebro do bot:", error);
            return null;
        }
    }
}