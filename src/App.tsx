import { useState } from 'react'
import {applySensibleMerges, identifyLines, pairChordsWithLine, splitWordsFromPairedChords} from "./ChordParser.ts";
import './App.css';
import {ChordDiagram} from "./ChordDiagram.tsx";

function Chords({input}: { input: string }) {
    const lines = identifyLines(input);
    const elements = [];
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        switch (line.type) {
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
                    const lyricParts = applySensibleMerges(splitWordsFromPairedChords(pairChordsWithLine(line.chords, nextLine.text)));
                    for (const word of lyricParts) {
                        const wordElements = [];
                        for (const {lyric, chord} of word) {
                            wordElements.push(<span className={"lyric-part"}>
                            <span className={"chord"}>{chord || "​"}</span>
                            <span className={`lyric`}>{lyric}</span>
                        </span>)
                        }
                        lyricLineElements.push(<div className={"lyric-word"}>{wordElements}</div>)
                    }
                    elements.push(<div className={"lyric-line"}>{lyricLineElements}</div>)
                } else {
                    const lyricLineElements = [];
                    for (let i = 0; i < line.chords.length-1; i++) {
                        const chord = line.chords[i];
                        const nextChord = line.chords[i+1];
                        lyricLineElements.push(<span className={"chord"} style={{flexGrow: nextChord[1]}}>{chord[0]}</span>);
                    }
                    const chord = line.chords[line.chords.length-1];
                    lyricLineElements.push(<span className={"chord"} style={{flexGrow: chord[1]}}>{chord[0]}</span>);
                    elements.push(<div className={"instrumental"}>{lyricLineElements}</div>)
                }
            } break;
            case "lyrics":
                elements.push(<div className={"lyric"}>{line.text}</div>)
                break;
            case "rule":
                elements.push(<hr/>);
                break;
            case "tab":
                elements.push(<pre className={"tab"}>{line.text}</pre>);
                break;
            case "chord-diagram":
                elements.push(<ChordDiagram frets={line.frets} title={line.chord}/>);
                break;
        }
    }
    return <>{elements}</>
}

function App() {
    const urlParams = new URLSearchParams(location.search);

    const [chordInput, setChordInput] = useState(urlParams.get('text') || '');
    const [fontScale, setFontScale] = useState(100);
    const [columns, setColumns] = useState(2);

    const [title, setTitle] = useState(urlParams.get('title') || '');
    const [artist, setArtist] = useState(urlParams.get('artist') || '');

    return (
        <>
            <form className={"no-print"}>
                <label>
                    Paste chords here:<br/>
                    <textarea value={chordInput} onChange={(event) => setChordInput(event.target.value)}/>
                </label>
                <label>
                    Title: <input type={"text"} value={title} onChange={event => setTitle(event.target.value)}/>
                </label>
                <label>
                    Artist: <input type={"text"} value={artist} onChange={event => setArtist(event.target.value)}/>
                </label>
                <div>
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
                <button onClick={e => {
                    const params = new URLSearchParams({text: chordInput});
                    if (title.length > 0) params.set('title', title);
                    if (artist.length > 0) params.set('artist', artist);
                    const url = location.host + '/?' + params.toString();
                    navigator.clipboard.writeText(url).then(() => console.log("copied to clipboard"));
                    e.stopPropagation();
                    e.preventDefault();
                }}>Copy link to Clipboard</button>
                <hr/>
            </form>
            <div className={"chord-sheet"} style={{fontSize: `${fontScale}%`, columnCount: columns}}>
                <h1>{title}</h1>
                {artist.length > 0 ? <h2 className={"byline"}>by {artist}</h2> : '' }
                <Chords input={chordInput}/>
            </div>
        </>
    )
}

export default App
