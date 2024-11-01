import {MouseEventHandler, ReactNode, useReducer, useState} from 'react'
import {applySensibleMerges, identifyLines, pairChordsWithLine, splitWordsFromPairedChords} from "./ChordParser.ts";
import './App.css';
import {ChordDiagram} from "./ChordDiagram.tsx";
import {ImportFromUltimateGuitar} from "./Scraping.ts";

function Chords({input}: { input: string }) {
    const lines = identifyLines(input);
    const elements = [];
    let line;
    while ((line = lines.shift())) {
        switch (line.type) {
            case "annotation":
                elements.push(<p>{line.text}</p>);
                break;
            case "section":
                elements.push(<h2>{line.title}</h2>);
                break;
            case "chords": {
                const nextLine = lines.shift();
                if (nextLine?.type === "lyrics") {
                    const lyricLineElements = [];
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
                    if (nextLine) lines.unshift(nextLine);

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
            case "tab": {
                const tabLines = [line];
                let nextLine;
                let length = line.length;
                let blanksSkipped = 0;
                while (true) {
                    nextLine = lines.shift();
                    if (!nextLine) break;
                    if (nextLine.type === "tab") {
                        tabLines.push(nextLine);
                        length = Math.max(length, nextLine.length);
                        blanksSkipped = 0;
                    }
                    else if (blanksSkipped === 0 && nextLine.type === "blank") {
                        blanksSkipped += 1;
                    }
                    else {
                        break;
                    }
                }
                if (nextLine) lines.unshift(nextLine);
                elements.push(<div className={"tab"} style={{
                    display: "grid",
                    gridTemplateRows: `repeat(${tabLines.length}, 1fr)`,
                    gridTemplateColumns: `auto repeat(${length}, 1fr) auto`,
                    breakInside: "avoid"
                }}>
                    {tabLines.map(( tab, i ) => {
                        const tabLineElements = [];
                        const gridRow = i+1;
                        tabLineElements.push(<div className={"tab-string"} style={{gridColumn: 1, gridRow}}>{tab.string}</div>);
                        tabLineElements.push(<div className={"tab-after"} style={{gridColumn: -1, gridRow}}>{tab.after}</div>);
                        tabLineElements.push(<div className={"tab-line"} style={{gridColumn: "2 / -1", gridRow}}/>);
                        for (const note of tab.notes) {
                            if (note.note === "|") {
                                tabLineElements.push(<div className={"tab-bar"} style={{
                                    gridColumn: note.index + 2,
                                    gridRow,
                                    gridColumnEnd: note.index + 1 + note.note.length
                                }}><span></span></div>);
                            } else {
                                tabLineElements.push(<div className={"tab-note"} style={{
                                    gridColumn: note.index + 2,
                                    gridRow,
                                    gridColumnEnd: note.index + 1 + note.note.length
                                }}>
                                    <span>{note.note}</span>
                                </div>);
                            }
                        }
                        return tabLineElements;
                    })}
                </div>);
                break;
            }
            case "chord-diagram":
                elements.push(<ChordDiagram frets={line.frets} title={line.chord}/>);
                break;
        }
    }
    return <>{elements}</>
}

function numberReducer(min?: number, max?: number) {
    return (prev: number, action: {type: "increment"|"set", amount: number}) => {
        let newValue = prev;
        if (action.type === "increment") {
            newValue = prev + action.amount;
        }
        else if (action.type === "set") {
            newValue = action.amount;
        }
        if (min !== undefined && newValue < min) newValue = min;
        if (max !== undefined && newValue > max) newValue = max;
        return newValue;
    }
}

function App() {
    const urlParams = new URLSearchParams(location.search);

    const [chordInput, setChordInput] = useState(urlParams.get('text') || '');
    const [fontScale, setFontScale] = useReducer(numberReducer(30, 300), 100);
    const [columns, setColumns] = useReducer(numberReducer(1, 10), 2);

    const [title, setTitle] = useState(urlParams.get('title') || '');
    const [artist, setArtist] = useState(urlParams.get('artist') || '');

    const params = new URLSearchParams({text: chordInput});
    if (title.length > 0) params.set('title', title);
    if (artist.length > 0) params.set('artist', artist);
    const url = location.origin + location.pathname.replace(/\/*$/, '') + '/?' + params.toString();

    return (
        <>
            <form className={"no-print"}>
                <div style={{display: "flex", justifyContent: "space-between", gap: "3ch", overflow: "hidden"}}>
                    <h1 style={{textWrap: "nowrap", marginRight: "3ch"}}>Format Chords for Printing</h1>
                    <a href={"https://github.com/bogoblin/chord-format"}>Github</a>
                    <div style={{textAlign: "right"}}>
                        Drag this link to your bookmarks bar to open a chord sheet here: <a
                        href={`javascript:(${ImportFromUltimateGuitar.toString()})()`}>Import from Ultimate
                        Guitar</a>
                    </div>
                </div>
                <hr/>
                <label style={{padding: "0"}}>
                    Paste chords here:<br/>
                    <textarea style={{minWidth: "100%", maxWidth: "100%", minHeight: "8em"}} value={chordInput}
                              onChange={(event) => setChordInput(event.target.value)}/>
                </label>
                <div style={{display: "flex", flexWrap: "wrap", gap: "1em"}}>
                    <label style={{padding: 0}}>
                        Title: <input type={"text"} value={title} onChange={event => setTitle(event.target.value)}/>
                    </label>
                    <label style={{padding: 0}}>
                        Artist: <input type={"text"} value={artist} onChange={event => setArtist(event.target.value)}/>
                    </label>
                    <span>
                        Font size: <Button onClick={() => setFontScale({type: "increment", amount: -10})}>--</Button>
                        <Button onClick={() => setFontScale({type: "increment", amount: -1})}>-</Button>
                        <span style={{margin: "0 0.5em"}}>{fontScale}%</span>
                        <Button onClick={() => setFontScale({type: "increment", amount: 1})}>+</Button>
                        <Button onClick={() => setFontScale({type: "increment", amount: 10})}>++</Button>
                    </span>
                    <span>
                        Columns: <Button onClick={() => setColumns({type: "increment", amount: -1})}>-</Button>
                        <span style={{margin: "0 0.5em"}}>{columns}</span>
                        <Button onClick={() => setColumns({type: "increment", amount: 1})}>+</Button>
                    </span>
                    <span>
                        <Button
                            onClick={() => navigator.clipboard.writeText(url).then(() => console.log("copied to clipboard"))}>
                            Copy link to Clipboard
                        </Button>
                        <Button onClick={() => print()}>Print
                        </Button>
                    </span>
                </div>
                <hr/>
            </form>
            <div className={"chord-sheet"} style={{fontSize: `${fontScale}%`, columnCount: columns}}>
            <h1>{title}</h1>
                {artist.length > 0 ? <h2 className={"byline"}>by {artist}</h2> : ''}
                <Chords input={chordInput}/>
            </div>
        </>
    )
}

function Button(props: { children: ReactNode, onClick: MouseEventHandler<HTMLButtonElement> | undefined}) {
    return <button onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        if (props.onClick) {
            return props.onClick(e);
        }
    }}>{props.children}</button>
}

export default App
