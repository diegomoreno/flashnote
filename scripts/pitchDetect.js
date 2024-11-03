/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Chris Wilson
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * https://github.com/cwilso/PitchDetect
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

var audioContext = null;
var analyser = null;
var mediaStreamSource = null;
var rafID = null;
var buf = new Float32Array(2048);

const noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

window.onload = function () {
  audioContext = new AudioContext();
}

function startPitchDetect() {
  // grab an audio context
  audioContext = new AudioContext();

  // Attempt to get audio input
  navigator.mediaDevices.getUserMedia({ audio: true }).then(
    (stream) => {
      // Create an AudioNode from the stream.
      mediaStreamSource = audioContext.createMediaStreamSource(stream);

      // Connect it to the destination.
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      mediaStreamSource.connect(analyser);
      updatePitch();
    }).catch((err) => {
      // always check for errors at the end.
      console.error(`${err.name}: ${err.message}`);
      alert('Stream generation failed.');
    }
  );
}

function noteFromPitch(frequency) {
  var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
  return Math.round(noteNum) + 69;
}

function autoCorrelate(sampleRate) {
  // Implements the ACF2+ algorithm
  var SIZE = buf.length;
  var rms = 0;

  for (var i = 0; i < SIZE; i++) {
    var val = buf[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) // not enough signal
    return -1;

  var r1 = 0, r2 = SIZE - 1, thres = 0.2;
  for (var i = 0; i < SIZE / 2; i++)
    if (Math.abs(buf[i]) < thres) { r1 = i; break; }
  for (var i = 1; i < SIZE / 2; i++)
    if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

  buf = buf.slice(r1, r2);
  SIZE = buf.length;

  var c = new Array(SIZE).fill(0);
  for (var i = 0; i < SIZE; i++)
    for (var j = 0; j < SIZE - i; j++)
      c[i] = c[i] + buf[j] * buf[j + i];

  var d = 0; while (c[d] > c[d + 1]) d++;
  var maxval = -1, maxpos = -1;
  for (var i = d; i < SIZE; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  var T0 = maxpos;

  var x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  a = (x1 + x3 - 2 * x2) / 2;
  b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);

  return sampleRate / T0;
}

function updatePitch() {
  analyser.getFloatTimeDomainData(buf);
  const detectedPitch = autoCorrelate(audioContext.sampleRate);

  if (detectedPitch != -1) { // -1 indicates vagueness
    const note = noteFromPitch(detectedPitch);
    const detectedNote = noteStrings[note % 12];

    document.dispatchEvent(
      new CustomEvent(
        "NoteDetected",
        {
          detail: {
            note: detectedNote,
            pitch: detectedPitch,
          }
        }
      )
    );
  }

  rafID = window.requestAnimationFrame(updatePitch);
}
