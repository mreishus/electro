import React from "react";
// import wavetable from "../wavetable/piano";
import Cell from "./cell.js";
import getFrequency from "../util/getFrequency";

const aMinorPentatonic = [
  "C4",
  "D4",
  "E4",
  "G4",
  "A4",
  "C5",
  "D5",
  "E5",
  "G5",
  "A5",
  "C6",
];
const randomNote = () =>
  aMinorPentatonic[Math.floor(Math.random() * aMinorPentatonic.length)];

const getNote = (x, y) => {
  let possibleNotes = aMinorPentatonic;
  let i = (x + y) % possibleNotes.length;
  return possibleNotes[i];
};

const width = 6;
const height = 6;

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.audioCtx = new AudioContext();
    this.state = {
      grid: this.makeGrid(),
      agents: [
        { loc: [0, 0], period: 1 },
        { loc: [5, 0], period: 2 },
        { loc: [0, 5], period: 4 },
        { loc: [5, 5], period: 8 },
      ],
      tickNum: 0,
    };
  }

  componentWillMount() {
    this.scheduleTick();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  tick = () => {
    let { agents, grid, tickNum } = this.state;

    agents.forEach((agent, i) => {
      if (tickNum % agent.period !== 0) {
        return;
      }
      let [x, y] = agent.loc;
      const dir = grid[y][x].direction;
      switch (dir) {
        case "left":
          x -= 1;
          break;
        case "right":
          x += 1;
          break;
        case "up":
          y -= 1;
          break;
        case "down":
          y += 1;
          break;
      }
      x = (x + width) % width;
      y = (y + height) % width;
      agent.loc = [x, y];
      agents[i] = agent;
    });

    tickNum = (tickNum + 1) % 8;
    this.setState({ agents, tickNum }, () => this.scheduleTick());
  };

  scheduleTick = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), 180);
  };

  playNote = (freq) => {
    const { audioCtx } = this;
    let osc = audioCtx.createOscillator();

    let time = audioCtx.currentTime;

    // console.log(wavetable);
    // const wave = audioCtx.createPeriodicWave(wavetable.real, wavetable.imag);
    // osc.setPeriodicWave(wave);

    osc.type = "sawtooth";
    osc.frequency.value = freq;

    // Add low pass filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2500;
    //filter.Q.value = 10;

    // Simple attack/release envelope
    // From https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
    let noteLength = 0.4;
    let attackTime = 0.0001;
    let releaseTime = 0.15;

    let sweepEnv = audioCtx.createGain();
    sweepEnv.gain.cancelScheduledValues(time);
    sweepEnv.gain.setValueAtTime(0, time);
    // set our attack
    sweepEnv.gain.linearRampToValueAtTime(1, time + attackTime);
    // set our release
    sweepEnv.gain.linearRampToValueAtTime(0, time + noteLength - releaseTime);

    // Direct connection
    // osc.connect(audioCtx.destination);
    // Connect: OSC -> ENV -> FILTER -> OUTPUT
    osc.connect(sweepEnv).connect(filter).connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + noteLength);
  };

  makeGrid = () => {
    let directions = [
      // ["right", "right", "right", "down", "right", "down"],
      ["right", "down", "right", "down", "right", "down"],
      ["up", "left", "up", "down", "up", "left"],
      ["right", "right", "up", "right", "right", "down"],
      ["up", "left", "left", "down", "left", "left"],
      ["right", "down", "up", "down", "right", "down"],
      ["up", "left", "up", "left", "up", "left"],
    ];
    let grid = [];
    for (let y = 0; y < height; y += 1) {
      const row = [];
      for (let x = 0; x < width; x += 1) {
        // let note = randomNote();
        let note = getNote(x, y);
        let item = {
          freq: getFrequency(note),
          direction: directions[y][x],
        };
        row.push(item);
      }
      grid.push(row);
    }
    return grid;
  };

  render() {
    const { grid, agents } = this.state;
    return (
      <div>
        <div className="grid grid-cols-6 gap-4">
          {grid.map((row, y) =>
            row.map((cell, x) => {
              let matchingAgents = agents.filter(
                (agent) => y === agent.loc[0] && x === agent.loc[1]
              );
              return (
                <div key={x + "--" + y}>
                  <Cell
                    freq={grid[y][x].freq}
                    direction={grid[y][x].direction}
                    playNote={this.playNote}
                    active={matchingAgents.length > 0}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }
}
export default Grid;
