import React from "react";
import classNames from "classnames";

const dirDisplay = {
  right: "→",
  left: "←",
  up: "↑",
  down: "↓",
};
class Cell extends React.Component {
  componentDidUpdate(prevProps) {
    const { playNote, freq, active } = this.props;
    if (!prevProps.active && active) {
      playNote(freq);
    }
  }
  render() {
    const { playNote, direction, freq, active, onClick, whichAgentMatches } =
      this.props;
    const divClass = classNames({
      "bg-blue-400": active && whichAgentMatches === 0,
      "bg-green-400": active && whichAgentMatches === 1,
      "bg-red-400": active && whichAgentMatches === 2,
      "bg-purple-400": active && whichAgentMatches === 3,
      "cursor-pointer": true,
    });
    return (
      <div className={divClass} onClick={onClick}>
        {dirDisplay[direction]}
        {/* <button onClick={() => playNote(freq)}>B</button> */}
      </div>
    );
  }
}
export default Cell;
