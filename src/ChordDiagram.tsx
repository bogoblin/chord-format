import {OPEN, SILENT, SVGuitarChord} from "svguitar";
import './ChordDiagram.css';

export function ChordDiagram(props: {frets: number[], title: string}) {
    const {frets, title} = props;
    const element = document.createElement("div");
    let position = frets.reduce((prev, current) => {
        if (current === -1 || current === 0) return prev;
        if (current < prev) return current;
        return prev;
    }, 1000);
    let numberOfFrets = Math.max(...frets) + 1 - position;
    if (numberOfFrets < 3) {
        position -= (3-numberOfFrets);
        if (position < 1) position = 1;
        numberOfFrets = 3;
    }
    new SVGuitarChord(element)
        .chord({
            fingers: frets.map(( fret, i ) => {
                const string = 6-i;
                if (fret === -1) return [string, SILENT];
                if (fret === 0) return [string, OPEN];
                return [string, fret - position + 1];
            }),
            barres: [],
            position
        })
        .configure({
            frets: numberOfFrets,
            color: "var(--text-color)"
        })
        .draw();
    return <div className={"chord-diagram"}>
        <div dangerouslySetInnerHTML={{ __html: element.innerHTML }}/>
        <div className={"chord-title chord"}>{title}</div>
    </div>
}