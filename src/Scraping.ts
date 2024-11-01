export function ImportFromUltimateGuitar() {
    if (!location.host.match(/ultimate-guitar\.com/i)) return;

    const sourceElement = document.querySelector("pre");
    const title = document.querySelector("meta[property='og:title']");
    if (sourceElement) {
        let songTitle;
        let artist;
        if (title) {
            const titleContent = title.getAttribute("content") || '';
            const match = titleContent.match(/([^-]+) - (.+) \(.+\)$/);
            if (match) {
                artist = match[1];
                songTitle = match[2];
            }
        }

        const params = new URLSearchParams({text: sourceElement.innerText.replace(/X$/, '')});
        if (songTitle) params.set('title', songTitle);
        if (artist) params.set('artist', artist);

        const url = "https://bogoblin.github.io/chord-format/?"+params.toString();
        window.open(url, "_blank");
    }
}