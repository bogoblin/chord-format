import {
    applySensibleMerges, chordUnderhang,
    detectChords, getChordDiagram,
    identifyLines,
    isChordLine,
    pairChordsWithLine,
    splitWordsFromPairedChords
} from "../ChordParser";

test("in the aeroplane over the sea", () => {
    const lines = identifyLines(`In the Aeroplane Over the Sea         chords furnished by Ben Hargrave
Written by Jeff Mangum
Performed by Neutral Milk Hotel


[Intro]

G  Em  C  D


[Verse 1]

G                 Em
What a beautiful face
                       C
I have found in this place
                  D
that is circling all 'round the sun
G                  Em
What a beautiful dream
                          C
that could flash on the screen
                  D                    G
in a blink of an eye and be gone from me
      Em
soft and sweet
         C                 D                G  Em  C  D
Let me hold it close and keep it here with me


[Verse 2]

G                 Em
And one day we will die
                       C                  D
and our ashes will fly from the aeroplane over the sea
G                  Em
but for now we are young
                  C
Let us lay in the sun
                D                     G
and count every beautiful thing we can see
        Em
Love to be
         C             D                 G  Em  C  D
in the arms of all I'm keepin' here with me


[Instrumental]

Em  C  G  D
Em  C  G  D  D


[Verse 3]

G              Em                       C
What a curious life we have found here tonight
                    D
There is music that sounds from the street
G                       Em
There are lights in the clouds
                   C
*Anna's ghost all around
                       D                           G
Hear her voice as it's rolling and ringing through me
      Em
soft and sweet
         C                 D                G  Em  C  D
How the notes all bend and reach above the trees


[Bridge]

Em                        C
     Now how I remember you
                                  G
How I would push my fingers through
                                    D
your mouth to make those muscles move
                                       Em
that made your voice so smooth and sweet
                                  C
But now we keep where we don't know
                                  G
All secrets sleep in winter clothes
                            D
with one you loved so long ago
                         Em
Now he don't even know his name


[Interlude]

(Em)   C    G    D


[Verse 4]

G                 Em
What a beautiful face
                       C
I have found in this place
                  D
that is circling all 'round the sun
G                     Em
And when we meet on a cloud
                     C
I'll be laughing out loud
                      D           G
I'll be laughing with everyone I see
       Em
Can't believe
    C                  D            G  Em  C  D  G
how strange it is to be anything at all`);
    expect(lines[10]).toStrictEqual({
        type: "chords",
        chords: [["G", 0], ["Em", 18]],
        text: "G                 Em"
    })
    expect(lines[11]).toStrictEqual({
        type: "lyrics",
        text: "What a beautiful face"
    })

    if (lines[10].type === "chords" && lines[11].type === "lyrics") {
        const pairs = pairChordsWithLine(lines[10].chords, lines[11].text);
        expect(pairs).toStrictEqual([
            {
                lyric: "What a beautiful f",
                chord: "G"
            },
            {
                lyric: "ace",
                chord: "Em"
            }
        ])

        expect(splitWordsFromPairedChords(pairs)).toStrictEqual([
            [{lyric: "What", chord: "G"}],
            [{lyric: " "}],
            [{lyric: "a"}],
            [{lyric: " "}],
            [{lyric: "beautiful"}],
            [{lyric: " "}],
            [
                {lyric: "f"},
                {lyric: "ace", chord: "Em"}
            ],
        ])
    }

    if (lines[24].type === "chords" && lines[25].type === "lyrics") {
        //          C                 D                G  Em  C  D
        // Let me hold it close and keep it here with me
        expect(pairChordsWithLine(lines[24].chords, lines[25].text)).toStrictEqual([
            {
                lyric: "Let me ho",
            },
            {
                lyric: "ld it close and ke",
                chord: "C"
            },
            {
                lyric: "ep it here with m",
                chord: "D"
            },
            {
                lyric: "e",
                chord: "G"
            },
            {
                lyric: "",
                chord: "Em"
            },
            {
                lyric: "",
                chord: "C"
            },
            {
                lyric: "",
                chord: "D"
            },
        ])
    } else {
        fail("wrong line?")
    }

    expect(lines[5]).toStrictEqual({
        type: "section",
        text: "[Intro]",
        title: "Intro"
    })
})

test('Holland 1945', () => {
    const lines = identifyLines(`[Chorus]

 

                C             G

But now we must pick up every piece

        C               G

Of this life we used to love

        C                 G

Just to keep ourselves at least

                D

Enough to carry on!`);
    console.log(lines)
})

