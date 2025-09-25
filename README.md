# WAR: 2048

## Requisitos
- [Node.js](https://nodejs.org) instalado (recomendado: versão LTS mais recente).

## Iniciando o Projeto
Após clonar o repositório, execute `npm install` no diretório do seu projeto para instalar as dependências. Em seguida, você pode iniciar o servidor de desenvolvimento local com `npm run dev`.

O servidor de desenvolvimento local inicia em http://localhost:8080 por padrão. O Vite recompilará automaticamente seu código e recarregará o navegador ao editar arquivos na pasta `src`.

```bash
npm install   # instala dependências
npm run dev   # inicia servidor em http://localhost:8080
```

## Estrutura do Projeto
O projeto utiliza React para a interface e Phaser para o jogo. 

| Caminho                | Descrição                                |
|-------------------------|------------------------------------------|
| `index.html`            | Página HTML base do jogo                  |
| `src/`                  | Código-fonte do cliente React                             |
| `src/App.jsx`           | Componente React principal da aplicação          |
| `src/PhaserGame.jsx`    | Componente que inicializa o jogo Phaser e serve como ponte entre React e Phaser               |
| `src/game/`             | Código-fonte do jogo Phaser               |
| `src/game/EventBus.js`  | Ônibus de eventos (_event bus_) que facilita a comunicação entre React e Phaser
| `src/game/scenes/`      | Cenas do Phaser (_Phaser Scenes_)                          |
| `public/assets/`        | Recursos estáticos (imagens, sons, etc.) |

## Comunicação React e Phaser
O componente `src/PhaserGame.jsx` é a ponte central, gerenciando a inicialização do jogo Phaser e a passagem de eventos entre os dois.

### Event Bus
Para a comunicação entre os dois frameworks, use o `src/EventBus.js`. Ele permite emitir e escutar eventos tanto do React quanto do Phaser.

```js
// React
import { EventBus } from './EventBus';

// Emite um evento
EventBus.emit('evento', data);

// Phaser
// Escutando um evento
EventBus.on('evento', (data) => { ... });
```
### Expondo _Scenes_ para o React

Para que o React saiba qual é a cena ativa do Phaser e possa interagir com ela, a própria Cena Phaser deve emitir o evento `"current-scene-ready"`:

```js
import { EventBus } from '../EventBus';

class MinhaCena extends Phaser.Scene
{
    constructor ()
    {
        super('MinhaCena');
    }

    create ()
    {
        // ... Lógica do jogo

        // No final do create:
        EventBus.emit('current-scene-ready', this);
    }
}
```

## Assets 

Para arquivos (_assets_) (como áudio, vídeos ou folhas de sprites), coloque-os na pasta `public/assets`. Eles são carregados diretamente pelo caminho no Loader do Phaser:

```js
preload () {
    this.load.image('background', 'assets/background.png');
}
```

## Build e Deploy
Para gerar o código de produção, execute o comando de build:

```bash
npm run build
```
- Resultado salvo em `dist/`
- Para implantar o jogo, você deve subir todo o conteúdo da pasta dist/ para o seu servidor web.
