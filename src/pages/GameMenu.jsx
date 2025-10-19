import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseDB";

export default function GameMenu() {
  const [view, setView] = useState("menu"); // menu | p1Stats | p2Stats
  const [p1Stats, setP1Stats] = useState(null);
  const [p2Stats, setP2Stats] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { player1Uid, player2Uid } = location.state || {};

  // Fetch player stats from Firebase
  useEffect(() => {
    const fetchPlayerData = async (uid, setStats, playerLabel) => {
      if (!uid) {
        console.warn(`${playerLabel}: No UID provided`);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) setStats(userDoc.data());
        else setStats({ username: "Unknown", score: 0, timeSpent: 0 });
      } catch (err) {
        console.error(`Error fetching ${playerLabel}:`, err);
        setStats({ username: "Unknown", score: 0, timeSpent: 0 });
      }
    };

    fetchPlayerData(player1Uid, setP1Stats, "Player 1");
    fetchPlayerData(player2Uid, setP2Stats, "Player 2");
  }, [player1Uid, player2Uid]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/"); // back to login
  };

  const menuItemStyle =
    "text-white text-3xl mb-6 cursor-pointer transition-transform duration-200 hover:scale-125";

  const renderMenu = () => (
    <div className="flex flex-col items-center gap-8">
      <p className={menuItemStyle} onClick={() => alert("Start Game!")}>
        ▶ Play
      </p>
      <p className={menuItemStyle} onClick={() => setView("p1Stats")}>
        👤 Player 1 Stats
      </p>
      <p className={menuItemStyle} onClick={() => setView("p2Stats")}>
        👤 Player 2 Stats
      </p>
      <p
        className={`${menuItemStyle} text-red-400 hover:text-red-600`}
        onClick={handleLogout}
      >
        ✖ Logout
      </p>
    </div>
  );

  const renderStats = (stats, playerLabel) => (
    <div className="flex flex-col items-center gap-4 bg-black/70 text-white px-8 py-6 rounded-xl shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-3">{playerLabel} Stats</h2>
      {stats ? (
        <>
          <p>👾 Username: {stats.username}</p>
          <p>🏆 Score: {stats.score ?? 0}</p>
          <p>⏱️ Time Spent: {stats.timeSpent ?? 0} sec</p>
        </>
      ) : (
        <p>Loading...</p>
      )}
      <p
        className="mt-6 text-xl cursor-pointer hover:scale-125 transition-transform text-indigo-400 hover:text-indigo-300"
        onClick={() => setView("menu")}
      >
        ← Back to Menu
      </p>
    </div>
  );

  return (
    <div
      className="relative w-screen h-screen flex flex-col justify-center items-center overflow-hidden"
      style={{
        backgroundImage: "url('/assets/home.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Press Start 2P', cursive",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>
      <h1 className="absolute top-[10%] text-6xl font-extrabold z-10 text-white drop-shadow-lg">
        Train and the Bridge
      </h1>
      <div className="z-10 mt-40 flex flex-col items-center text-center">
        {view === "menu" && renderMenu()}
        {view === "p1Stats" && renderStats(p1Stats, "Player 1")}
        {view === "p2Stats" && renderStats(p2Stats, "Player 2")}
      </div>
    </div>
  );
}
