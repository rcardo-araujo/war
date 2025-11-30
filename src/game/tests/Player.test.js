import Player from '../gameObjects/Player.js';

const mockTerritory = (continent) => ({ getContinent: () => continent });

describe('Lógica de Reforços', () => {
    test('Deve retornar o mínimo de 3 exércitos se tiver poucos territórios', () => {
        const player = new Player('Test', 'Red');
        player.addTerritory(mockTerritory('south_america'));
        
        expect(player.calculateReinforcements()).toBe(3);
    });

    test('Deve calcular corretamente para muitos territórios', () => {
        const player = new Player('Test', 'Red');
        for(let i=0; i<12; i++) player.addTerritory(mockTerritory('asia'));

        expect(player.calculateReinforcements()).toBe(6);
    });
});

describe('Bônus de Continente', () => {
    test('Deve conceder bônus da América do Sul ao possuir 4 territórios', () => {
        const player = new Player('Test', 'Blue');
        
        for (let i = 0; i < 4; i++) {
            player.addTerritory(mockTerritory('south_america'));
        }
        
        player.setContinentBonus();
        
        expect(player.availableTroopsSouthAmerica).toBe(2);
    });

    test('NÃO deve conceder bônus se faltar um território', () => {
        const player = new Player('Test', 'Blue');
        
        for (let i = 0; i < 3; i++) {
            player.addTerritory(mockTerritory('south_america'));
        }
        
        player.setContinentBonus();
        
        expect(player.availableTroopsSouthAmerica).toBe(0);
    });
});

describe('Alocação de Tropas (Consumo)', () => {
    test('Deve consumir bônus específico antes do global', () => {
        const player = new Player('Test', 'Green');
        player.availableTroopsSouthAmerica = 2;
        player.availableTroops = 10;

        const territoryInSA = mockTerritory('south_america');
        
        player.allocateTroops(territoryInSA, 3);

        expect(player.availableTroopsSouthAmerica).toBe(0);
        expect(player.availableTroops).toBe(9);
    });
});