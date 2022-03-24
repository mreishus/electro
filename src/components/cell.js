import React from "react";
import classNames from "classnames";

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
        {Math.round(freq)} {direction}
        <button onClick={() => playNote(freq)}>B</button>
      </div>
    );
  }
}
export default Cell;
