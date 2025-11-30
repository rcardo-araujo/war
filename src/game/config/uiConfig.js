import { toHex } from '../utils/toHex.js';
import { COLORS } from './colors.js';
import { GameConfig } from './gameConfig.js';

export const UIConfig = {
    objectiveCard: {
        x: GameConfig.centerX,
        y: GameConfig.centerY
    },
    targetButton: {
        x: GameConfig.width - 67,
        y: GameConfig.height - 72
    },
    hud: {
        container: {
            x: 439,
            y: 607
        },
        centerBar: {
            x: 87,
            y: 8
        },
        sidePanels: {
            leftPanel: {
                x: -3
            },
            rightPanel: {
                x: 319
            },
            y: 0
        },
        phaseLabel: {
            x: 408.97 / 2,
            y: 8,
            textStyle: {
                fontSize: '12px',
                fontFamily: 'JetBrainsMono',
                fontStyle: 'bold',
                color: COLORS.primary,
                align: 'center'
            }
        },
        nextTurnButton: {
            x: 408.97 / 2,
            y: 91 - (28 / 2),
            textStyle: {
                fontSize: '16px',
                fontFamily: 'JetBrainsMono',
                color: toHex(COLORS.primary),
                align: 'center'
            }
        },
        phaseBars: {
            x: 107,
            y: 36,
            offsets: {
                fortify: 0,
                attack: 70,
                relocate: 140
            }
        },
        phaseIcons: {
            x: 86.97 / 2,
            y: (84.95 + 6) / 2
        },
        territoryCards: {
            x: 408.97 - (86.97 / 2),
            y: (84.95 + 6) / 2
        },
        territoryCardsCount: {
            x: 408.97 - (86.97 / 2),
            y: 84.95 / 2,
            textStyle: {
                fontSize: '22px',
                fontFamily: 'JetBrainsMono',
                color: toHex(COLORS.white),
                align: 'center'
            }
        }
    }
}