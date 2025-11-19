# server.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from war_bot_manager import WarBotManager

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot_manager = WarBotManager()

class GameState(BaseModel):
    dados_jogo: dict

@app.post("/pedir-jogada")
async def ask_bot_move(state: GameState):
    """
    Recebe o estado do Phaser, manda pro LM Studio e devolve a jogada.
    """
    try:
        print("Recebendo pedido do Phaser...")
        jogada = bot_manager.get_strategic_move(state.dados_jogo)
        
        if not jogada:
            raise HTTPException(status_code=500, detail="O Bot não conseguiu gerar uma jogada válida.")
            
        return jogada
    except Exception as e:
        print(f"Erro no servidor: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)