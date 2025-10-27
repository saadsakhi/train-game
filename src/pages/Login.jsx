import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { createUserDocument } from "../firebaseDB";

export default function Login() {
  const navigate = useNavigate();

  const [player1Mode, setPlayer1Mode] = useState("login");
  const [player2Mode, setPlayer2Mode] = useState("login");
  const [player1Status, setPlayer1Status] = useState("idle");
  const [player2Status, setPlayer2Status] = useState("idle");
  const [player1Error, setPlayer1Error] = useState("");
  const [player2Error, setPlayer2Error] = useState("");
  const [player1Uid, setPlayer1Uid] = useState(null);
  const [player2Uid, setPlayer2Uid] = useState(null);

  const [p1Username, setP1Username] = useState("");
  const [p1Password, setP1Password] = useState("");
  const [p1Confirm, setP1Confirm] = useState("");

  const [p2Username, setP2Username] = useState("");
  const [p2Password, setP2Password] = useState("");
  const [p2Confirm, setP2Confirm] = useState("");

  useEffect(() => {
    if (player1Status === "logged_in" && player2Status === "logged_in") {
      navigate("/game", { state: { player1Uid, player2Uid } });
    }
  }, [player1Status, player2Status, navigate, player1Uid, player2Uid]);

  const fakeEmail = (username) => `${username}@trainbridge.com`;

  const handleP1Login = async () => {
    if (!p1Username || !p1Password) return setPlayer1Error("Please fill all fields");
    try {
      const res = await signInWithEmailAndPassword(auth, fakeEmail(p1Username), p1Password);
      setPlayer1Uid(res.user.uid);
      setPlayer1Status("logged_in");
      setPlayer1Error("");
    } catch {
      setPlayer1Error("Invalid username or password");
    }
  };

  const handleP1Register = async () => {
    if (!p1Username || !p1Password || !p1Confirm) return setPlayer1Error("Please fill all fields");
    if (p1Password.length < 8) return setPlayer1Error("Password must have at least 8 characters");
    if (p1Password !== p1Confirm) return setPlayer1Error("Passwords don't match");
    try {
      const res = await createUserWithEmailAndPassword(auth, fakeEmail(p1Username), p1Password);
      await createUserDocument(res.user.uid, p1Username);
      setPlayer1Uid(res.user.uid);
      setPlayer1Status("logged_in");
      setPlayer1Error("");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setPlayer1Error("Username already exists");
      else setPlayer1Error("Registration failed");
    }
  };

  const handleP2Login = async () => {
    if (!p2Username || !p2Password) return setPlayer2Error("Please fill all fields");
    try {
      const res = await signInWithEmailAndPassword(auth, fakeEmail(p2Username), p2Password);
      setPlayer2Uid(res.user.uid);
      setPlayer2Status("logged_in");
      setPlayer2Error("");
    } catch {
      setPlayer2Error("Invalid username or password");
    }
  };

  const handleP2Register = async () => {
    if (!p2Username || !p2Password || !p2Confirm) return setPlayer2Error("Please fill all fields");
    if (p2Password.length < 8) return setPlayer2Error("Password must have at least 8 characters");
    if (p2Password !== p2Confirm) return setPlayer2Error("Passwords don't match");
    try {
      const res = await createUserWithEmailAndPassword(auth, fakeEmail(p2Username), p2Password);
      await createUserDocument(res.user.uid, p2Username);
      setPlayer2Uid(res.user.uid);
      setPlayer2Status("logged_in");
      setPlayer2Error("");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setPlayer2Error("Username already exists");
      else setPlayer2Error("Registration failed");
    }
  };

  const loginBtn = `
  inline-block
  rounded-sm
  bg-indigo-600
  px-8
  py-3
  text-sm
  font-medium
  text-white
  transition
  hover:scale-110
  hover:shadow-xl
  focus:ring-3
  focus:outline-hidden
`;

const toggleBtn = `
  inline-block
  rounded-sm
  border
  border-current
  px-8
  py-3
  text-sm
  font-medium
  text-indigo-600
  transition
  hover:scale-110
  hover:shadow-xl
  focus:ring-3
  focus:outline-hidden
`;


  const inputClass =
    "w-full max-w-[200px] box-border rounded border border-gray-300 shadow-sm text-xs p-1.5 text-black";

  const errorClass = "text-red-500 mb-3 text-[14px]";


  const labelClass = "text-xs font-medium text-gray-700 mb-1";

  return (
    <div
      className="relative w-screen h-screen flex flex-col justify-center items-center text-white overflow-hidden"
      style={{
        backgroundImage: "url('/assets/home.gif')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        fontFamily: "'Press Start 2P', cursive",
      }}
    >
      <div className="absolute inset-0 bg-black/40 z-0"></div>

      <h1 className="absolute top-[10%] text-6xl font-extrabold z-10">
        Train and the Bridge
      </h1>

      <div className="z-10 flex justify-between w-3/4 mx-auto gap-6">
      
        <div className="w-64 p-6 bg-white rounded-lg flex flex-col items-start shadow-lg">
          {player1Status !== "logged_in" ? (
            <>
              <h2 className="text-xl mb-6 text-black">Player 1 (Bridge)</h2>
              <div className="flex flex-col items-start space-y-4 w-full " >
                <div>
                  <span className={labelClass}>Username</span>
                  <input
                    type="text"
                    className={inputClass}
                    value={p1Username}
                    onChange={(e) => setP1Username(e.target.value)}
                  />
                </div>
                <div>
                  <span className={labelClass}>Password</span>
                  <input
                    type="password"
                    className={inputClass}
                    value={p1Password}
                    onChange={(e) => setP1Password(e.target.value)}
                  />
                </div>
                {player1Mode === "register" && (
                  <div>
                    <span className={labelClass}>Confirm Password</span>
                    <input
                      type="password"
                      className={inputClass}
                      value={p1Confirm}
                      onChange={(e) => setP1Confirm(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <p className={errorClass}>{player1Error}</p>
            <button
              className={loginBtn}
              onClick={() => {
                if (p1Username === p2Username && player2Status === "logged_in") {
                  setPlayer1Error("Cannot use the same username as Player 2");
                  return;
                }
                player1Mode === "login" ? handleP1Login() : handleP1Register();
              }}
            >
              {player1Mode === "login" ? "Login" : "Register"}
            </button>
            <button
              className={toggleBtn}
              style={{ marginTop: "12px" }} 
              onClick={() => setPlayer1Mode(player1Mode === "login" ? "register" : "login")}
            >
              {player1Mode === "login" ? "Register instead" : "Back to login"}
            </button>

            </>
          ) : (
            <div className="w-full h-40 flex items-center justify-center bg-white text-black font-bold rounded">
              ✅ Logged in successfully
            </div>
          )}
        </div>

        
        <div className="w-64 p-6 bg-white rounded-lg flex flex-col items-start shadow-lg">
          {player2Status !== "logged_in" ? (
            <>
              <h2 className="text-xl mb-6 text-black">Player 2 (Train)</h2>
              <div className="flex flex-col items-start space-y-4 w-full">
                <div>
                  <span className={labelClass}>Username</span>
                  <input
                    type="text"
                    className={inputClass}
                    value={p2Username}
                    onChange={(e) => setP2Username(e.target.value)}
                  />
                </div>
                <div>
                  <span className={labelClass}>Password</span>
                  <input
                    type="password"
                    className={inputClass}
                    value={p2Password}
                    onChange={(e) => setP2Password(e.target.value)}
                  />
                </div>
                {player2Mode === "register" && (
                  <div>
                    <span className={labelClass}>Confirm Password</span>
                    <input
                      type="password"
                      className={inputClass}
                      value={p2Confirm}
                      onChange={(e) => setP2Confirm(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <p className={errorClass}>{player2Error}</p>
            <button
              className={loginBtn}
              onClick={() => {
                if (p2Username === p1Username && player1Status === "logged_in") {
                  setPlayer2Error("Cannot use the same username as Player 1");
                  return;
                }
                player2Mode === "login" ? handleP2Login() : handleP2Register();
              }}
            >
              {player2Mode === "login" ? "Login" : "Register"}
            </button>
            <button
              className={toggleBtn}
              style={{ marginTop: "12px" }} 
              onClick={() => setPlayer2Mode(player2Mode === "login" ? "register" : "login")}
            >
              {player2Mode === "login" ? "Register instead" : "Back to login"}
            </button>

            </>
          ) : (
            <div className="w-full h-40 flex items-center justify-center bg-white text-black font-bold rounded">
              ✅ Logged in successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
