import React from "react";
import wavetable from "../wavetable/piano";
import Cell from "./cell.js";
import getFrequency from "../util/getFrequency";

const scales = {
  pentatonic: [
    "C2",
    "D2",
    "E2",
    "G2",
    "A2",
    "C3",
    "D3",
    "E3",
    "G3",
    "A3",
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
  ],
  minor: [
    "A2",
    "B2",
    "C3",
    "D3",
    "E3",
    "F3",
    "G3",
    "A3",
    "B3",
    "C4",
    "D4",
    "E4",
    "F4",
    "G4",
    "A4",
    "B4",
    "C5",
    "D5",
  ],
};
const width = 6;
const height = 6;

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.audioCtx = new AudioContext();
    this.state = {
      grid: [[]], //this.makeGrid(),
      agents: [
        { loc: [0, 0], period: 1, active: true },
        { loc: [5, 0], period: 2, active: false },
        { loc: [0, 5], period: 4, active: false },
        { loc: [5, 5], period: 6, active: false },
      ],
      tickNum: 0,
      isRandomNotes: true,
      scale: "pentatonic",
    };
  }

  componentDidMount() {
    this.scheduleTick();
    this.resetGrid();
  }

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  tick = () => {
    let { agents, grid, tickNum } = this.state;

    agents.forEach((agent, i) => {
      if (!agent.active) {
        return;
      }
      if (tickNum % agent.period !== 0) {
        return;
      }
      let [x, y] = agent.loc;
      if (typeof grid[y][x] == "undefined") {
        return;
      }
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
        case "rightup":
          x += 1;
          y -= 1;
          break;
        case "rightdown":
          x += 1;
          y += 1;
          break;
        case "leftup":
          x -= 1;
          y -= 1;
          break;
        case "leftdown":
          x -= 1;
          y += 1;
          break;
      }
      x = (x + width) % width;
      y = (y + height) % width;
      agent.loc = [x, y];
      agents[i] = agent;
    });

    tickNum = (tickNum + 1) % 12;
    this.setState({ agents, tickNum }, () => this.scheduleTick());
  };

  toggleActive = (i) => {
    let { agents } = this.state;
    agents[i].active = !agents[i].active;
    this.setState({ agents });
  };

  scheduleTick = () => {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.tick(), 180);
  };

  playNote = (freq) => {
    const { audioCtx } = this;

    // Add low pass filter
    const filter = audioCtx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 7000;
    filter.Q.value = 0;

    // Simple attack/release envelope
    // From https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Advanced_techniques
    let attackTime = 0.01;
    let holdTime = 0.05;
    let releaseTime = 0.5;
    let time = audioCtx.currentTime;

    let sweepEnv = audioCtx.createGain();
    sweepEnv.gain.cancelScheduledValues(time);
    sweepEnv.gain.setValueAtTime(0.01, time);
    // Attack
    sweepEnv.gain.exponentialRampToValueAtTime(0.9, time + attackTime);
    // Sustain
    sweepEnv.gain.exponentialRampToValueAtTime(
      0.9,
      time + attackTime + holdTime
    );
    // Release
    sweepEnv.gain.exponentialRampToValueAtTime(
      0.01,
      time + attackTime + holdTime + releaseTime
    );

    const delay = audioCtx.createDelay();
    delay.delayTime.value = 0.2;

    const feedback = audioCtx.createGain();
    feedback.gain.value = 0.3;

    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(audioCtx.destination);

    let osc1 = audioCtx.createOscillator();
    osc1.type = "sawtooth";
    osc1.frequency.value = freq;

    let gain1 = audioCtx.createGain();
    gain1.gain.value = 0.3;

    let osc2 = audioCtx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq;

    let gain2 = audioCtx.createGain();
    gain2.gain.value = 1.0;

    // Direct connection
    // osc.connect(audioCtx.destination);
    // Connect: OSC -> ENV -> FILTER -> OUTPUT
    osc1
      .connect(gain1)
      .connect(sweepEnv)
      .connect(filter)
      .connect(audioCtx.destination);
    osc1.start();
    osc1.stop(time + attackTime + holdTime + releaseTime);

    osc2
      .connect(gain2)
      .connect(sweepEnv)
      .connect(filter)
      .connect(audioCtx.destination);
    osc2.start();
    osc2.stop(time + attackTime + holdTime + releaseTime);
  };

  changeDirection = (y, x) => {
    let { grid } = this.state;
    grid[y][x].direction = this.rotate(grid[y][x].direction);
    this.setState({ grid });
  };

  rotate = (direction) => {
    // let map = {
    //   right: "down",
    //   down: "left",
    //   left: "up",
    //   up: "right",
    // };
    let map = {
      right: "rightdown",
      rightdown: "down",
      down: "leftdown",
      leftdown: "left",
      left: "leftup",
      leftup: "up",
      up: "rightup",
      rightup: "right",
    };
    return map[direction] || "up";
  };

  resetGrid = () => {
    let grid = this.makeGrid();
    this.setState({ grid });
  };

  toggleRandomNotes = () => {
    this.setState({ isRandomNotes: !this.state.isRandomNotes }, () =>
      this.resetGrid()
    );
  };

  cycleScale = () => {
    const { scale } = this.state;
    let newscale = "pentatonic";
    if (scale == "pentatonic") {
      newscale = "minor";
    }
    this.setState({ scale: newscale }, () => this.resetGrid());
  };

  makeGrid = () => {
    const { isRandomNotes } = this.state;
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
        let note = "C3";
        if (isRandomNotes) {
          note = this.randomNote();
        } else {
          note = this.getNote(x, y);
        }
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

  randomNote = () => {
    let { scale } = this.state;
    let possibleNotes = scales[scale];
    return possibleNotes[Math.floor(Math.random() * possibleNotes.length)];
  };

  getNote = (x, y) => {
    let { scale } = this.state;
    let possibleNotes = scales[scale];
    // possibleNotes = ["F#4", "A#4", "B4", "F#4"];
    let i = (x + y) % possibleNotes.length;
    return possibleNotes[i];
  };

  render() {
    const { grid, agents, isRandomNotes, scale } = this.state;
    return (
      <>
        <div>
          <div className="grid grid-cols-6 gap-4">
            {grid.map((row, y) =>
              row.map((cell, x) => {
                let matchingAgents = agents.filter(
                  (agent) => x === agent.loc[0] && y === agent.loc[1]
                );
                let whichAgentMatches = agents.findIndex(
                  (agent) => x === agent.loc[0] && y === agent.loc[1]
                );
                return (
                  <div key={x + "--" + y}>
                    <Cell
                      onClick={() => this.changeDirection(y, x)}
                      freq={grid[y][x].freq}
                      direction={grid[y][x].direction}
                      playNote={this.playNote}
                      active={matchingAgents.length > 0}
                      whichAgentMatches={whichAgentMatches}
                    />
                  </div>
                );
              })
            )}
            {/* <div>{JSON.stringify(agents)}</div> */}
          </div>
        </div>
        <div className="text-sm mt-5">
          {[0, 1, 2, 3].map((i) => {
            let agent = agents[i];
            if (agent.active) {
              return (
                <div
                  key={"agent" + i}
                  className="text-green-300 cursor-pointer"
                  onClick={() => this.toggleActive(i)}
                >
                  Agent {i}: on
                </div>
              );
            } else {
              return (
                <div
                  key={"agent" + i}
                  className="text-red-300 cursor-pointer"
                  onClick={() => this.toggleActive(i)}
                >
                  Agent {i}: off
                </div>
              );
            }
          })}
          <div className="mt-5">
            <div>
              Note layout in grid:
              {isRandomNotes && (
                <span
                  className="ml-2 cursor-pointer text-blue-300"
                  onClick={() => this.toggleRandomNotes()}
                >
                  random
                </span>
              )}
              {!isRandomNotes && (
                <span
                  className="text-green-300 ml-2 cursor-pointer"
                  onClick={() => this.toggleRandomNotes()}
                >
                  sequential
                </span>
              )}
            </div>
            <div>
              Scale:{" "}
              <span
                className="ml-2 curor-pointer text-orange-300"
                onClick={() => this.cycleScale()}
              >
                {scale}
              </span>
            </div>
            <button
              className="bg-cyan-600 py-2 px-4 rounded"
              onClick={() => this.resetGrid()}
            >
              Regenerate Grid
            </button>
          </div>
        </div>
        <div className="text-xs mt-10">
          <div>Click on arrows to change their direction</div>
          <div>Click on agent status to toggle</div>
          <div>
            Edit source code to change scales, tempo, agents, or oscillators
          </div>
          <div>Reload to get different random notes</div>
        </div>
      </>
    );
  }
}
export default Grid;
