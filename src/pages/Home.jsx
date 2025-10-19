import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleStart = () => {
      navigate("/login"); // Redirect to login page
    };

    window.addEventListener("keydown", handleStart);
    window.addEventListener("click", handleStart);

    return () => {
      window.removeEventListener("keydown", handleStart);
      window.removeEventListener("click", handleStart);
    };
  }, [navigate]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col justify-between items-center text-white"
      style={{
        backgroundImage: "url('/assets/home.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      {/* Game Title */}
      <h1
        className="absolute top-[10%] text-6xl font-extrabold z-10"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        Train and the Bridge
      </h1>

      {/* Press key text */}
      <p
        className="absolute bottom-[20%] text-2xl animate-pulse z-10"
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        Press any key or click to start
      </p>
    </div>
  );
}
