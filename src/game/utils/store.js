export function storePlayers(players, currentPlayer){
        let playerCount = players.length;
        let pc = playerCount.toString();
        localStorage.setItem('playerCount', pc);
        for(let i = 0; i < playerCount; i++){
            let p = 'player' + i.toString();
            let player = players [i]
            localStorage.setItem(p, JSON.stringify(player, replacerP))
            console.log(localStorage.getItem(p));
        }
        localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
        loadPlayers();
    }

function replacerP(key,value){
    let mark = 'continent'
    if (key=="objective") return undefined;
    else if (key.includes(mark)) return undefined;
    else return value;
}

export function storeTerritories(territories){
    localStorage.setItem('territories', JSON.stringify(territories, replacerT));
    console.log(localStorage.getItem('territories'))
}

function replacerT(key,value){
    if (key=="owner") return value.name;
    else return value;
}

export function deleteOngoingGame(){
    localStorage.removeItem('players');
    localStorage.removeItem('currentPlayer');
    localStorage.removeItem('territories');
    localStorage.clear();
}

export function loadPlayers(){
    let n = Number(localStorage.getItem('playerCount'));
    for (let i = 0; i < n; i++){
        let p = 'player' + i.toString();
        console.log(localStorage.getItem(p+'name'));
        console.log(localStorage.getItem(p+'color'));
        console.log(localStorage.getItem(p+'colorKey'));
        console.log(localStorage.getItem(p+'ownedTerritories'));
        console.log(localStorage.getItem(p+'territoryCards'));
        console.log(localStorage.getItem(p+'availableTroops'));
        console.log(localStorage.getItem(p+'type'));
    }
}

function savePlayer(string, player){
    localStorage.setItem(string+'name', JSON.stringify(player.name));
    localStorage.setItem(string+'ownedTerritories', JSON.stringify(player.ownedTerritories));
    localStorage.setItem(string+'territoryCards', JSON.stringify(player.territoryCards));
    localStorage.setItem(string+'availableTroops', JSON.stringify(player.availableTroops));
    localStorage.setItem(string+'type', JSON.stringify(player.type));
}
