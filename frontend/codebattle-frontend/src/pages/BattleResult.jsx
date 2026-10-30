
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./BattleResult.css";

function BattleResult() {
    const { battleId } = useParams();
    const navigate = useNavigate();

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchBattleResult = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    `/battles/${battleId}/result`
                );

                if (!cancelled) {
                    setResult(response.data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        "Unable to load battle results."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchBattleResult();

        return () => {
            cancelled = true;
        };
    }, [battleId]);

    const formatDateTime = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatNumber = (value) => {
        return Number(value || 0).toLocaleString("en-IN");
    };

    // Loading
    if (loading) {
        return (
            <div className="result-page">
                <div className="result-message">
                    <div className="result-spinner"></div>
                    <h2>Loading Battle Results...</h2>
                    <p>Please wait while we calculate your final standings.</p>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="result-page">
                <div className="result-message result-error">
                    <h2>Unable to Load Results</h2>
                    <p>{error}</p>

                    <button
                        className="result-button primary"
                        onClick={() => window.location.reload()}
                    >
                        Try Again
                    </button>

                    <button
                        className="result-button secondary"
                        onClick={() => navigate("/dashboard")}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const participants = result.participants || [];
    const problems = result.problems || [];

    // ==========================================
    // CORRECT WINNER AND TIE DETECTION
    // ==========================================

    const winner = participants.find(
        (player) => player.result === "WIN"
    );

    const loser = participants.find(
        (player) => player.result === "LOSS"
    );

    const isTie =
        participants.length >= 2 &&
        participants.every(
            (player) => player.result === "TIE"
        );

    const winnerName = winner?.username || "Winner";

    const isWinner = (player) =>
        player.result === "WIN";

    return (
        <div className="result-page">

            {/* Header */}
            <header className="result-header">
                <button
                    className="result-back"
                    onClick={() => navigate("/dashboard")}
                >
                    ← Dashboard
                </button>

                <span className="result-brand">
                    CodeBattle
                </span>
            </header>

            <main className="result-container">

                {/* Battle Outcome */}
                <section className="result-hero">

                    <div className="result-trophy">
                        {isTie ? "🤝" : "🏆"}
                    </div>

                    <p className="result-eyebrow">
                        BATTLE COMPLETED
                    </p>

                    <h1>
                        {isTie
                            ? "IT'S A TIE!"
                            : winner
                                ? `${winnerName} WON!`
                                : "BATTLE RESULTS"}
                    </h1>

                    <p className="result-subtitle">
                        {isTie
                            ? "Both players finished with identical performance."
                            : winner
                                ? `Congratulations to ${winnerName} for winning this battle!`
                                : "Final battle standings are shown below."}
                    </p>

                    <div className="result-meta">
                        <span>
                            Battle ID: {result.battleId}
                        </span>

                        <span>
                            Rating: {result.battleRating}
                        </span>

                        <span>
                            Problems: {result.problemCount}
                        </span>
                    </div>

                </section>

                {/* Final Standings */}
                <section className="result-section">

                    <div className="result-section-heading">
                        <div>
                            <h2>Final Standings</h2>
                            <p>
                                Performance comparison between both players.
                            </p>
                        </div>
                    </div>

                    <div className="result-player-grid">

                        {participants.map((player) => {

                            const playerIsWinner = isWinner(player);

                            return (
                                <article
                                    className={`result-player-card ${
                                        playerIsWinner ? "winner-card" : ""
                                    }`}
                                    key={player.userId}
                                >

                                    <div className="result-player-top">

                                        <div className="result-avatar">
                                            {(player.username || "P")
                                                .charAt(0)
                                                .toUpperCase()}
                                        </div>

                                        <div className="result-player-info">

                                            <span className="result-rank">
                                                RANK #{player.rank}
                                            </span>

                                            <h3>
                                                {player.username}
                                            </h3>

                                            {player.codeforcesHandle && (
                                                <span className="result-handle">
                                                    @{player.codeforcesHandle}
                                                </span>
                                            )}

                                            {playerIsWinner && (
                                                <span className="winner-label">
                                                    🏆 Winner
                                                </span>
                                            )}

                                            {player.result === "LOSS" && (
                                                <span className="winner-label">
                                                    Defeated
                                                </span>
                                            )}

                                            {player.result === "TIE" && (
                                                <span className="winner-label">
                                                    TIE
                                                </span>
                                            )}

                                        </div>

                                    </div>

                                    <div className="result-stat-grid">

                                        <div className="result-stat">
                                            <span>Problems Solved</span>
                                            <strong>
                                                {player.acceptedCount}
                                            </strong>
                                        </div>

                                        <div className="result-stat">
                                            <span>Total Penalty</span>
                                            <strong>
                                                {formatNumber(player.totalPenalty)}
                                            </strong>
                                        </div>

                                        <div className="result-stat">
                                            <span>Previous Rating</span>
                                            <strong>
                                                {player.oldRating ?? "—"}
                                            </strong>
                                        </div>

                                        <div className="result-stat">
                                            <span>Rating Change</span>
                                            <strong
                                                className={
                                                    player.ratingChange > 0
                                                        ? "rating-positive"
                                                        : player.ratingChange < 0
                                                            ? "rating-negative"
                                                            : ""
                                                }
                                            >
                                                {player.ratingChange !== null &&
                                                player.ratingChange !== undefined
                                                    ? `${player.ratingChange > 0 ? "+" : ""}${player.ratingChange}`
                                                    : "—"}
                                            </strong>
                                        </div>

                                        <div className="result-stat">
                                            <span>New Rating</span>
                                            <strong>
                                                {player.newRating ?? "—"}
                                            </strong>
                                        </div>

                                        <div className="result-stat">
                                            <span>Result</span>
                                            <strong>
                                                {player.result || "—"}
                                            </strong>
                                        </div>

                                    </div>

                                </article>
                            );
                        })}

                    </div>

                </section>

                {/* Problem Breakdown */}
                <section className="result-section">

                    <div className="result-section-heading">
                        <div>
                            <h2>Problem Breakdown</h2>
                            <p>
                                Check each player's performance on every problem.
                            </p>
                        </div>
                    </div>

                    {problems.length > 0 ? (

                        <div className="result-table-wrapper">

                            <table className="result-table">

                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Problem</th>
                                        <th>Rating</th>

                                        {participants.map((player) => (
                                            <th key={player.userId}>
                                                {player.username}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody>

                                    {problems.map((problem) => (

                                        <tr key={problem.id}>

                                            <td>
                                                {problem.problemOrder}
                                            </td>

                                            <td>
                                                <strong>
                                                    {problem.name}
                                                </strong>
                                            </td>

                                            <td>
                                                {problem.rating}
                                            </td>

                                            {participants.map((player) => {

                                                const playerProblem =
                                                    player.problemResults?.find(
                                                        (item) =>
                                                            Number(item.problemId) ===
                                                            Number(problem.problemId)
                                                    );

                                                const accepted =
                                                    playerProblem?.accepted;

                                                return (
                                                    <td key={player.userId}>

                                                        <div className="problem-status">

                                                            <span
                                                                className={
                                                                    accepted
                                                                        ? "status-accepted"
                                                                        : playerProblem
                                                                            ? "status-failed"
                                                                            : "status-pending"
                                                                }
                                                            >
                                                                {accepted
                                                                    ? "✓ Accepted"
                                                                    : playerProblem?.status ||
                                                                        "Not attempted"}
                                                            </span>

                                                            {accepted && (
                                                                <span className="problem-time">
                                                                    {formatDateTime(
                                                                        playerProblem.solveTime
                                                                    )}
                                                                </span>
                                                            )}

                                                        </div>

                                                    </td>
                                                );
                                            })}

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        <p className="result-empty">
                            No problem information is available.
                        </p>

                    )}

                </section>

                {/* Navigation */}
                <section className="result-actions">

                    <button
                        className="result-button primary"
                        onClick={() => navigate("/dashboard")}
                    >
                        Back to Dashboard
                    </button>

                    <button
                        className="result-button secondary"
                        onClick={() => navigate("/battle-history")}
                    >
                        View Battle History
                    </button>

                </section>

            </main>
        </div>
    );
}

export default BattleResult;
