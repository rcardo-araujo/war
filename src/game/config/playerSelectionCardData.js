import { COLOR } from "./colors";
import { defineComponent } from "../utils/defineComponent";

export const SCENE_PADDING = {
    x: 58,
    y: 85
};

export const CARD = {
    y: SCENE_PADDING.y,
    width: 220,
    height: 550,
    spacing: 16
};

export const COMPONENTS = {
    name: defineComponent(null, 32),
    image: defineComponent({ y: CARD.y, height: 32 }, 448, 6),
    selector: defineComponent({ y: CARD.y + 32 + 6, height: 448 }, 64)
}

export const ARROW_Y = CARD.y + 509;
const LEFT_ARROW_OFFSET = 24;
const RIGHT_ARROW_OFFSET = 189;  

const PLAYER_COLORS = [
  COLOR.brand,
  COLOR.pink,
  COLOR.blue,
  COLOR.orange,
  COLOR.purple
];

export const CARD_LAYOUTS = PLAYER_COLORS.map((color, index) => {
    const cardX = SCENE_PADDING.x + index * (CARD.width + CARD.spacing);
    const leftArrowX = cardX + LEFT_ARROW_OFFSET;
    const rightArrowX = cardX + RIGHT_ARROW_OFFSET;

    return {
        x: cardX,
        color,
        leftArrowX,
        rightArrowX
    };
});
