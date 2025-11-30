export function storePlayers(players, currentPlayer){
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
    }

export function storeTerritories(territories){
        localStorage.setItem('territories', JSON.stringify(territories));
    }
