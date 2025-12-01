export function storePlayers(players, currentPlayer){
        let playerCount = players.length;
        let pc = playerCount.toString();
        let n = players.indexOf(currentPlayer)
        localStorage.setItem('playerCount', pc);
        for(let i = n; i < playerCount+n; i++){
            const j = i - n;
            const p = 'player' + j.toString();
            let player = players [i%players.length]
            localStorage.setItem(p, JSON.stringify(player, replacerP))
        }
    }

function replacerP(key,value){
    let mark = 'continent'
    if (key=="objective") return undefined;
    else if (key.includes(mark)) return undefined;
    else return value;
}

export function storeTerritories(territories){
    localStorage.setItem('territories', JSON.stringify(territories, replacerT));
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

export function saveDataExists(){
    if (localStorage.getItem('territories')==null) return false;
    else return true;
}

export function loadTerritories(){
    return JSON.parse(localStorage.getItem('territories'));
}

export function loadPlayers(){
    const playerCount = Number(localStorage.getItem('playerCount'));
    let players = []
    for (let i = 0; i < playerCount; i++){
        const string = 'player' + i.toString();
        players.push(JSON.parse(localStorage.getItem(string)));
    }
    return players;
}