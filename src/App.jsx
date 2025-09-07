import { useRef } from 'react';
import { PhaserGame } from './PhaserGame';

function App() {
  const phaserRef = useRef();

  return (
    <div id="app">
        <PhaserGame ref={phaserRef} />
    </div>
  );
}

export default App;
