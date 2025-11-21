import Territory from "../gameObjects/Territory";

export function executeCombat(attackingTroops, defenseTerritory) {
    const defense = Math.min(3,defenseTerritory.getTroopCount());
    // gera valores em ordem decrescente
    let attackDice = rollDice(attackingTroops);
    let defenseDice = rollDice(defense);
    let casualties = [0,0]
    // compara os dados
    let battles = Math.min(defense, attackingTroops);

    for (let fight = 0; fight < battles; fight++) {
        if(attackDice[fight] > defenseDice[fight]){
            casualties[1]++;
        } else{
            casualties[0]++;
        }
    }
    // TODO: adicionar visual de dados depois
    console.log(`Resultado do combate - Atacante perdeu: ${casualties[0]}, Defensor perdeu: ${casualties[1]}`);
    return casualties;
}

function rollDice(ammount) {
    let result = []

        //adicionar efeito visual para a rolagem de dados

    for(let roll = 0; roll < ammount; roll++) {
        result.push(1+Math.floor(Math.random()*6))
    }
    result.sort();
    result.reverse();
    return result;
}
