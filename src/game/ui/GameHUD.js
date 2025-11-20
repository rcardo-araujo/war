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

        this.add([
            this.centerBar, 
            this.leftPanel, 
            this.rightPanel, 
            this.phaseLabelBackground, 
            this.phaseLabel,
            ...Object.values(this.phaseBars),
            this.nextButton,
            this.nextButtonText
        ]);

        scene.add.existing(this);
    }

    updatePhase(currentPhase) {
        const texts = {
            [TURN_PHASES.REINFORCEMENT]: 'FORTIFICAÇÃO',
            [TURN_PHASES.ATTACK]: 'ATAQUE',
            [TURN_PHASES.STRATEGIC]: 'MOVIMENTAÇÃO',
            [TURN_PHASES.END]: 'FIM DE TURNO'
        };
        this.phaseLabel.setText(texts[currentPhase]);

        Object.keys(this.phaseBars).forEach(key => {
            let isActive = false;
            if (key === 'fortify' && currentPhase === TURN_PHASES.REINFORCEMENT) isActive = true;
            if (key === 'attack' && currentPhase === TURN_PHASES.ATTACK) isActive = true;
            if (key === 'relocate' && currentPhase === TURN_PHASES.STRATEGIC) isActive = true;

            this.phaseBars[key].setTexture(isActive ? 'phase-bar-active' : 'phase-bar-inactive');
        });
    }
}