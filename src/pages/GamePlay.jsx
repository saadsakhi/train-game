import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebaseDB";
import { createPortal } from "react-dom";

 

export default function GamePlay({ speed = 500 }) {
  const gameRef = useRef(null);
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      let width = window.innerWidth;
      let height = window.innerHeight;
      const container = gameRef.current;

      if (!container) return;

      if (width < height) {
        
        console.log("📱 Rotating gameplay to landscape...");
        setIsRotated(true);

        
        [width, height] = [height, width];

        container.style.transform = "rotate(90deg)";
        container.style.transformOrigin = "center center";
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = `${height}px`;
        container.style.height = `${width}px`;
        container.style.backgroundColor = "black";
        container.style.overflow = "hidden";

        document.body.style.margin = "0";
        document.documentElement.style.margin = "0";
        document.body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
      } else {
        console.log("💻 Landscape mode — no rotation.");
        setIsRotated(false);

        container.style.transform = "";
        container.style.width = "100vw";
        container.style.height = "100vh";
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.backgroundColor = "black";

        document.body.style.margin = "";
        document.documentElement.style.margin = "";
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
      }

      setScreenSize({ width, height });
    };

    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const BASE_WIDTH = screenSize.width;
  const BASE_HEIGHT = screenSize.height;
  const targetAspect = BASE_WIDTH / BASE_HEIGHT;
  const windowAspect = window.innerWidth / window.innerHeight;

  const [scale, setScale] = useState(() =>
    windowAspect > targetAspect
      ? window.innerHeight / BASE_HEIGHT
      : window.innerWidth / BASE_WIDTH
  );

  useEffect(() => {
    const handleScale = () => {
      const newScale =
        windowAspect > targetAspect
          ? window.innerHeight / BASE_HEIGHT
          : window.innerWidth / BASE_WIDTH;
      setScale(newScale);
    };
    window.addEventListener("resize", handleScale);
    return () => window.removeEventListener("resize", handleScale);
  }, [BASE_WIDTH, BASE_HEIGHT]);


  const location = useLocation();
  const navigate = useNavigate();
  const { player1Uid, player2Uid } = location.state || {};

  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState({});
  const [offset, setOffset] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [showMenu, setShowMenu] = useState(false);


  const initialPosRef = useRef({ x: 200, y: window.innerHeight / 2 + 80 });
  const [isWalking, setIsWalking] = useState(false);

  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const [p1Name, setP1Name] = useState("Not logged");
  const [p2Name, setP2Name] = useState("Not logged");

  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);

  const [brokenTiles, setBrokenTiles] = useState(new Set());
  const brokenTilesRef = useRef(new Set());
  const lastVisibleIndexRef = useRef(null);
  const newTileCounterRef = useRef(0);
  const nextBreakAfterRef = useRef(4 + Math.floor(Math.random() * 3));

  const stationIndex = 50;

  const [repairingTile, setRepairingTile] = useState(null);
  const repairStartPosRef = useRef({ x: 0, y: 0 });
  const [repairingGif, setRepairingGif] = useState(false);
  const repairGifPosRef = useRef({ x: 0, y: 0 }); 
  const bgMusicRef = useRef(null);
  const W = screenSize.width;
  const H = screenSize.height;
  
  const tileWidth = W * 0.2; 
  const railHeight = H * 0.15; 
  const trainHeight = H * 0.14; 
  const brokenRailWidth = W * 0.08; 
  const playerHeight = H * 0.18; 
  const stopBuffer = W * 0.03; 
  const trainWidth = W * 0.65;
  const stationWidth = W * 0.20;
  const playerWidth = W * 0.14;
