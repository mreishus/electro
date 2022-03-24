import React from "react";
// import wavetable from "../wavetable/piano";
import Cell from "./cell.js";
import getFrequency from "../util/getFrequency";

const aMinorPentatonic = [
  "A3",
  "C3",
  "D3",
  "E3",
  "G3",
  "A4",
  "C4",
  "D4",
  "E4",
  "G4",
  "A5",
  "C5",
  "D5",
  "E5",
  "G5",
];
const randomNote = () =>
  aMinorPentatonic[Math.floor(Math.random() * aMinorPentatonic.length)];

const width = 6;
const height = 6;

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.audioCtx = new AudioContext();
    this.state = {
      grid: this.makeGrid(),
      agent1: { loc: [0, 0] },
    };
  }

  componentWillMount() {
    this.scheduleTick();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  tick = () => {
    console.log("tick");

    let { agent1, grid } = this.state;
    let [x, y] = agent1.loc;

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
    agent1.loc = [x, y];
    this.setState({ agent1 }, () => this.scheduleTick());
  };

  scheduleTick = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), 180);
  };

  playNote = (freq) => {
    const { audioCtx } = this;
    let osc = audioCtx.createOscillator();

    // console.log(wavetable);
    // const wave = audioCtx.createPeriodicWave(wavetable.real, wavetable.imag);
    // osc.setPeriodicWave(wave);

    osc.type = "sawtooth";
    osc.frequency.value = freq;

    // Direct connection
    // osc.connect(audioCtx.destination);

    // Add low pass filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    filter.Q.value = 1;
    // Connect via filter
    osc.connect(filter);
    filter.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.15);
    console.log("clicked");
  };

  makeGrid = () => {
    let directions = [
      //["right", "down", "right", "down", "right", "down"],
      ["right", "right", "right", "down", "right", "down"],
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
        let note = randomNote();
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
    const { grid, agent1 } = this.state;
    return (
      <div>
        <div className="grid grid-cols-6 gap-4">
          {grid.map((row, y) =>
            row.map((cell, x) => (
              <div key={x + "--" + y}>
                {/* cell {x},{y}  */}
                <Cell
                  freq={grid[y][x].freq}
                  direction={grid[y][x].direction}
                  playNote={this.playNote}
                  active={y == agent1.loc[0] && x == agent1.loc[1]}
                />
              </div>
            ))
          )}
        </div>
        <div>
          Agent location: {agent1.loc[0]}, {agent1.loc[1]}
        </div>
      </div>
    );
  }
}
export default Grid;
