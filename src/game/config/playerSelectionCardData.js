import { COLORS } from "./colors";
import { defineComponent } from "../utils/defineComponent";

const SCENE_PADDING = {
    x: 58,
    y: 85
};

export const CARDS = {
    y: SCENE_PADDING.y,
    width: 220,
    height: 550,
    spacing: 16
};

export const COMPONENTS = {
    name: defineComponent(null, 32),
    image: defineComponent({ y: CARDS.y, height: 32 }, 448, 6),
    selector: defineComponent({ y: CARDS.y + 32 + 6, height: 448 }, 64)
}

export const ARROW_Y = CARDS.y + 509;
const LEFT_ARROW_OFFSET = 24;
const RIGHT_ARROW_OFFSET = 189;  

const PLAYER_COLORS = [
  COLORS.brand,
  COLORS.pink,
  COLORS.blue,
  COLORS.orange,
  COLORS.purple
];

export const PLAYER_NAMES = [
    'Neumann',
    'Lovelace',
    'Hopper',
    'Turing',
    'Dijkstra'
]

export const CARD_LAYOUTS = PLAYER_COLORS.map((color, index) => {
    const cardX = SCENE_PADDING.x + index * (CARDS.width + CARDS.spacing);
    const leftArrowX = cardX + LEFT_ARROW_OFFSET;
    const rightArrowX = cardX + RIGHT_ARROW_OFFSET;

    return {
        x: cardX,
        color,
        leftArrowX,
        rightArrowX
    };
});
