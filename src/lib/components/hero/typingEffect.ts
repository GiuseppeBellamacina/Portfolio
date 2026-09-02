/**
 * Simple typing/deleting text rotation effect.
 * Calls `onUpdate` with the current substring on each tick.
 */
export function startTypingEffect(
	getTexts: () => string[],
	onUpdate: (text: string) => void
): () => void {
	let texts = getTexts();
	let textIndex = 0;
	let charIndex = 0;
	let isDeleting = false;
	let isPaused = false;
	let timeout: ReturnType<typeof setTimeout> | undefined;
	let cancelled = false;

	function tick() {
		if (cancelled) return;
		// Refresh texts only between words (charIndex === 0) to avoid mid-word swaps
		if (charIndex === 0 && !isDeleting) {
			texts = getTexts();
			if (textIndex >= texts.length) textIndex = 0;
		}
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

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) onUpdate(texts.join(' '));
	else timeout = setTimeout(tick, 1000);
	return () => {
		cancelled = true;
		if (timeout !== undefined) clearTimeout(timeout);
	};
}