test('Drown With Me', () => {
    const lines = identifyLines(
        `                    G6             Cmaj7  F#7add11
  Your lipstick has gone astray`);
    console.log(lines)
    if (lines[0].type === "chords" && lines[1].type === "lyrics") {
        const pairs = pairChordsWithLine(lines[0].chords, lines[1].text)
        console.log(pairs)
        const words = splitWordsFromPairedChords(pairs);
        console.log(words);
    }
})

test('detect chords', () => {
    expect(detectChords("G                      Gmaj7         C/G                 G")).toStrictEqual(["G", "Gmaj7", "C/G", "G"]);
})

test('is chord line', () => {
    expect(isChordLine("G                      Gmaj7         C/G                 G")).toBe(true);
})

test('apply sensible merges', () => {
    expect(applySensibleMerges([
        [{lyric: "I", chord: "C/G"}],
        [{lyric: " ", }],
        [{lyric: "will", }],
    ])).toStrictEqual([
        [{lyric: "I will", chord: "C/G"}]
    ])
})

test('underhang', () => {
    expect(chordUnderhang([{lyric: "will"}])).toBe(4);
})

test('Get Chord Diagrams', () => {
    expect(getChordDiagram('Badd4    = 799800')).toStrictEqual({
        chord: "Badd4",
        frets: [7, 9, 9, 8, 0, 0]
    });
    expect(getChordDiagram('Cmaj7    = 8-10-10-900')).toStrictEqual({
        chord: "Cmaj7",
        frets: [8, 10, 10, 9, 0, 0]
    });
    expect(getChordDiagram('Badd4    = 799800')).toMatchInlineSnapshot(`
{
  "chord": "Badd4",
  "frets": [
    7,
    9,
    9,
    8,
    0,
    0,
  ],
}
`);
    expect(getChordDiagram('F#m      = 244222')).toMatchInlineSnapshot(`
{
  "chord": "F#m",
  "frets": [
    2,
    4,
    4,
    2,
    2,
    2,
  ],
}
`);
    expect(getChordDiagram('G6       = 355400')).toMatchInlineSnapshot(`
{
  "chord": "G6",
  "frets": [
    3,
    5,
    5,
    4,
    0,
    0,
  ],
}
`);
    expect(getChordDiagram('Cmaj7    = 8-10-10-900')).toMatchInlineSnapshot(`
{
  "chord": "Cmaj7",
  "frets": [
    8,
    10,
    10,
    9,
    0,
    0,
  ],
}
`);
    expect(getChordDiagram('F#7add11 = 244300')).toMatchInlineSnapshot(`
{
  "chord": "F#7add11",
  "frets": [
    2,
    4,
    4,
    3,
    0,
    0,
  ],
}
`);
    expect(getChordDiagram('E        = 022100')).toMatchInlineSnapshot(`
{
  "chord": "E",
  "frets": [
    0,
    2,
    2,
    1,
    0,
    0,
  ],
}
`);
    expect(getChordDiagram('Cadd9    = x32030')).toMatchInlineSnapshot(`
{
  "chord": "Cadd9",
  "frets": [
    -1,
    3,
    2,
    0,
    3,
    0,
  ],
}
`);
    expect(getChordDiagram('G        = 320033')).toMatchInlineSnapshot(`
{
  "chord": "G",
  "frets": [
    3,
    2,
    0,
    0,
    3,
    3,
  ],
}
`);
    expect(getChordDiagram('D        = xx0232')).toMatchInlineSnapshot(`
{
  "chord": "D",
  "frets": [
    -1,
    -1,
    0,
    2,
    3,
    2,
  ],
}
`);
    expect(getChordDiagram('A        = x02220')).toMatchInlineSnapshot(`
{
  "chord": "A",
  "frets": [
    -1,
    0,
    2,
    2,
    2,
    0,
  ],
}
`);
    expect(getChordDiagram('Badd4   F#m   G6   Cmaj7 F#7add11 x3')).toBeUndefined();
})

test('Identifying Tab', () => {
    const lines = identifyLines(`   F
e|-----1-----------------|
B|-------1-----1---------|
G|---2-------2-----------|  X10
D|-3-------3-------------|
A|-----------------------|
E|-----------------------|
`);
    expect(lines[4]).toMatchInlineSnapshot(`
{
  "after": "",
  "notes": [
    {
      "index": 1,
      "note": "3",
    },
    {
      "index": 9,
      "note": "3",
    },
  ],
  "string": "D",
  "text": "D|-3-------3-------------|",
  "type": "tab",
}
`);
})