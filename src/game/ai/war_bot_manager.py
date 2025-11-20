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

    def format_game_state_for_llm(self, game_state):
        """
        Transforma o estado do jogo JSON em um prompt narrativo e estruturado para LLMs.
        """
        player = game_state.get('player', 'Desconhecido').upper()
        objective = game_state.get('objective', 'Nenhum').replace('\n', ' ')
        troops = game_state.get('troopsToPlace', 0)
        phase = game_state.get('phase', '')

        prompt_text = (
            f"=== SITUAÇÃO ESTRATÉGICA DE WAR ===\n"
            f"VOCÊ É O JOGADOR: {player}\n"
            f"FASE ATUAL: {phase}\n"
            f"TROPAS DISPONÍVEIS PARA ALOCAR: {troops}\n"
            f"SEU OBJETIVO: {objective}\n\n"
            f"=== MAPA E FRONTEIRAS ===\n"
            f"Analise seus territórios atuais e a situação das fronteiras para decidir onde alocar as tropas:\n\n"
        )

        for t in game_state.get('ownedTerritories', []):
            name = t.get('territory').upper()
            current_troops = t.get('troops')
            
            prompt_text += f"- TERRITÓRIO: {name} (Suas tropas: {current_troops})\n"
            prompt_text += f"  Vizinhos/Fronteiras:\n"
            
            neighbors = t.get('neighbors', [])
            if not neighbors:
                prompt_text += "    (Nenhum vizinho listado)\n"
            
            for n in neighbors:
                n_id = n.get('id')
                n_owner = n.get('owner').upper()
                n_troops = n.get('troops')
                
                relation = "ALIADO" if n_owner == player else "INIMIGO"
                
                prompt_text += (
                    f"    -> {n_id}: Pertence a {n_owner} ({relation}) | "
                    f"Tropas: {n_troops}\n"
                )
            
            prompt_text += "\n"

        return prompt_text

    def get_reinforcement_move(self, game_state):
        reinforcement_prompt = '''
        Você é o WarAI, uma IA especialista em Teoria dos Jogos e estratégia militar no jogo War. 
        
        SUAS DIRETRIZES TÁTICAS (DOUTRINA):
        1. PROTEÇÃO DE FRONTEIRA: Se um território for importante para seu objetivo e estiver ameaçado, você DEVE reforçar para evitar perdê-lo.
        2. CONCENTRAÇÃO DE FORÇA: Aloque suas forças em NO MÁXIMO de dois territórios para criar pontos fortes, ao invés de espalhar suas tropas.
        3. FOCO NO OBJETIVO: Se houver vizinhos da cor ALVO do seu objetivo, priorize alocar tropas lá para preparar um ataque.

        Sua resposta deve ser ESTRITAMENTE um JSON válido seguindo este formato:
        {
            "analise_situacao": "Resumo curto das maiores ameaças e oportunidades identificadas no tabuleiro.",
            "estrategia_adotada": "Explique: 'Vou focar em defender X porque é um território valioso e está sob ameaças' ou 'Vou acumular em Y para atacar Z, seguindo em direção ao meu objetivo'.",
            "alocacoes": [
                {"territorio": "nome-territorio", "tropas": 1},
                {"territorio": "nome-territorio", "tropas": 1}
            ]
        }
        '''

        prompt_text = self.format_game_state_for_llm(game_state)
        print(prompt_text)

        messages = [
            {"role": "system", "content": reinforcement_prompt},
            {"role": "user", "content": f"{prompt_text}. Com base na situação, decida como alocar as suas tropas."}
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=self.temperature,
                max_tokens=2000,
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
    bot = WarBotManager()

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