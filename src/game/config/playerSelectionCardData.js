import { COLOR } from "./colors";
import { GameConfig } from "./gameConfig";

export const CARD_WIDTH = 220;
export const CARD_HEIGHT = 550;
export const CARD_SPACING = 16;
export const CARD_Y = (
    (GameConfig.height / 2) 
    - (CARD_HEIGHT / 2)
);

export const SCENE_PADDING_X = 58;

export const NAME_COMPONENT = { 
    height: 32, 
    y: CARD_Y
};

export const IMAGE_COMPONENT = { 
    height: 448,
    y: CARD_Y + NAME_COMPONENT.height + 6
};

export const SELECTOR_COMPONENT = {
    height: 64,
    y: IMAGE_COMPONENT.y + IMAGE_COMPONENT.height
};

export const CARD_LAYOUTS = {
    player1: {
        x: SCENE_PADDING_X,
        color: COLOR.brand
    },
    player2: {
        x: SCENE_PADDING_X + CARD_WIDTH + CARD_SPACING,
        color: COLOR.pink
    },
    player3: {
        x: SCENE_PADDING_X + (CARD_WIDTH + CARD_SPACING) * 2,
        color: COLOR.blue
    },
    player4: {
        x: SCENE_PADDING_X + (CARD_WIDTH + CARD_SPACING) * 3,
        color: COLOR.orange
    },
    player5: {
        x: SCENE_PADDING_X + (CARD_WIDTH + CARD_SPACING) * 4,
        color: COLOR.purple
    }
}
