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
} | {
    type: "tab",
    text: string,
}

type PairedWord = {lyric: string, chord?: string | undefined}[];

export function applySensibleMerges(words: PairedWord[]) {
    const result : PairedWord[] = [];
    for (const word of words) {
        result.push(word);
        if (result.length >= 2) {
            const word2 = result.pop() as PairedWord;
            const word1 = result.pop() as PairedWord;
            if (shouldMergeWords(word1, word2)) {
                result.push(mergeWords(word1, word2));
            } else {
                result.push(word1, word2);
            }
        }
    }
    return result;
}

export function chordOverhang(word: PairedWord) {
    let charactersFromEnd = 0;
    let chordLength = 0;
    for (let i = word.length-1; i>=0; i--) {
        const {lyric, chord} = word[i];
        charactersFromEnd += lyric.length;
        if (chord) {
            chordLength = chord.length;
            break;
        }
    }
    // Chords usually use wider letters, so I am putting a multiplier here:
    return Math.max(0, chordLength * 2 - charactersFromEnd);
}
export function chordUnderhang(word: PairedWord) {
    let charactersFromStart = 0;
    for (const part of word) {
        if (part.chord) {
            return charactersFromStart;
        }
        charactersFromStart += part.lyric.length;
    }
    return 1000000;
}

export function shouldMergeWords(word1: PairedWord, word2: PairedWord) : boolean {
    const overhang1 = chordOverhang(word1);
    if (overhang1 > 0) {
        return overhang1 < chordUnderhang(word2);
    }
    return false;
}

export function mergeWords(word1: PairedWord, word2: PairedWord) : PairedWord {
    const merged = [...word1, ...word2];
    const result : PairedWord = [];
    for (const part of merged) {
        result.push(part);
        if (result.length >= 2) {
            const part2 = result.pop();
            const part1 = result.pop();
            // This will always be false but I need to make typescript happy:
            if (!part1 || !part2) continue;

            if (!part2.chord) {
                result.push({
                    chord: part1.chord,
                    lyric: part1.lyric + part2.lyric
                });
            } else {
                result.push(part1, part2);
            }
        }
    }
    return result;
}

export function splitWordsFromPairedChords(pairs: {lyric: string, chord?: string | undefined}[]) {
    const words: PairedWord[] = [];
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
        } else {
            wordsInPair.push(pairs[index]);
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
        if (line.match(/\|[-\d]*\|/)) {
            result.push({type: "tab", text: line});
            continue;
        }
        const sectionMatch = /\[(.+)]/.exec(line);
        if (sectionMatch !== null) {
            result.push({type: "section", title: sectionMatch[1] || "", text: line});
            continue;
        }
        if (isChordLine(line)) {
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
        if (prevLine?.type === "chords" || prevLine?.type === "lyrics") {
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

export function detectChords(line: string) {
    const chords = [];
    // regex courtesy of https://stackoverflow.com/a/62762818
    for (const chord of line.matchAll(/\b[A-G]([b#]*)(maj|min|m|M|\+|-|dim|aug)?[0-9]*(sus)?[0-9]*(\/[A-G]([b#]*))?\b/g)) {
        chords.push(chord[0]);
    }
    return chords;
}

export function isChordLine(line: string) {
    const words = line.split(/\s+/);
    if (words.length === 0) return false;

    const chords = detectChords(line);
    return (chords.length / words.length) >= 0.5;
}