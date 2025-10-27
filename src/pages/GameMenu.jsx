import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseDB";

export default function GameMenu() {
  const [view, setView] = useState("menu");
  const [p1Stats, setP1Stats] = useState(null);
  const [p2Stats, setP2Stats] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();
  const { player1Uid, player2Uid } = location.state || {};

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const startTime = Date.now();

    const saveTimeSpent = async () => {
      const endTime = Date.now();
      const sessionTime = Math.floor((endTime - startTime) / 1000);

      const prevTime = parseInt(localStorage.getItem("unsavedTime")) || 0;
      const totalTime = prevTime + sessionTime;

      localStorage.setItem("unsavedTime", totalTime);

      try {
        const updatePlayerTime = async (uid) => {
          if (!uid) return;
          const playerRef = doc(db, "users", uid);
          const snap = await getDoc(playerRef);
          const currentTime = snap.exists() ? snap.data().timeSpent ?? 0 : 0;
          await updateDoc(playerRef, { timeSpent: currentTime + totalTime });
        };

        await Promise.all([
          updatePlayerTime(player1Uid),
          updatePlayerTime(player2Uid),
        ]);

        localStorage.removeItem("unsavedTime");
      } catch (err) {}
    };

    window.addEventListener("beforeunload", saveTimeSpent);
    return () => {
      saveTimeSpent();
      window.removeEventListener("beforeunload", saveTimeSpent);
    };
  }, [player1Uid, player2Uid]);

  useEffect(() => {
    const fetchPlayerData = async (uid, setStats) => {
      if (!uid) return;

      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) setStats(userDoc.data());
        else setStats({ username: "Unknown", score: 0, timeSpent: 0 });
      } catch {
        setStats({ username: "Unknown", score: 0, timeSpent: 0 });
      }
    };

    fetchPlayerData(player1Uid, setP1Stats);
    fetchPlayerData(player2Uid, setP2Stats);
  }, [player1Uid, player2Uid]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const calculateLevel = (score) => {
    let level = 0;
    let threshold = 0;

    while (score >= threshold) {
      level++;
      threshold += level * 1000;
    }

    return level - 1;
  };

  const handlePlay = () => {
    navigate("/gameplay", {
      state: { player1Uid, player2Uid },
    });
  };

  const menuItemStyle =
    "text-white text-3xl mb-6 cursor-pointer transition-transform duration-200 hover:scale-125";

  const renderMenu = () => (
    <div className="flex flex-col items-center gap-8">
      <p className={menuItemStyle} onClick={handlePlay}>
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

  const formatTime = (seconds) => {
    if (!seconds) return "0 sec";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    let result = "";
    if (hrs > 0) result += `${hrs} hr${hrs > 1 ? "s" : ""} `;
    if (mins > 0) result += `${mins} min `;
    if (secs > 0 || result === "") result += `${secs} sec`;
    return result.trim();
  };

  const renderStats = (stats, playerLabel) => (
    <div className="flex flex-col items-center gap-4 bg-black/70 text-white px-8 py-6 rounded-xl shadow-xl text-center">
      <h2 className="text-2xl font-bold mb-3">{playerLabel} Stats</h2>
      {stats ? (
        <>
          <p>👾 Username: {stats.username}</p>
          <p>🏆 Score: {stats.score ?? 0}</p>
          <p>🧩 Level: {calculateLevel(stats.score ?? 0)}</p>
          <p>⏱️ Time Spent: {formatTime(stats.timeSpent)}</p>
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
