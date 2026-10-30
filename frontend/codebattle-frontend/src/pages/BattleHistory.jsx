
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./BattleHistory.css";

export default function BattleHistory() {
    const navigate = useNavigate();

    const [battles, setBattles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get("/battles/history");
                setBattles(response.data.battles || []);
            } catch (err) {
                console.error("Battle history error:", err);
                setError(
                    err.response?.data?.message ||
                    "Failed to load battle history."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    const formatDate = (date) => {
        if (!date) return "N/A";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getResultClass = (result) => {
        if (result === "WIN") return "history-win";
        if (result === "LOSS") return "history-loss";
        if (result === "TIE") return "history-tie";
        return "history-pending";
    };

    return (
        <div className="history-page">

            <nav className="history-navbar">
                <h2 onClick={() => navigate("/dashboard")}>
                    CodeBattle
                </h2>

                <button onClick={() => navigate("/dashboard")}>
                    Back to Dashboard
                </button>
            </nav>

            <main className="history-container">

                <div className="history-header">
                    <div>
                        <p className="history-subtitle">
                            YOUR PERFORMANCE
                        </p>
                        <h1>Battle History</h1>
                        <p>Review your previous battles and results.</p>
                    </div>

                    <div className="history-count">
                        <span>Total Battles</span>
                        <strong>{battles.length}</strong>
                    </div>
                </div>

                {loading ? (
                    <div className="history-message">
                        Loading your battle history...
                    </div>
                ) : error ? (
                    <div className="history-message history-error">
                        {error}
                    </div>
                ) : battles.length === 0 ? (
                    <div className="history-empty">
                        <div className="history-empty-icon">⚔️</div>
                        <h2>No Battles Yet</h2>
                        <p>
                            Your completed battles will appear here.
                        </p>
                        <button onClick={() => navigate("/create-battle")}>
                            Create Your First Battle
                        </button>
                    </div>
                ) : (
                    <div className="history-table-wrapper">
                        <table className="history-table">
                            <thead>
                                <tr>
                                    <th>Battle</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Result</th>
                                    <th>Solved</th>
                                    <th>Penalty</th>
                                    <th>Rank</th>
                                    <th>Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {battles.map((battle) => (
                                    <tr key={battle.battleId}>
                                        <td>
                                            <strong>
                                                #{battle.battleId}
                                            </strong>
                                        </td>

                                        <td>
                                            {formatDate(battle.joinedAt)}
                                        </td>

                                        <td>
                                            <span className="history-status">
                                                {battle.status}
                                            </span>
                                        </td>

                                        <td>
                                            <span className={`history-result ${getResultClass(battle.result)}`}>
                                                {battle.result || "PENDING"}
                                            </span>
                                        </td>

                                        <td>
                                            {battle.acceptedCount ?? 0}
                                        </td>

                                        <td>
                                            {battle.totalPenalty ?? 0}
                                        </td>

                                        <td>
                                            {battle.rank ?? "—"}
                                        </td>

                                        <td>
                                            {battle.status === "FINISHED" ? (
                                                <button
                                                    className="history-view-btn"
                                                    onClick={() =>
                                                        navigate(
                                                            `/battle/${battle.battleId}/result`
                                                        )
                                                    }
                                                >
                                                    View Result
                                                </button>
                                            ) : (
                                                <span className="history-unavailable">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </main>
        </div>
    );
}
