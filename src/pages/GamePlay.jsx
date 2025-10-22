import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseDB";

export default function GamePlay({ speed = 500 }) {
  const location = useLocation();
  const { player1Uid, player2Uid } = location.state || {};

  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState({});
  const [offset, setOffset] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [arrived, setArrived] = useState(false);

  const [player1Pos, setPlayer1Pos] = useState({ x: 200, y: window.innerHeight / 2 + 80 });
  const initialPosRef = useRef({ x: 200, y: window.innerHeight / 2 + 80 });
  const [isWalking, setIsWalking] = useState(false);

  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  const [p1Name, setP1Name] = useState("Not logged");
  const [p2Name, setP2Name] = useState("Not logged");

  const [brokenTiles, setBrokenTiles] = useState(new Set());
  const brokenTilesRef = useRef(new Set());
  const lastVisibleIndexRef = useRef(null);
  const newTileCounterRef = useRef(0);
  const nextBreakAfterRef = useRef(4 + Math.floor(Math.random() * 3));

  const stationIndex = 50;

  // --- Repair state ---
  const [repairingTile, setRepairingTile] = useState(null); // { idx, xPos, returning }
  const repairStartPosRef = useRef({ x: 0, y: 0 });

  // --- Prevent zoom ---
  useEffect(() => {
    const preventZoomKeys = (e) => { if ((e.ctrlKey && ["+", "-", "="].includes(e.key)) || e.key === "Meta") e.preventDefault(); };
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

  // --- Preload images ---
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
      if (loadedCount === 6) setImages({ ground, rail, train, station, walking, walkingStatic }), setLoaded(true);
    };
    ground.src = "/assets/ground111.png";
    rail.src = "/assets/railway.png";
    train.src = "/assets/train.png";
    station.src = "/assets/station.png";
    walking.src = "/assets/walking.gif";
    walkingStatic.src = "/assets/walking.png";
    [ground, rail, train, station, walking, walkingStatic].forEach((img) => (img.onload = handleLoad));
  }, []);

  // --- Fetch player names ---
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

  // --- Handle breaking tiles ---
  const breakTile = (logicalIndex) => {
    if (arrived) return;
    if (Math.abs(logicalIndex - stationIndex) < 3) return;
    brokenTilesRef.current.add(logicalIndex);
    setBrokenTiles(new Set(brokenTilesRef.current));
  };

  // --- Train control ---
  useEffect(() => {
    const handleKeyDown = (e) => { if (e.code === "Space" && !stopped && !arrived) { e.preventDefault(); setIsMoving(true); } };
    const handleKeyUp = (e) => { if (e.code === "Space") { e.preventDefault(); setIsMoving(false); } };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [stopped, arrived]);

  // --- Player 1 walking ---
  const pressedKeysRef = useRef(new Set());
  useEffect(() => {
    if (stopped && !arrived && !repairingTile) {
      const moveSpeed = 10;

      const handleKeyDown = (e) => {
        if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
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
        if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key)) {
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
  }, [stopped, arrived, repairingTile]);

  // --- Train movement ---
  useEffect(() => {
    if (!loaded || stopped || !isMoving || arrived) return;

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
      const tileWidth = 300;
      const trainTileIndex = Math.floor(currentOffset / tileWidth);
      const extra = -150;
      if (trainTileIndex >= stationIndex - 2) { setArrived(true); setStopped(true); setIsMoving(false); cancelAnimationFrame(rafRef.current); return; }
      const visibleTiles = Math.ceil(window.innerWidth / tileWidth) + 2;
      const baseOffset = currentOffset % tileWidth;
      const leftmostIndex = Math.floor(currentOffset / tileWidth);
      for (let i = -1; i < visibleTiles - 1; i++) {
        const idx = leftmostIndex + i;
        if (brokenTilesRef.current.has(idx)) {
          const x = -baseOffset + i * tileWidth;
          if (x >= 0 && x + tileWidth <= window.innerWidth + extra) {
            setStopped(true); setIsMoving(false); cancelAnimationFrame(rafRef.current); break;
          }
        }
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(rafRef.current); lastTimeRef.current = null; };
  }, [loaded, speed, stopped, isMoving, arrived]);

  // --- Mouse click to repair ---
  const isClickOnGap = (e) => {
    const tileWidth = 300;
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
    if (repairingTile) return;
    const target = isClickOnGap(e);
    if (!target) return;
    setRepairingTile({ ...target, returning: false });
    repairStartPosRef.current = { ...initialPosRef.current }; // Always go back to initial position
    setIsWalking(true);
    console.log("Repair clicked:", target);
  };

  // --- Animate repair ---
  useEffect(() => {
    if (!repairingTile) return;
    let animId;

    const animate = () => {
      setPlayer1Pos((pos) => {
        const speed = 8;
        let targetX, targetY;

        if (!repairingTile.returning) {
          // First move down if needed
          if (pos.y < window.innerHeight / 2 + 120) { // move below railway
            targetY = window.innerHeight / 2 + 120;
            targetX = pos.x;
          } else {
            targetY = pos.y;
            targetX = repairingTile.xPos;
          }
        } else {
          targetX = repairStartPosRef.current.x;
          targetY = repairStartPosRef.current.y;
        }

        const dx = targetX - pos.x;
        const dy = targetY - pos.y;

        // If reached target
        if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) {
          if (!repairingTile.returning) {
            console.log("Repairing tile:", repairingTile.idx);
            const updated = new Set(brokenTilesRef.current);
            updated.delete(repairingTile.idx);
            brokenTilesRef.current = updated;
            setBrokenTiles(updated);
            setRepairingTile({ ...repairingTile, returning: true });
            return pos;
          } else {
            console.log("Returned to initial position");
            setRepairingTile(null);
            setIsWalking(false);
            return { ...initialPosRef.current };
          }
        }

        return {
          x: pos.x + Math.sign(dx) * speed,
          y: pos.y + Math.sign(dy) * speed,
        };
      });

      if (repairingTile) animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [repairingTile]);

  // --- Render tiles ---
  const renderTiles = () => {
    const tileWidth = 300;
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
            backgroundImage: isBroken ? "none" : `url(${images.rail.src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "100% 100%",
            pointerEvents: "none",
          }}
        />
      );
    }
    return tiles;
  };

  if (!loaded) return <div className="w-screen h-screen flex items-center justify-center bg-black text-white">Loading assets...</div>;

  return (
    <div className="w-screen h-screen overflow-hidden bg-black relative" style={{ fontFamily: "'Press Start 2P', cursive" }} onClick={handleRepairClick}>
      {/* Ground */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${images.ground.src})`, backgroundRepeat: "repeat-x", backgroundSize: "auto 100%", backgroundPositionX: `${-offset}px`, zIndex: 1 }} />
      {/* Station */}
      <div style={{ position: "absolute", top: "28%", left: `${stationIndex * 300 - offset + 500}px`, transform: "translateY(-50%)", width: "200px", height: "auto", zIndex: 6 }}>
        <img src={images.station.src} alt="Station" style={{ width: "100%", height: "auto", pointerEvents: "none" }} />
      </div>
      {/* Rails & Train */}
      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", width: "100%", height: "100px", zIndex: 5 }}>
        {renderTiles()}
        <img src={images.train.src} alt="Train" style={{ position: "absolute", bottom: "-3px", left: "0%", height: "104px", zIndex: 10, pointerEvents: "none" }} />
      </div>
      {/* Player 1 */}
      <img
        src={isWalking ? images.walking.src : images.walkingStatic.src}
        alt="Player 1"
        style={{
          position: "absolute",
          left: `${player1Pos.x}px`,
          top: `${player1Pos.y}px`,
          height: "80px",
          width: "auto",
          zIndex: 20,
          transition: "transform 0.1s",
          transform: isWalking ? "scale(1.05)" : "scale(1)",
          pointerEvents: "none",
        }}
      />
      {/* HUD */}
      <div className="absolute top-3 left-3 z-20 text-white bg-black/60 p-3 rounded" style={{ lineHeight: 1.7, left: "10px" }}>
        <div className="text-sm">Player 1 : <span className="font-normal">{p1Name}</span></div>
        <div className="text-sm mt-1">Player 2 : <span className="font-normal">{p2Name}</span></div>
      </div>
      {!isMoving && !stopped && !arrived && (
        <p className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 text-2xl animate-pulse text-white z-10">Player 2 : Use space button to move the train</p>
      )}
      {stopped && !arrived && (
        <p className="absolute bottom-[65%] left-1/2 transform -translate-x-1/2 text-2xl animate-pulse text-red-400 z-20">🚧 Broken track! Player 1: Use arrow keys or click to repair!</p>
      )}
      {arrived && (
        <p className="absolute bottom-[30%] left-1/2 transform -translate-x-1/2 text-3xl text-green-400 animate-pulse z-20">🚂 Train has arrived at the station!</p>
      )}
    </div>
  );
}
