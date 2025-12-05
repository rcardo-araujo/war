import { describe, it, expect, vi, beforeEach } from 'vitest';

const { MockEventEmitter } = vi.hoisted(() => {
    class MockEventEmitter {
        constructor() {
            this.listeners = {};
        }
        
        on(event, fn, context) {
            if (!this.listeners[event]) {
                this.listeners[event] = [];
            }
            this.listeners[event].push({ fn, context });
            return this;
        }

        emit(event, ...args) {
            if (!this.listeners[event]) return false;
            
            this.listeners[event].forEach(listener => {
                const contextToUse = listener.context ? listener.context : this;
                listener.fn.call(contextToUse, ...args);
            });
            return true;
        }
        
        off() { return this; }
        destroy() { this.listeners = {}; }
        shutdown() {}
    }

    return { MockEventEmitter };
});

vi.mock('phaser', () => {
    return {
        default: { 
            Events: { EventEmitter: MockEventEmitter } 
        },
        
        EventEmitter: MockEventEmitter, 

        Events: { EventEmitter: MockEventEmitter },
        
        Math: { RND: { pick: (arr) => arr[0] } }
    };
});

vi.stubGlobal('Phaser', {
    Events: { EventEmitter: MockEventEmitter }
});

vi.stubGlobal('localStorage', {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
});

vi.mock('../../services/BotService', () => {
    return {
        default: class MockBotService {
            constructor() {
                this.checkIfPreviousPlayerWasBot = vi.fn();
                this.getReinforcementDecision = vi.fn();
                this.getAttackDecision = vi.fn();
                this.getStrategicDecision = vi.fn();
                this.getFallbackReinforcement = vi.fn();
                this.getFallbackAttack = vi.fn();
                this.getFallbackStrategic = vi.fn();
            }
        }
    };
});

vi.mock('../../utils/diceRoller', () => ({
    executeCombat: vi.fn(() => [0, 1]) 
}));

import GameStateManager from '../../managers/GameStateManager';
import { TURN_PHASES } from '../../managers/TurnManager';

const MOCK_MAP_DATA = {
    territories: [
        { id: 't1', name: 'Brasil', continent: 'south_america', neighbors: ['t2'] },
        { id: 't2', name: 'Argentina', continent: 'south_america', neighbors: ['t1'] },
        { id: 't3', name: 'Angola', continent: 'africa', neighbors: [] }
    ],
    continents: {
        'south_america': { bonus: 2 },
        'africa': { bonus: 3 }
    }
};

const MOCK_OBJECTIVES = {
    fallback: { type: 'conquest', description: 'Conquistar 24 territórios' },
    conquest: [],
    types: ['conquest']
};

const createMockScene = () => ({
    cache: {
        json: {
            get: (key) => {
                if (key === 'mapData') return MOCK_MAP_DATA;
                if (key === 'objectivesData') return MOCK_OBJECTIVES;
                return {};
            }
        }
    }
});

// --- SUÍTE DE TESTES ---
describe('Integração: GSM <-> GameController', () => {
    let gsm;
    let p1, p2;

    beforeEach(() => {
        const mockScene = createMockScene();
        const playerSetup = [
            { name: 'Human', color: '#0000FF', type: 'human' },
            { name: 'Enemy', color: '#FF0000', type: 'human' }
        ];

        gsm = new GameStateManager(mockScene, playerSetup);
        
        [p1, p2] = gsm.playerManager.getPlayers();

        const t1 = gsm.mapManager.getTerritory('t1'); 
        const t2 = gsm.mapManager.getTerritory('t2'); 

        t1.owner = p1; 
        p1.addTerritory(t1);
        t1.troops = 5;

        t2.owner = p2;
        p2.addTerritory(t2);
        t2.troops = 1;
        
        gsm.turnManager.currentPlayerIndex = 0;
    });

    it('Fluxo Completo: Alocação de Tropas -> Atualização de Estado', () => {
        p1.availableTroops = 5;
        const brasil = gsm.mapManager.getTerritory('t1');
        
        gsm.emit('troopsAllocated', { troops: 3, territory: brasil });

        expect(brasil.troops).toBe(8); 
        expect(p1.availableTroops).toBe(2); 

        const spy = vi.spyOn(gsm, 'emit');
        gsm.emit('troopsAllocated', { troops: 1, territory: brasil });
        expect(spy).toHaveBeenCalledWith('game:troopCountChanged', 't1');
    });

    it('Fluxo Completo: Combate -> Conquista de Território', () => {
        gsm.turnManager.currentPhase = TURN_PHASES.ATTACK;

        const brasil = gsm.mapManager.getTerritory('t1'); 
        const argentina = gsm.mapManager.getTerritory('t2'); 

        gsm.emit('ui:territoryClicked', brasil);
        expect(gsm.gameController.attackTerritories.attacker).toBe(brasil);

        gsm.emit('ui:territoryClicked', argentina);
        expect(gsm.gameController.attackTerritories.defender).toBe(argentina);

        gsm.emit('game:attackCommitted', {
            attackDice: 3,
            attacker: brasil,
            defender: argentina
        });

        expect(argentina.owner).toBe(p1);
        expect(p1.ownedTerritories.has(argentina)).toBe(true);
        expect(argentina.troops).toBe(3); 
        expect(brasil.troops).toBe(2);    
    });

    it('Fluxo Completo: Passagem de Turno', () => {
        const jogadorInicial = gsm.getCurrentPlayer();
        gsm.turnManager.endTurn();

        const novoJogador = gsm.getCurrentPlayer();

        expect(gsm.gameController.capture).toBe(false);
        expect(novoJogador).not.toBe(jogadorInicial);
    });
});