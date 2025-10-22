import { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import GameMenu from "./pages/GameMenu";
import GamePlay from "./pages/GamePlay";

function App() {
  const [player1Uid, setPlayer1Uid] = useState(null);
  const [player2Uid, setPlayer2Uid] = useState(null);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={<Home onStart={() => window.location.href = "/login"} />}
        />
        <Route
          path="/login"
          element={
            <Login
              onBothLoggedIn={({ player1Uid, player2Uid }) => {
                setPlayer1Uid(player1Uid);
                setPlayer2Uid(player2Uid);
                window.location.href = "/game";
              }}
            />
          }
        />
        <Route
          path="/game"
          element={
            <GameMenu
              player1Uid={player1Uid}
              player2Uid={player2Uid}
            />
          }
        />
        <Route path="/gameplay" element={<GamePlay />} />
      </Routes>
    </Router>
  );
}

export default App;