const [player1Pos, setPlayer1Pos] = useState({
  x: W * 0.13,
  y: H / 2 + H * 0.1,
});


  const stopTrain = () => {
  setStopped(true);
  setIsMoving(false);
  cancelAnimationFrame(rafRef.current);
};

  useEffect(() => {
    const preventZoomKeys = (e) => {
      if ((e.ctrlKey && ["+", "-", "="].includes(e.key)) || e.key === "Meta") e.preventDefault();
    };
    const preventWheelZoom = (e) => { if (e.ctrlKey) e.preventDefault(); };
    const preventTouchZoom = (e) => { if (e.touches.length > 1) e.preventDefault(); };
    document.addEventListener("keydown", preventZoomKeys, { passive: false });
    document.addEventListener("wheel", preventWheelZoom, { passive: false });
    document.addEventListener("touchmove", preventTouchZoom, { passive: false });
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", preventZoomKeys);
      document.removeEventListener("wheel", preventWheelZoom);
      document.removeEventListener("touchmove", preventTouchZoom);
      document.body.style.overflow = "auto";
    };
  }, []);

  
  useEffect(() => {
    const ground = new Image();
    const rail = new Image();
    const train = new Image();
    const station = new Image();
    const walking = new Image();
    const walkingStatic = new Image();
    let loadedCount = 0;
    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === 6)
        setImages({ ground, rail, train, station, walking, walkingStatic }), setLoaded(true);
    };
    ground.src = "/assets/ground111.png";
    rail.src = "/assets/railway.png";
    train.src = "/assets/train.png";
    station.src = "/assets/stationn.png";
    walking.src = "/assets/gif1.gif";
    walkingStatic.src = "/assets/gif.PNG";
    [ground, rail, train, station, walking, walkingStatic].forEach((img) => (img.onload = handleLoad));
  }, []);

  useEffect(() => {
    let mounted = true;
    const fetchName = async (uid, setName) => {
      if (!uid) return setName("Not logged");
      try {
        const d = await getDoc(doc(db, "users", uid));
        if (mounted) setName(d.exists() ? d.data().username ?? "Unknown" : "Unknown");
      } catch {
        if (mounted) setName("Unknown");
      }
    };
    fetchName(player1Uid, setP1Name);
    fetchName(player2Uid, setP2Name);
    return () => { mounted = false; };
  }, [player1Uid, player2Uid]);

useEffect(() => {
  bgMusicRef.current = new Audio("/assets/gameplay.mp3");
  bgMusicRef.current.loop = true;
  bgMusicRef.current.volume = 0.7;

  const playMusic = async () => {
    try {
      await bgMusicRef.current.play();
    } catch (e) {
      const resumeMusic = () => {
        bgMusicRef.current.play().catch(() => {});
        window.removeEventListener("click", resumeMusic);
        window.removeEventListener("keydown", resumeMusic);
      };
      window.addEventListener("click", resumeMusic, { once: true });
      window.addEventListener("keydown", resumeMusic, { once: true });
    }
  };


  playMusic();

  return () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.pause();
      bgMusicRef.current.currentTime = 0;
    }
    window.removeEventListener("click", playMusic);
    window.removeEventListener("keydown", playMusic);
  };
}, []);



