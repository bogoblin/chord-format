import "./ChordDiagram.css"
export function ChordDiagram(props: {chordName: string, frets: number[]}) {
    const {chordName, frets} = props;
    // Find the lowest fret that is not open or muted (-1):
    let lowest = 1000;
    let highest = 0;
    for (const fret of frets) {
        if (fret === 0 || fret === -1) continue;
        lowest = Math.min(lowest, fret);
        highest = Math.max(highest, fret);
    }
    const numberOfRows = highest - lowest + 2;
    return <div>
        <div className={"chord-diagram"} style={{gridTemplateRows: `repeat(${numberOfRows * 2}, auto)`}}>
            {frets.map((fret, i) => {
                const gridColumn = 2 * i + 2;
                const gridRow = Math.max(fret + 2 - lowest, 0) * 2 - 1;
                if (fret === 0) {
                    return <div className={"fret-marker-open"} style={{gridColumn}}/>
                }
                if (fret === -1) {
                    return <div className={"fret-marker-muted"} style={{gridColumn}}/>
                }
                return <div className={"fret-marker"}
                            style={{gridRow, gridColumn}}></div>
            })}
        </div>
    </div>
}