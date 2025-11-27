import { GameObjects } from "phaser";
import { UIConfig } from "../config/uiConfig";
import { TURN_PHASES } from "../managers/TurnManager";

export class GameHUD extends GameObjects.Container {
    constructor(scene) {
        const config = UIConfig.hud;
        super(scene, config.container.x, config.container.y);

        this.leftPanel = scene.add.image(
            config.sidePanels.leftPanel.x, 
            config.sidePanels.y, 
            'side-panel'
        ).setOrigin(0, 0);

        this.rightPanel = scene.add.image(
            config.sidePanels.rightPanel.x, 
            config.sidePanels.y, 
            'side-panel'
        ).setOrigin(0, 0);

        this.centerBar = scene.add.image(
            config.centerBar.x, 
            config.centerBar.y, 
            'center-bar'
        ).setOrigin(0, 0);

        this.centerBarStroke = scene.add.image(
            config.centerBar.x, 
            config.centerBar.y, 
            'center-bar-stroke'
        ).setOrigin(0, 0);
        
        this.phaseLabelBackground = scene.add.image(
            config.phaseLabel.x, 
            config.phaseLabel.y, 
            'phase-label-background'
        ).setOrigin(0.5, 0.5);

        this.phaseLabel = scene.add.text(
            this.phaseLabelBackground.x, 
            this.phaseLabelBackground.y,
            'FORTIFICAÇÃO', 
            config.phaseLabel.textStyle
        ).setOrigin(0.5, 0.5);

        this.phaseIcon = scene.add.image(
            config.phaseIcons.x,
            config.phaseIcons.y,
            'icon-fortify-phase' 
        ).setOrigin(0.5, 0.5);

        this.phaseBars = {};
        const barConfig = config.phaseBars;
        
        ['fortify', 'attack', 'relocate'].forEach(phase => {
            this.phaseBars[phase] = scene.add.image(
                barConfig.x + barConfig.offsets[phase],
                barConfig.y,
                'phase-bar-inactive'
            ).setOrigin(0, 0);
        });

        this.nextButton = scene.add.image(
            config.nextTurnButton.x, 
            config.nextTurnButton.y, 
            'button-next-turn'
        )
        .setOrigin(0.5, 0.5)
        .setInteractive({ cursor: 'pointer' });

        this.nextButtonText = scene.add.text(
            this.nextButton.x,
            this.nextButton.y,
            'PRÓXIMO',
            config.nextTurnButton.textStyle
        ).setOrigin(0.5, 0.5);

        this.territoryCards = scene.add.image(
            config.territoryCards.x,
            config.territoryCards.y,
            'territory-cards'
        ).setOrigin(0.5);

        this.territoryCardsCount = scene.add.text(
            config.territoryCardsCount.x,
            config.territoryCardsCount.y,
            '0',
            config.territoryCardsCount.textStyle
        ).setOrigin(0.5, 0.5);

        this.add([
            this.centerBar, 
            this.centerBarStroke,
            this.leftPanel, 
            this.rightPanel, 
            this.phaseIcon,
            this.territoryCards,
            this.territoryCardsCount,
            this.phaseLabelBackground, 
            this.phaseLabel,
            ...Object.values(this.phaseBars),
            this.nextButton,
            this.nextButtonText
        ]);

        scene.add.existing(this);
    }

    updatePhase(currentPhase) {
        const fortifyConfig = {
            text: 'FORTIFICAÇÃO',
            icon: 'icon-fortify-phase',
            activeBar: 'fortify'
        };

        const phaseConfig = {
            [TURN_PHASES.FIRST_REINFORCEMENT]: fortifyConfig,
            [TURN_PHASES.REINFORCEMENT]: fortifyConfig,
            [TURN_PHASES.ATTACK]: { 
                text: 'ATAQUE',
                icon: 'icon-attack-phase',
                activeBar: 'attack'
            },
            [TURN_PHASES.STRATEGIC]: { 
                text: 'MOVIMENTAÇÃO',
                icon: 'icon-relocation-phase',
                activeBar: 'relocate'
            },
            [TURN_PHASES.END]: { 
                text: 'FIM DE TURNO',
                icon: 'icon-fortify-phase',
                activeBar: null
            }
        };

        const config = phaseConfig[currentPhase];

        if (config) {
            this.phaseLabel.setText(config.text);
            
            this.phaseIcon.setTexture(config.icon);

            Object.keys(this.phaseBars).forEach(key => {
                const isActive = (key === config.activeBar);
                this.phaseBars[key].setTexture(isActive ? 'phase-bar-active' : 'phase-bar-inactive');
            });

            if (currentPhase === TURN_PHASES.STRATEGIC || currentPhase === TURN_PHASES.FIRST_REINFORCEMENT) {
                this.nextButtonText.setText('ENCERRAR');
            } else {
                this.nextButtonText.setText('PRÓXIMO');
            }
        }
    }

    updateColor(color) {
        this.leftPanel.setTint(color);
        this.rightPanel.setTint(color);
        this.centerBarStroke.setTint(color);
        this.nextButton.setTint(color);
    }

    updateTerritoryCardsCount(count) {
        this.territoryCardsCount.setText(count.toString())
    }
}