useEffect(() => {
  if (repairingGif) return;

  let walkingAudio;

    if (isWalking) {
      walkingAudio = new Audio("/assets/truck.mp3");
      walkingAudio.loop = true;
      walkingAudio.volume = 1;
      walkingAudio.play().catch(() => {});
    }


  return () => {
    if (walkingAudio) {
      walkingAudio.pause();
      walkingAudio.currentTime = 0;
    }
  };
}, [isWalking, repairingGif]);


  useEffect(() => {
  let audio;

    if (repairingGif) {
      audio = new Audio("/assets/construction.mp3");
      audio.volume = 0.4;
      audio.play().catch(() => {});

    
    const stopTimeout = setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, 7000);

    return () => {
      clearTimeout(stopTimeout);
      audio.pause();
      audio.currentTime = 0;
    };
  }
}, [repairingGif]);


  const breakTile = (logicalIndex) => {
    if (arrived) return;
    if (Math.abs(logicalIndex - stationIndex) < 3) return;
    brokenTilesRef.current.add(logicalIndex);
    setBrokenTiles(new Set(brokenTilesRef.current));
  };


  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "Space" && !stopped && !arrived && !showMenu) {
        e.preventDefault();
        setIsMoving(true);
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsMoving(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [stopped, arrived, showMenu]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setShowMenu((prev) => !prev);
        setIsMoving(false);
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const pressedKeysRef = useRef(new Set());
  useEffect(() => {
    if (stopped && !arrived && !repairingTile && !showMenu) {
      const moveSpeed = window.innerWidth * 0.01; 
      const handleKeyDown = (e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          pressedKeysRef.current.add(e.key);
          setIsWalking(true);
          setPlayer1Pos((pos) => {
            const newPos = { ...pos };
            if (pressedKeysRef.current.has("ArrowLeft")) newPos.x = Math.max(0, pos.x - moveSpeed);
            if (pressedKeysRef.current.has("ArrowRight")) newPos.x = Math.min(window.innerWidth - 50, pos.x + moveSpeed);
            if (pressedKeysRef.current.has("ArrowUp")) newPos.y = Math.max(window.innerHeight / 2 - 20, pos.y - moveSpeed);
            if (pressedKeysRef.current.has("ArrowDown")) newPos.y = Math.min(window.innerHeight - 80, pos.y + moveSpeed);
            return newPos;
          });
        }
      };
      const handleKeyUp = (e) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
          pressedKeysRef.current.delete(e.key);
          if (pressedKeysRef.current.size === 0) setIsWalking(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, [stopped, arrived, repairingTile, showMenu]);

  useEffect(() => {
  let audio;

  if (isMoving && !stopped && !arrived && !showMenu) {
    audio = new Audio("/assets/train.mp3");
    audio.loop = true; 
    audio.volume = 0.3; 
    audio.play().catch(() => {});
  }

  return () => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };
}, [isMoving, stopped, arrived, showMenu]);

  useEffect(() => {
    if (!loaded || stopped || !isMoving || arrived || showMenu) return;
    const step = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      setOffset((prev) => {
        const newOffset = prev + speed * dt;
        checkStop(newOffset);
        return newOffset;
      });
      if (!stopped && isMoving) rafRef.current = requestAnimationFrame(step);
    };
const checkStop = (currentOffset) => {
  const trainFront = trainWidth; 

  const trainTileIndex = Math.floor(currentOffset / tileWidth);

  if (trainTileIndex >= stationIndex - 2) {
    setArrived(true);
    setStopped(true);
    setIsMoving(false);
    cancelAnimationFrame(rafRef.current);
    updateScoresInDB();
    return;
  }

  const visibleTiles = Math.ceil(window.innerWidth / tileWidth) + 2;
  const baseOffset = currentOffset % tileWidth;
  const leftmostIndex = Math.floor(currentOffset / tileWidth);

  for (let i = -1; i < visibleTiles - 1; i++) {
    const idx = leftmostIndex + i;

    if (brokenTilesRef.current.has(idx)) {
      const gapX = -baseOffset + i * tileWidth; 
      const trainFrontX = trainFront; 

      if (gapX - trainFrontX <= stopBuffer && gapX - trainFrontX > -tileWidth) {
        setStopped(true);
        setIsMoving(false);
        cancelAnimationFrame(rafRef.current);
        break;
      }
    }
  }
};


    rafRef.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(rafRef.current); lastTimeRef.current = null; };
  }, [loaded, speed, stopped, isMoving, arrived, showMenu]);

  const isClickOnGap = (e) => {
    const visibleTiles = Math.ceil(window.innerWidth / tileWidth) + 2;
    const baseOffset = offset % tileWidth;
    const leftmostIndex = Math.floor(offset / tileWidth);
    for (let i = -1; i < visibleTiles - 1; i++) {
      const idx = leftmostIndex + i;
      if (brokenTilesRef.current.has(idx)) {
        const x = -baseOffset + i * tileWidth;
        const rightEdge = x + tileWidth;
        if (e.clientX >= x && e.clientX <= rightEdge) return { idx, xPos: x };
      }
    }
    return null;
  };

const handleRepairClick = (e) => {
  if (repairingTile || showMenu) return;
  const target = isClickOnGap(e);
  if (!target) return;

  const tileLeft = target.xPos;
  const tileRight = tileLeft + tileWidth;
  const playerWidth = 50;
  const playerLeft = player1Pos.x;
  const playerRight = player1Pos.x + playerWidth;
  const isInsideBrokenArea = playerRight >= tileLeft && playerLeft <= tileRight;
  if (!isInsideBrokenArea) return;

  repairGifPosRef.current = { ...player1Pos };
  setRepairingGif(true);

  setTimeout(() => {
    setRepairingGif(false);
    setRepairingTile({ ...target, returning: false });
    repairStartPosRef.current = { ...initialPosRef.current };
    setIsWalking(true);
  }, 7000);
};




useEffect(() => {
  if (!repairingTile) return;
  let animId;

  const animate = () => {
    setPlayer1Pos((pos) => {
      const speed = 8;
      let targetX, targetY;

      if (!repairingTile.returning) {
        targetX = repairingTile.xPos;
        targetY = window.innerHeight / 2 + 120;
      } else {
        targetX = repairStartPosRef.current.x;
        targetY = repairStartPosRef.current.y;
      }

      const dx = targetX - pos.x;
      const dy = targetY - pos.y;

      if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) {
        if (!repairingTile.returning) {
          const updated = new Set(brokenTilesRef.current);
          updated.delete(repairingTile.idx);
          brokenTilesRef.current = updated;
          setBrokenTiles(updated);

          setP1Score((s) => s + 50);
          setP2Score((s) => s + 50);

          setRepairingTile({ ...repairingTile, returning: true });
          return pos;
        } else {
          setStopped(false);
          setIsWalking(false);
          setRepairingTile(null);
          return { ...initialPosRef.current };
        }
      }

      return { x: pos.x + Math.sign(dx) * speed, y: pos.y + Math.sign(dy) * speed };
    });

    animId = requestAnimationFrame(animate);
  };

  animId = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(animId);
}, [repairingTile]);




  const updateScoresInDB = async () => {
    try {
      if (player1Uid && p1Score > 0) {
        const player1Doc = doc(db, "users", player1Uid);
        const player1Snap = await getDoc(player1Doc);
        const currentP1Score = player1Snap.exists() ? player1Snap.data().score ?? 0 : 0;
        await updateDoc(player1Doc, { score: currentP1Score + p1Score });
      }

      if (player2Uid && p2Score > 0) {
        const player2Doc = doc(db, "users", player2Uid);
        const player2Snap = await getDoc(player2Doc);
        const currentP2Score = player2Snap.exists() ? player2Snap.data().score ?? 0 : 0;
        await updateDoc(player2Doc, { score: currentP2Score + p2Score });
      }

      setTimeout(() => {
        setP1Score(0);
        setP2Score(0);
      }, 500);
    } catch (err) {
      
    }
  };

  useEffect(() => {
    setP1Score(0);
    setP2Score(0);
  }, [player1Uid, player2Uid]);

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  let result = "";
  if (hrs > 0) result += `${hrs} hr${hrs > 1 ? "s" : ""} `;
  if (mins > 0 || hrs > 0) result += `${mins} min `;
  result += `${secs} sec`;
  return result.trim();
}

  useEffect(() => {
    if (!player1Uid || !player2Uid) {
      navigate("/", { replace: true });
    }
  }, [player1Uid, player2Uid, navigate]);

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
        const newTotal = currentTime + totalTime;

        await updateDoc(playerRef, { timeSpent: newTotal });
      };

      await Promise.all([
        updatePlayerTime(player1Uid),
        updatePlayerTime(player2Uid),
      ]);

      localStorage.removeItem("unsavedTime");
    } catch (err) {
      
    }
  };

  window.addEventListener("beforeunload", saveTimeSpent);
  return () => {
    saveTimeSpent();
    window.removeEventListener("beforeunload", saveTimeSpent);
  };
}, [player1Uid, player2Uid]);
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
    } catch (err) {
      
    }
  };

  window.addEventListener("beforeunload", saveTimeSpent);
  return () => {
    saveTimeSpent();
    window.removeEventListener("beforeunload", saveTimeSpent);
  };
}, [player1Uid, player2Uid]);


  const handleResume = () => setShowMenu(false);
  const handleExit = () => {
  navigate("/game", {
    state: {
      player1Uid,
      player2Uid,
    },
  });
};


  const handlePlayAgain = () => {
    window.location.reload();
  };

 const renderArrivalMenu = () =>
  createPortal(
    <div
      id="arrival-overlay"
      className="fixed inset-0 flex flex-col justify-center items-start bg-black/80 backdrop-blur-sm z-[999999]"
      style={{
        position: "fixed",
        top: -120,
        left: 0,
        width: "100vw",
        height: "100vh",
        fontFamily: "'Press Start 2P', cursive",
        paddingLeft: "10px",
      }}
    >
      <div className="flex flex-col text-left space-y-8">
        <p
          className="text-white text-3xl cursor-pointer transition-transform duration-200 hover:scale-125 drop-shadow-lg"
          onClick={handlePlayAgain}
        >
          🔁 Play Again
        </p>
        <p
          className="text-white text-3xl cursor-pointer transition-transform duration-200 hover:scale-125 drop-shadow-lg"
          onClick={handleExit}
        >
          🏠 Exit to Main Menu
        </p>
      </div>
    </div>,
    document.body
  );


  const renderMenu = () =>
    createPortal(
      <div
        id="pause-overlay"
        className="fixed inset-0 flex flex-col justify-center items-center bg-black/80 backdrop-blur-sm z-[999999]"
        style={{
          position: "fixed",
          top: -140,
          left: -600,
          width: "100vw",
          height: "100vh",
          fontFamily: "'Press Start 2P', cursive",
        }}
      >
        <h2 className="text-5xl text-white font-extrabold mb-12 drop-shadow-lg text-center">
          Game Paused
        </h2>
        <div className="flex flex-col items-center text-center space-y-8">
          <p
            className="text-white text-3xl cursor-pointer transition-transform duration-200 hover:scale-125 drop-shadow-lg"
            onClick={handleResume}
          >
            ▶ Resume
          </p>
          <p
            className="text-white text-3xl cursor-pointer transition-transform duration-200 hover:scale-125 drop-shadow-lg"
            onClick={handleExit}
          >
            🏠 Exit to Main Menu
          </p>
        </div>
      </div>,
      document.body
    );

  if (!loaded)
    return <div className="w-screen h-screen flex items-center justify-center bg-black text-white">Loading assets...</div>;

  return (
  <div
    ref={gameRef} 
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      overflow: "hidden",
      backgroundColor: "black",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <div
      className="w-full h-full overflow-hidden bg-black relative"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
        position: "relative",
      }}
    >
        
        <div
          className="w-full h-full overflow-hidden bg-black relative"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
      onClick={handleRepairClick}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${images.ground.src})`,
          backgroundRepeat: "repeat-x",
          backgroundSize: "auto 100%",
          backgroundPositionX: `${-offset}px`,
          zIndex: 1,
        }}
      />
<div
  style={{
    position: "absolute",
    top: "28%",
    left: `${stationIndex * tileWidth - offset + W * 0.05}px`,
    transform: "translateY(-50%)",
    width: `${stationWidth}px`,
    height: "auto",
    zIndex: 6,
  }}
>

        <img src={images.station.src} alt="Station" style={{ width: "100%", height: "auto", pointerEvents: "none", userSelect: "none" }} />
      </div>
      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", width: "100%", height: "100px", zIndex: 5 }}>
        {(() => {
          const visibleTiles = Math.ceil(window.innerWidth / tileWidth) + 2;
          const baseOffset = offset % tileWidth;
          const leftmostIndex = Math.floor(offset / tileWidth);
          const rightmostIndex = leftmostIndex + visibleTiles - 1;
          if (lastVisibleIndexRef.current === null) lastVisibleIndexRef.current = rightmostIndex;
          else if (rightmostIndex > lastVisibleIndexRef.current) {
            newTileCounterRef.current++;
            lastVisibleIndexRef.current = rightmostIndex;
            if (!arrived && newTileCounterRef.current >= nextBreakAfterRef.current) {
              breakTile(rightmostIndex);
              newTileCounterRef.current = 0;
              nextBreakAfterRef.current = 4 + Math.floor(Math.random() * 3);
            }
          }
          const tiles = [];
          for (let i = -1; i < visibleTiles - 1; i++) {
            const idx = leftmostIndex + i;
            const x = -baseOffset + i * tileWidth;
            const isBroken = brokenTiles.has(idx);
    tiles.push(
<div
  key={`rail-${idx}`}
  style={{
    position: "absolute",
    left: `${x}px`,
    top: 0,
    width: `${tileWidth}px`,
    height: "100%",
  }}
>
  {!isBroken ? (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundImage: `url(${images.rail.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "100% 100%",
        pointerEvents: "none",
      }}
    />
  ) : (
    <>
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "transparent",
          pointerEvents: "none",
        }}
      />
      <img
        src="/assets/broken railway.png"
        alt="Broken Rail"
        style={{
          position: "absolute",
          top: `${H * 0.14}px`,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${brokenRailWidth}px`,
          height: "auto",
          zIndex: 7,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
    </>
  )}
</div>

    );

          }
          return tiles;
        })()}
<img
  src={images.train.src}
  alt="Train"
  draggable="false"
  style={{
    position: "absolute",
    top: 0,
    left: "0%",
    height: `${trainHeight}px`,
    width: `${trainWidth}px`,
    zIndex: 10,
    pointerEvents: "none",
    userSelect: "none",
  }}
/>


      </div>
<img
  src={
    repairingGif
      ? "/assets/gif2.gif"
      : isWalking
      ? images.walking.src
      : images.walkingStatic.src
  }
  alt="Player 1"
  style={{
    position: "absolute",
    left: `${repairingGif ? repairGifPosRef.current.x : player1Pos.x}px`,
    top: `${repairingGif ? repairGifPosRef.current.y : player1Pos.y}px`,
    height: `${playerHeight}px`,
    width: `${playerWidth}px`,
    zIndex: 20,
    transition: "transform 0.1s",
    transform: isWalking ? "scale(1.05)" : "scale(1)",
    pointerEvents: "none",
    userSelect: "none",
  }}
/>



      <div className="absolute top-3 left-3 z-20 text-white bg-black/60 p-3 rounded" style={{ lineHeight: 1.7, left: "10px" }}>
        <div className="text-sm">Player 1 : <span className="font-normal">{p1Name} - Score {p1Score}</span></div>
        <div className="text-sm mt-1">Player 2 : <span className="font-normal">{p2Name} - Score {p2Score}</span></div>
        <div className="text-sm mt-4" style={{ marginTop: "40px" }}>Click ESC to pause the game </div>
      </div>
      {!isMoving && !stopped && !arrived && (
        <p className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 text-2xl animate-pulse text-white z-10">
          Player 2 : Use space button to move the train
        </p>
      )}
      {stopped && !arrived && (
        <p className="absolute bottom-[65%] left-1/2 transform -translate-x-1/2 text-2xl animate-pulse text-red-400 z-20">
          🚧 Track damaged! Use arrows to reach it, then click to repair!
        </p>
      )}
      {arrived && (
        <>
          <p className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 text-3xl text-green-400 animate-pulse z-20">
            🚂 Train has arrived at the station!
          </p>
          {renderArrivalMenu()}
        </>
      )}
      {showMenu && renderMenu()}
    </div>
    </div>
    </div>
  );
}
