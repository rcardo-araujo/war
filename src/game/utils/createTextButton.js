import { COLORS } from "../config/colors";

export function createTextButton(scene, x, y, label, fontSize, onClick) {
    const text = scene.add.text(0, 0, label, {
        fontFamily: 'JetBrainsMono',
        fontSize: fontSize,
        fontStyle: 'bold',
        color: '#1c1c1c',
        align: 'center'
    })
    .setOrigin(0.5);

    const paddingX = 0.2 * text.width;
    const paddingY = 0.2 * text.height;
    
    const background = scene.add.rectangle(
        0, 0, 
        text.width + paddingX, 
        text.height + paddingY, 
        COLORS.brand, 1
    )
    .setOrigin(0.5);

    const container = scene.add.container(
        x, y,
        [background, text]
    );

    container.setSize(background.width, background.height);
    container.setInteractive({ useHandCursor: true })
    container.setDepth(100);

    container.on('pointerover', () => {  
        scene.sound.play('hover-sound', { volume: 0.9 }); 
    });

    container.on('pointerdown', () => {
        scene.sound.play('click-sound', { volume: 0.5 });
        onClick(); 
    });

    return container;
}