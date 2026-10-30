
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./JoinBattle.css";

const JoinBattle = () => {
    const navigate = useNavigate();

    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleJoinBattle = async (e) => {
        e.preventDefault();

        const code = roomCode.trim().toUpperCase();

        if (!code) {
            setError("Please enter a room code.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await api.post("/battles/join", {
                roomCode: code,
            });

            const battleId =
                response.data.battle?.id ??
                response.data.battleId ??
                response.data.id;

            if (!battleId) {
                setError(
                    "You joined, but the server did not return a battle ID."
                );
                return;
            }

            navigate(`/battle/${battleId}`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to join the battle. Please check the room code."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="join-battle-page">
            <nav className="join-battle-nav">
                <Link to="/dashboard" className="join-battle-brand">
                    <span className="join-battle-logo">&lt;/&gt;</span>
                    CodeBattle
                </Link>

                <button
                    type="button"
                    className="join-back-button"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>
            </nav>

            <main className="join-battle-main">
                <section className="join-battle-card">
                    <div className="join-battle-icon">⚔</div>

                    <p className="join-battle-eyebrow">
                        CHALLENGE A FRIEND
                    </p>

                    <h1>Join a Battle</h1>

                    <p className="join-battle-description">
                        Enter the room code shared by your opponent
                        to join their coding battle.
                    </p>

                    <form onSubmit={handleJoinBattle}>
                        <label htmlFor="roomCode">
                            Room Code
                        </label>

                        <input
                            id="roomCode"
                            type="text"
                            value={roomCode}
                            onChange={(e) => {
                                setRoomCode(e.target.value.toUpperCase());
                                setError("");
                            }}
                            placeholder="Enter room code"
                            autoComplete="off"
                            autoFocus
                            disabled={loading}
                        />

                        {error && (
                            <p className="join-battle-error" role="alert">
                                {error}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="join-submit-button"
                            disabled={loading || !roomCode.trim()}
                        >
                            {loading ? "Joining Battle..." : "Join Battle →"}
                        </button>
                    </form>

                    <p className="join-battle-hint">
                        Make sure you enter the correct room code.
                    </p>
                </section>
            </main>
        </div>
    );
};

export default JoinBattle;
