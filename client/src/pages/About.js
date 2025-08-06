import React, { useState } from "react";

function AdditionForm() {
  const [a, setA] = useState(50);
  const [b, setB] = useState(25);

  const handleAChange = (e) => setA(parseInt(e.target.value, 10));
  const handleBChange = (e) => setB(parseInt(e.target.value, 10));

  return (
    <form>
      <input
        type="range"
        value={a}
        onChange={handleAChange}
        min="0"
        max="245"
      />
      {' + '}
      <input
        type="number"
        value={b}
        onChange={handleBChange}
      />
      {' = '}
      <output>{a + b}</output>
    </form>
  );
}

function App() {
  return (
    <div>
      <h2>ABOUT</h2>
      <p>first paragraph.</p>
      <p>hello</p>
      <a href="/home" className="button"><button>Click</button></a> <br />
      <a href="/test" className="button"><button>Datatable</button></a>
      <p>
        <select id="select">
          <option>Apple</option>
          <option>Pear</option>
          <option>Banana</option>
          <option>Orange</option>
        </select>
      </p>
      <p>
        <AdditionForm />
      </p>
    </div>
  );
}

export default App;
