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
    const { playNote, direction, freq, active } = this.props;
    const divClass = classNames({
      "bg-blue-400": active,
    });
    return (
      <div className={divClass}>
        {dirDisplay[direction]}
        <button onClick={() => playNote(freq)}>B</button>
      </div>
    );
  }
}
export default Cell;
