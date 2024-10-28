import { useState } from 'react'
import {identifyLines, pairChordsWithLine, splitWordsFromPairedChords} from "./ChordParser.ts";
import './App.css';

function Chords({input}: { input: string }) {
    const lines = identifyLines(input);
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
                        const wordElements = [];
                        for (const {lyric, chord} of word) {
                            wordElements.push(<span className={"lyric-part"}>
                            <span className={"chord"}>{chord || " "}</span>
                            <span className={`lyric`}>{lyric}</span>
                        </span>)
                        }
                        lyricLineElements.push(<div className={"lyric-word"}>{wordElements}</div>)
                    }
                    elements.push(<div className={"lyric-line"}>{lyricLineElements}</div>)
                } else {
                    const lyricLineElements = [];
                    for (const chord of line.chords) {
                        lyricLineElements.push(<span className={"instrumental-chord chord"}>{chord[0]}</span>);
                    }
                    elements.push(<div>{lyricLineElements}</div>)
                }
            } break;
            case "lyrics":
                elements.push(<span className={"lyric"}>{line.text}</span>)
                break;
        }
    }
    return <>{elements}</>
}

function App() {
    const [chordInput, setChordInput] = useState("");
    const [fontScale, setFontScale] = useState(100);
    const [columns, setColumns] = useState(2);

    return (
        <>
            <form className={"no-print"}>
                <label>
                    Paste chords here:<br/>
                    <textarea onChange={(event) => setChordInput(event.target.value)}/>
                </label>
                <br/>
                <div style={{display: "flex", gap: "2em"}}>
                    <label>
                        Font size:
                        <input type={"range"} value={fontScale} min={30} max={300}
                               onChange={event => setFontScale(parseFloat(event.target.value))}/>
                        {fontScale}%
                    </label>
                    <label>
                        Columns:
                        <input type={"number"} value={columns} min={1} max={10}
                               onChange={event => setColumns(parseFloat(event.target.value))}/>
                    </label>
                </div>
            </form>
            <div className={"chord-sheet"} style={{fontSize: `${fontScale}%`, columnCount: columns}}>
                <Chords input={chordInput}/>
            </div>
        </>
    )
}

export default App
