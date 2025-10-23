export function shuffleInPlace(array){
    for (let i = array.length - 1; i > 0; i -= 1){
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function chooseObjectiveType(types, conquestDeckSize, playerCount){
    if (playerCount < 2){
        return "conquest";
    }
    const filteredTypes = types.filter(type => type === "conquest" ? conquestDeckSize > 0 : true);
    if (filteredTypes.length === 0){
        return conquestDeckSize > 0 ? "conquest" : "destruction";
    }

    const randomIndex = Math.floor(Math.random() * filteredTypes.length);
    return filteredTypes[randomIndex];
}