import { describe, it, expect, vi, beforeEach } from 'vitest';
import PlayerManager from '../managers/PlayerManager';
import Player from '../gameObjects/Player';
import Objective from '../gameObjects/Objective';

vi.mock('../utils/objectiveDistribution', () => ({
    shuffleInPlace: vi.fn(),
    chooseObjectiveType: vi.fn(),
    getRandomOpponent: vi.fn()
}));

describe('PlayerManager Logic', () => {
    let manager;
    let p1, p2, p3;

    beforeEach(() => {
        manager = new PlayerManager([], null);
        
        p1 = new Player('Hero', '#0000FF', 'blue');
        p2 = new Player('Target', '#FF0000', 'red');
        p3 = new Player('ThirdParty', '#00FF00', 'green');

        const dummyObj = new Objective({ type: 'conquest', main: {} });
        p1.setObjective(dummyObj);
        p2.setObjective(dummyObj);
        p3.setObjective(dummyObj);
        
        manager.players = [p1, p2, p3];
    });

    describe('Objetivo de Destruição', () => {
        it('Deve retornar TRUE se o jogador destruir seu alvo', () => {
            const killObjective = new Objective({
                type: 'destruction',
                main: { targetColor: 'red' },
                target: p2
            });
            p1.setObjective(killObjective);

            p2.ownedTerritories = new Set(); 
            manager.totalTroopsForPlayer = vi.fn().mockReturnValue(0); 

            const result = manager.checkDestructionObjective(p1, p2);
            expect(result).toBe(true);
        });

        it('Deve trocar o objetivo para fallback se OUTRA pessoa destruir o alvo', () => {
            
            const fallbackObj = new Objective({ type: 'conquest', description: 'Fallback' });
            
            const killObjective = new Objective({
                type: 'destruction',
                target: p2,
                fallback: fallbackObj,
                default: fallbackObj
            });
            
            p1.setObjective(killObjective);
            manager.totalTroopsForPlayer = vi.fn().mockReturnValue(0);

            manager.checkDestructionObjective(p3, p2);

            expect(p1.objective).toBe(fallbackObj);
            expect(p1.objective.type).toBe('conquest');
        });
    });

    describe('Objetivo de Continentes (Mockando MapManager)', () => {
        it('Deve validar conquista de continentes corretamente', () => {
            const t1 = { continent: 'South America', id: 1 };
            const t2 = { continent: 'South America', id: 2 };
            
            const mockMapManager = {
                territories: { '1': t1, '2': t2 }
            };

            p1.addTerritory(t1);
            p1.addTerritory(t2);

            const continentObj = new Objective({
                type: 'conquest',
                main: { continents: ['South America'] }
            });
            p1.setObjective(continentObj);

            const result = manager.checkContinentObjective(p1, mockMapManager);
            expect(result).toBe(true);
        });

        it('Deve falhar se faltar um território', () => {
             const t1 = { continent: 'South America', id: 1 };
             const t2 = { continent: 'South America', id: 2 };
             
             const mockMapManager = {
                 territories: { '1': t1, '2': t2 }
             };
 
             p1.addTerritory(t1);
 
             const continentObj = new Objective({
                 type: 'conquest',
                 main: { continents: ['South America'] }
             });
             p1.setObjective(continentObj);
 
             const result = manager.checkContinentObjective(p1, mockMapManager);
             expect(result).toBe(false);
        });
    });
});