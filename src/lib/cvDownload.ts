/**
 * Downloads the CV PDF via blob so no extra browser tab is ever opened.
 * Source is the GitHub raw URL (always up to date) — it sends
 * `Access-Control-Allow-Origin: *`, so the cross-origin fetch is allowed.
 */
const CV_URL = 'https://raw.githubusercontent.com/GiuseppeBellamacina/CurriculumVitae/main/cv.pdf';
const CV_FILENAME = 'Giuseppe_Bellamacina_CV.pdf';

export type CvDownloadState = 'idle' | 'loading' | 'done' | 'error';

export async function downloadCV(): Promise<boolean> {
	try {
		const res = await fetch(CV_URL);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = CV_FILENAME;
		document.body.appendChild(a);
		a.click();
		a.remove();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
		return true;
	} catch {
		// Last resort: plain anchor download (never navigates away or opens a tab).
		const a = document.createElement('a');
		a.href = CV_URL;
		a.download = CV_FILENAME;
		document.body.appendChild(a);
		a.click();
		a.remove();
		return false;
	}
}
