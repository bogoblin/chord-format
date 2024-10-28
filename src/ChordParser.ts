export type Line = {
    type: "annotation",
    text: string
} | {
    type: "section",
    title: string,
    text: string
} | {
    type: "chords",
    chords: [string, number][],
    text: string
} | {
    type: "lyrics",
    text: string
} | {
    type: "blank"
} | {
    type: "rule",
    text: string,
}

export function splitWordsFromPairedChords(pairs: {lyric: string, chord?: string | undefined}[]) {
    const words: {lyric: string, chord?: string | undefined}[][] = [];
    let currentWord: {lyric: string, chord?: string | undefined}[] = [];
    for (let index = 0; index < pairs.length; index++) {
        const {lyric, chord} = pairs[index];
        const wordsInPair: {lyric: string, chord?: string | undefined}[] = [];
        let endOfLastSpace = 0;
        for (const space of lyric.matchAll(/\s+/g)) {
            if (space.index > endOfLastSpace) {
                const word = lyric.substring(endOfLastSpace, space.index);
                endOfLastSpace = space.index + space[0].length;
                wordsInPair.push({
                    lyric: word
                }, {
                    lyric: space[0]
                })
            }
        }
        const remainder = lyric.substring(endOfLastSpace);
        if (remainder.length > 0) {
            wordsInPair.push({lyric: remainder});
        }
        if (wordsInPair.length > 0) {
            wordsInPair[0].chord = chord;
        }

        for (const word of wordsInPair) {
            if (word.lyric.match(/\s/g)) {
                words.push(currentWord);
                words.push([word]);
                currentWord = [];
            } else {
                currentWord.push(word);
            }
        }
    }
    words.push(currentWord);
    return words;
}

export function pairChordsWithLine(chords: [string, number][], line: string) {
    const result: { lyric: string, chord?: string }[] = [];
    const prelude = line.substring(0, chords[0][1]);
    if (prelude.length > 0) {
        result.push({lyric: prelude});
    }
    for (let index = 0; index < chords.length; index++) {
        const chord = chords[index];
        const nextChord = chords[index+1];
        let lyric;
        if (nextChord) {
            lyric = line.substring(chord[1], nextChord[1]);
        } else {
            lyric = line.substring(chord[1]);
        }

        result.push({
            lyric,
            chord: chord[0]
        });
    }
    return result;
}

export function identifyLines(chords: string) {
    const lines = chords.split("\n");
    const result : Line[] = [];
    for (let line of lines) {
        line = line.trimEnd();
        const prevLine = result[result.length - 1];
        if (/^\s*$/.test(line)) {
            if (prevLine && prevLine.type === "chords") {
                continue;
            }
            result.push({type: "blank"});
            continue;
        }
        if (!/[^-]/.test(line) || !/[^=]/.test(line)) {
            result.push({type: "rule", text: line});
            continue;
        }
        const sectionMatch = /\[(.+)]/.exec(line);
        if (sectionMatch !== null) {
            result.push({type: "section", title: sectionMatch[1] || "", text: line});
            continue;
        }
        const words = line.split(/\s+/g);
        let totalWordsLength = 0;
        for (const word of words) {
            totalWordsLength += word.length;
        }
        const avgWordLength = totalWordsLength / words.length;
        const containsLasOrDas = line.match(/(la|da|de|do)/gi) !== null;
        if ((avgWordLength < 2.2 && !containsLasOrDas) || line.length <= 2) {
            // assume this line is chords
            const chordsArray: [string, number][] = [];
            for (const chord of line.matchAll(/(\S+)/g)) {
                const chordName = chord[0];
                if (chordName) {
                    chordsArray.push([chordName, chord.index]);
                }
            }
            result.push({type: "chords", chords: chordsArray, text: line});
            continue;
        }
        if (prevLine && prevLine.type == "chords") {
            result.push({
                type: "lyrics",
                text: line
            });
            continue;
        }
        result.push({type: "annotation", text: line});
    }

    return result;
}
