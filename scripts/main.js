const notes = [
  { note: 'G3', pitch: 196, },
  { note: 'G#3', pitch: 208, },
  { note: 'A3', pitch: 220, },
  { note: 'A#3', pitch: 234, },
  { note: 'B3', pitch: 248, },
  { note: 'C4', pitch: 263, },
  { note: 'C#4', pitch: 279, },
  { note: 'D4', pitch: 293, },
  { note: 'D#4', pitch: 312, },
  { note: 'E4', pitch: 330, },
  { note: 'F4', pitch: 350, },
  { note: 'F#4', pitch: 371, },
  { note: 'G4', pitch: 393, },
  { note: 'G#4', pitch: 417, },
  { note: 'A4', pitch: 443, },
  { note: 'A#4', pitch: 468, },
  { note: 'B4', pitch: 498, },
  { note: 'C5', pitch: 527, },
  { note: 'C#5', pitch: 559, },
  { note: 'D5', pitch: 591, },
  { note: 'D#5', pitch: 627, },
  { note: 'E5', pitch: 659, },
  { note: 'F5', pitch: 696, },
  { note: 'F#5', pitch: 740, },
  { note: 'G5', pitch: 784, },
  { note: 'G#5', pitch: 831, },
  { note: 'A5', pitch: 881, },
  { note: 'A#5', pitch: 934, },
  { note: 'B5', pitch: 989, },
];

var targetNote;
setNewNote();

function setNewNote() {
  targetNote = getRandomNote();
  drawNote(targetNote.note);
}

function drawNote(note) {
  console.log('Drawing ' + JSON.stringify(note));
  document.getElementById('stave').innerHTML = '';
  const VF = Vex.Flow;
  var vf = new VF.Factory({ renderer: { elementId: 'stave' } });
  var score = vf.EasyScore();
  var system = vf.System();
  system.addStave({
    voices: [
      score.voice(score.notes(`${note}/w`)),
    ]
  }).addClef('treble');

  vf.draw();
}

function sameNote(detectedNote, detectedPitch) {
  const pitchTolerance = 10;
  const minPitch = targetNote.pitch - pitchTolerance;
  const maxPitch = targetNote.pitch + pitchTolerance;

  return targetNote.note.startsWith(detectedNote)
    && detectedPitch >= minPitch
    && detectedPitch <= maxPitch;
}

function getRandomNote() {
  return notes[Math.floor(Math.random() * notes.length)];
}

document.addEventListener(
  "NoteDetected",
  (e) => {
    const { note, pitch } = e.detail;
    console.log('Note: ' + note);
    if (sameNote(note, pitch)) {
      setNewNote();
    }
  }
);