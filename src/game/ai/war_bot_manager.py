from openai import OpenAI
import json

class WarBotManager:
    def __init__(self, model_name="llama-3.2-3b-instruct", base_url="http://localhost:1234/v1", temperature=0.2):
        """
        Inicializa a conexão com o LM Studio.
        
        :param model_name: Nome do modelo carregado no LM Studio (pode ser qualquer string geralmente).
        :param base_url: URL padrão do LM Studio.
        :param temperature: Baixa temperatura (0.2) para garantir respostas lógicas e determinísticas.
        """
        self.client = OpenAI(base_url=base_url, api_key="lm-studio")
        self.model_name = model_name
        self.temperature = temperature
        
        self.system_prompt = """
        Você é um general especialista no jogo de tabuleiro War.
        Seu objetivo é conquistar territórios estrategicamente e eliminar oponentes.
        
        Você receberá o estado atual do jogo em JSON.
        Você DEVE responder APENAS com um JSON válido contendo sua próxima jogada.
        Não inclua explicações ou texto fora do JSON.
        
        O formato de resposta deve ser:
        {
            "razao_estrategica": "Explique detalhadamente a lógica por trás da sua jogada."
            "fase": "ataque",
            "origem": "Nome do Território",
            "destino": "Nome do Território",
            "qtd_exercitos": int,
        }
        """

    def get_strategic_move(self, game_state):
        """
        Envia o estado do jogo para o LLM e retorna a jogada estruturada.
        
        :param game_state: Dicionário ou String JSON com o estado atual (mapa, exércitos, cartas).
        """
        if isinstance(game_state, dict):
            game_state_str = json.dumps(game_state, ensure_ascii=False)
        else:
            game_state_str = game_state

        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"Estado atual do jogo: {game_state_str}. Qual é a sua próxima jogada?"}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=self.temperature,
                max_tokens=1000,
            )
            
            raw_content = response.choices[0].message.content
            return self._parse_response(raw_content)

        except Exception as e:
            print(f"Erro na comunicação com LM Studio: {e}")
            return None

    def _parse_response(self, content):
        """
        Tenta extrair e validar o JSON da resposta do LLM.
        Muitos LLMs 'conversam' antes de dar o JSON, então precisamos limpar.
        """
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            try:
                start = content.find('{')
                end = content.rfind('}') + 1
                if start != -1 and end != -1:
                    json_str = content[start:end]
                    return json.loads(json_str)
                else:
                    print(f"Não foi possível encontrar JSON na resposta: {content}")
                    return None
            except Exception as e:
                print(f"Erro ao fazer parse do JSON: {e}")
                return None

if __name__ == "__main__":
    # 1. Instancie o bot (certifique-se que o LM Studio está rodando o servidor)
    bot = WarBotManager()

    # 2. Simule um estado do jogo (vinda do seu backend)
    estado_jogo_exemplo = {
        "meus_territorios": {
            "Brasil": 5,
            "Argentina": 2
        },
        "vizinhos_inimigos": {
            "Brasil": ["Norte da África (Inimigo A, 2 tropas)", "Venezuela (Inimigo B, 1 tropa)"],
            "Argentina": ["Uruguai (Inimigo B, 1 tropa)"]
        },
        "objetivo": "Conquistar a África e a América do Sul",
        "fase_atual": "ataque"
    }

    print("Consultando o General IA...")
    jogada = bot.get_strategic_move(estado_jogo_exemplo)
    
    if jogada:
        print("\n--- Jogada Decidida ---")
        print(json.dumps(jogada, indent=2, ensure_ascii=False))
    else:
        print("O bot não conseguiu decidir.")