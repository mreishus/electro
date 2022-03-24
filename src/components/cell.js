import React from "react";

class Cell extends React.Component {
  render() {
    const {playNote, direction, freq} = this.props;
    return (
      <div>
        {Math.round(freq)} {direction}
        <button onClick={() => playNote(freq)}>
          B</button>
      </div>
    );
  }
}
export default Cell;
