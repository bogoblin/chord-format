import { useState } from 'react'
import {identifyLines, Line, pairChordsWithLine, splitWordsFromPairedChords} from "./ChordParser.ts";
import './App.css';

function Chords({lines}: { lines: Line[] }) {
    const elements = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        switch (line.type) {
            case "blank":
                // elements.push(<br/>);
                break;
            case "annotation":
                elements.push(<p>{line.text}</p>);
                break;
            case "section":
                elements.push(<h2>{line.title}</h2>);
                break;
            case "chords": {
                const nextLine = lines[lineIndex+1];
                if (nextLine?.type === "lyrics") {
                    const lyricLineElements = [];
                    lineIndex += 1;
                    const lyricParts = splitWordsFromPairedChords(pairChordsWithLine(line.chords, nextLine.text));
                    for (const word of lyricParts) {
                        const dontBreak = word.length > 1;
                        const wordElements = [];
                        for (const {lyric, chord} of word) {
                            wordElements.push(<span className={"lyric-part"}>
                            <span className={"chord"}>{chord}</span>
                            <span className={`lyric ${dontBreak? 'no-break':''}`} contentEditable={"plaintext-only"}>{lyric}</span>
                        </span>)
                        }
                        lyricLineElements.push(<span className={"lyric-word"}>{wordElements}</span>)
                    }
                    elements.push(<div className={"lyric-line"}>{lyricLineElements}</div>)
                } else {
                    const lyricLineElements = [];
                    for (const chord of line.chords) {
                        lyricLineElements.push(<span className={"instrumental-chord"}>{chord[0]}</span>);
                    }
                    elements.push(<div>{lyricLineElements}</div>)
                }
            } break;
            case "lyrics":
                elements.push(<span className={"lyric"}>{line.text}</span>)
                break;
        }
    }
    return <div className={"chord-sheet"}>{elements}</div>
}

function App() {
    const [chordInput, setChordInput] = useState("");

    const lines = identifyLines(chordInput);

    return (
        <>
            <form className={"no-print"}>
                <textarea onChange={(event) => setChordInput(event.target.value)}/>
            </form>
            <Chords lines={lines}/>
        </>
    )
}

export default App
