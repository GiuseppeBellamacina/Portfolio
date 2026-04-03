/**
 * Simple typing/deleting text rotation effect.
 * Calls `onUpdate` with the current substring on each tick.
 */
export function startTypingEffect(texts: string[], onUpdate: (text: string) => void): void {
	let textIndex = 0;
	let charIndex = 0;
	let isDeleting = false;
	let isPaused = false;

	function tick() {
		const currentText = texts[textIndex];

		if (isPaused) {
			isPaused = false;
			isDeleting = true;
			setTimeout(tick, 1200);
			return;
		}

		if (isDeleting) {
			charIndex--;
			onUpdate(currentText.substring(0, charIndex));

			if (charIndex === 0) {
				isDeleting = false;
				textIndex = (textIndex + 1) % texts.length;
				setTimeout(tick, 300);
			} else {
				setTimeout(tick, 25);
			}
		} else {
			charIndex++;
			onUpdate(currentText.substring(0, charIndex));

			if (charIndex === currentText.length) {
				isPaused = true;
				setTimeout(tick, 1200);
			} else {
				setTimeout(tick, 70);
			}
		}
	}

	setTimeout(tick, 1000);
}
