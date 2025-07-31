function App() {
  return (
    <body > 
  <h2>ABOUT</h2>
  <p>first paragraph.</p>
  <p>second paragraph.</p>
  <a href="http://localhost:3000/home" class="button"><button>Click</button></a>
  <p>
  <select id="select">
  <option>Apple</option>
  <option>Pear</option>
  <option>Banana</option>
  <option>Orange</option>
</select>
</p>
<p>
  <form oninput="x.value=parseInt(a.value)+parseInt(b.value)">
  <input type="range" id="a" value="50"></input>
  +<input type="number" id="b" value="25"></input>
  =<output name="x" for="ab"></output>
</form>
</p>
</body>
);
}

export default App;
