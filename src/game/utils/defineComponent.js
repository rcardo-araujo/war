import { CARDS } from "../config/playerSelectionCardData";

export function defineComponent(prev, height, offset = 0) {
    return {
        height,
        y: prev ? prev.y + prev.height + offset : CARDS.y
    };
}