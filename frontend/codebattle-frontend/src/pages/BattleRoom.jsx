
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import "./BattleRoom.css";

const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const secs = safeSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const getRemainingSeconds = (targetTime, now) => {
    if (!targetTime) return null;

    const target = new Date(targetTime).getTime();

    if (Number.isNaN(target)) return null;

    return Math.max(0, Math.ceil((target - now) / 1000));
};

const BattleRoom = () => {
    const { battleId } = useParams();
    const navigate = useNavigate();

    const [battle, setBattle] = useState(null);
    const [problem, setProblem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");
    const [problemError, setProblemError] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [now, setNow] = useState(Date.now());

    const fetchBattle = useCallback(async () => {
        try {
            const response = await api.get(`/battles/${battleId}`);
            const data = response.data?.battle ?? response.data;

            setBattle(data);
            setPageError("");
            return data;
        } catch (error) {
            setPageError(
                error.response?.data?.message ||
                    "Unable to load this battle room."
            );
            return null;
        } finally {
            setLoading(false);
        }
    }, [battleId]);

    const fetchCurrentProblem = useCallback(async () => {
        try {
            const response = await api.get(
                `/battles/${battleId}/current-problem`
            );

            const data = response.data?.problem ?? response.data;
            setProblem(data);
            setProblemError("");
        } catch (error) {
            setProblem(null);
            setProblemError(
                error.response?.data?.message ||
                    "The current problem is not available yet."
            );
        }
    }, [battleId]);

    // Poll battle details and refresh the timer.
    useEffect(() => {
        let cancelled = false;

        const loadBattle = async () => {
            try {
                const response = await api.get(`/battles/${battleId}`);

                if (cancelled) return;

                const data = response.data?.battle ?? response.data;
                setBattle(data);
                setPageError("");
                setLoading(false);
            } catch (error) {
                if (cancelled) return;

                setPageError(
                    error.response?.data?.message ||
                        "Unable to load this battle room."
                );
                setLoading(false);
            }
        };

        loadBattle();

        const pollId = setInterval(loadBattle, 3000);
        const clockId = setInterval(() => setNow(Date.now()), 1000);

        return () => {
            cancelled = true;
            clearInterval(pollId);
            clearInterval(clockId);
        };
    }, [battleId]);

    // Fetch the problem when the battle starts or its problem changes.
    useEffect(() => {
        if (battle?.status === "RUNNING") {
            fetchCurrentProblem();
        } else {
            setProblem(null);
            setProblemError("");
        }
    }, [
        battle?.status,
        battle?.currentProblemOrder,
        fetchCurrentProblem,
    ]);

    const handleStartBattle = async () => {
        if (actionLoading) return;

        setActionLoading(true);
        setPageError("");

        try {
            await api.post(`/battles/${battleId}/start`);
            await fetchBattle();
        } catch (error) {
            setPageError(
                error.response?.data?.message ||
                    "Failed to start the battle. Make sure both players have joined."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDiscardRoom = async () => {
        const confirmed = window.confirm(
            "Are you sure you want to discard this room? This action cannot be undone."
        );

        if (!confirmed || actionLoading) return;

        setActionLoading(true);
        setPageError("");

        try {
            await api.delete(`/battles/${battleId}`);
            navigate("/dashboard", { replace: true });
        } catch (error) {
            setPageError(
                error.response?.data?.message ||
                    "Failed to discard the room. Please try again."
            );
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="battle-room-page">
                <div className="battle-room-loading">
                    <div className="battle-room-spinner" />
                    <p>Loading battle room...</p>
                </div>
            </main>
        );
    }

    if (pageError && !battle) {
        return (
            <main className="battle-room-page">
                <section className="battle-room-error">
                    <h1>Unable to open battle</h1>
                    <p>{pageError}</p>
                    <Link to="/dashboard" className="battle-room-back-link">
                        Back to Dashboard
                    </Link>
                </section>
            </main>
        );
    }

    if (!battle) return null;

    const status = battle.status || "WAITING";

    const countdownSeconds =
        status === "COUNTDOWN"
            ? getRemainingSeconds(battle.countdownEndAt, now)
            : null;

    const remainingSeconds =
        status === "RUNNING"
            ? getRemainingSeconds(battle.endTime, now)
            : null;

    const problemUrl =
        problem?.url ||
        (problem?.contestId && problem?.index
            ? `https://codeforces.com/contest/${problem.contestId}/problem/${problem.index}`
            : null);

    return (
        <main className="battle-room-page">
            <header className="battle-room-nav">
                <Link to="/dashboard" className="battle-room-brand">
                    <span className="battle-room-brand-icon">CB</span>
                    <span>CodeBattle</span>
                </Link>

                <Link to="/dashboard" className="battle-room-dashboard-link">
                    Dashboard
                </Link>
            </header>

            <div className="battle-room-container">
                <div className="battle-room-heading">
                    <div>
                        <p className="battle-room-eyebrow">BATTLE ARENA</p>
                        <h1>Battle Room</h1>
                        <p className="battle-room-subtitle">
                            Get ready to compete. Good luck!
                        </p>
                    </div>

                    <span
                        className={`battle-status-badge status-${status.toLowerCase()}`}
                    >
                        <span className="battle-status-dot" />
                        {status}
                    </span>
                </div>

                {pageError && (
                    <div className="battle-room-notice error-notice">
                        {pageError}
                    </div>
                )}

                <section className="battle-room-card battle-overview">
                    <div className="battle-room-card-heading">
                        <div>
                            <h2>Battle Overview</h2>
                            <p>Your match details and current status</p>
                        </div>

                        {battle.roomCode && (
                            <div className="battle-room-code">
                                <span>ROOM CODE</span>
                                <strong>{battle.roomCode}</strong>
                            </div>
                        )}
                    </div>

                    <div className="battle-stats-grid">
                        <div className="battle-stat">
                            <span className="battle-stat-label">
                                Battle Rating
                            </span>
                            <strong>{battle.battleRating ?? "—"}</strong>
                        </div>

                        <div className="battle-stat">
                            <span className="battle-stat-label">Problems</span>
                            <strong>{battle.problemCount ?? "—"}</strong>
                        </div>

                        <div className="battle-stat">
                            <span className="battle-stat-label">Duration</span>
                            <strong>
                                {battle.maxDuration != null
                                    ? `${battle.maxDuration} min`
                                    : "—"}
                            </strong>
                        </div>

                        <div className="battle-stat">
                            <span className="battle-stat-label">
                                Current Problem
                            </span>
                            <strong>
                                {battle.currentProblemOrder ?? "—"}
                            </strong>
                        </div>
                    </div>

                    {Array.isArray(battle.topicPreferences) &&
                        battle.topicPreferences.length > 0 && (
                            <div className="battle-topics">
                                <span className="battle-stat-label">
                                    Preferred Topics
                                </span>

                                <div className="battle-topic-list">
                                    {battle.topicPreferences.map((topic) => (
                                        <span
                                            className="battle-topic"
                                            key={topic}
                                        >
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                </section>

                <section className="battle-room-card battle-progress-card">
                    {status === "WAITING" && (
                        <div className="battle-state-content">
                            <div className="battle-state-icon waiting-icon">
                                <span>⌛</span>
                            </div>

                            <h2>Waiting for the battle to start</h2>

                            <p>
                                The room is ready. Once the host starts the
                                battle, the countdown will begin.
                            </p>

                            {battle.isHost && (
                                <button
                                    type="button"
                                    className="start-battle-button"
                                    onClick={handleStartBattle}
                                    disabled={actionLoading}
                                >
                                    {actionLoading
                                        ? "Starting..."
                                        : "Start Battle"}
                                </button>
                            )}

                            {battle.isHost && (
                                <p className="battle-room-muted">
                                    Make sure your opponent has joined before
                                    starting.
                                </p>
                            )}
                        </div>
                    )}

                    {status === "COUNTDOWN" && (
                        <div className="battle-state-content">
                            <div className="battle-state-icon countdown-icon">
                                <span>⚡</span>
                            </div>

                            <h2>Get Ready!</h2>
                            <p>The battle is about to begin.</p>

                            <div className="battle-large-timer">
                                {formatTime(countdownSeconds ?? 0)}
                            </div>

                            <span className="battle-timer-caption">
                                TIME UNTIL START
                            </span>
                        </div>
                    )}

                    {status === "RUNNING" && (
                        <div className="battle-state-content">
                            <div className="battle-state-icon running-icon">
                                <span>⚔</span>
                            </div>

                            <h2>Battle in Progress</h2>
                            <p>Focus, solve problems, and watch your time.</p>

                            <div className="battle-large-timer">
                                {formatTime(remainingSeconds ?? 0)}
                            </div>

                            <span className="battle-timer-caption">
                                TIME REMAINING
                            </span>
                        </div>
                    )}

                    {status === "FINISHED" && (
                        <div className="battle-state-content">
                            <div className="battle-state-icon finished-icon">
                                <span>✓</span>
                            </div>

                            <h2>Battle Finished</h2>
                            <p>This battle has ended. View the final result.</p>

                            <Link
                                to={`/battle/${battleId}/result`}
                                className="battle-primary-button"
                            >
                                View Battle Result
                            </Link>
                        </div>
                    )}
                </section>

                {status === "RUNNING" && (
                    <section className="battle-room-card current-problem-card">
                        <div className="battle-room-card-heading">
                            <div>
                                <h2>Current Problem</h2>
                                <p>
                                    Solve this problem on Codeforces and submit
                                    your solution there.
                                </p>
                            </div>

                            {battle.currentProblemOrder != null && (
                                <span className="problem-number-badge">
                                    Problem {battle.currentProblemOrder}
                                </span>
                            )}
                        </div>

                        {problem ? (
                            <div className="current-problem-content">
                                <h3>
                                    {problem.name ||
                                        problem.title ||
                                        `Problem ${problem.index || ""}`}
                                </h3>

                                <div className="problem-metadata">
                                    {problem.index && (
                                        <span>Index: {problem.index}</span>
                                    )}

                                    {problem.rating != null && (
                                        <span>Rating: {problem.rating}</span>
                                    )}

                                    {problem.contestId != null && (
                                        <span>
                                            Contest: {problem.contestId}
                                        </span>
                                    )}
                                </div>

                                {Array.isArray(problem.tags) &&
                                    problem.tags.length > 0 && (
                                        <div className="battle-topic-list">
                                            {problem.tags.map((tag) => (
                                                <span
                                                    className="battle-topic"
                                                    key={tag}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                {problemUrl ? (
                                    <a
                                        href={problemUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="battle-primary-button"
                                    >
                                        Open Problem on Codeforces ↗
                                    </a>
                                ) : (
                                    <p className="battle-room-muted">
                                        No problem link is available.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="battle-problem-empty">
                                <div className="battle-room-spinner" />
                                <p>
                                    {problemError ||
                                        "Loading the current problem..."}
                                </p>
                            </div>
                        )}
                    </section>
                )}

                {status === "WAITING" && battle.isHost && (
                    <section className="battle-room-card discard-card">
                        <div>
                            <h2>Discard this room?</h2>
                            <p>
                                This permanently removes the waiting room.
                                You cannot discard a battle after it starts.
                            </p>
                        </div>

                        <button
                            type="button"
                            className="discard-room-button"
                            onClick={handleDiscardRoom}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Please wait..." : "Discard Room"}
                        </button>
                    </section>
                )}

                <div className="battle-room-footer">
                    <Link to="/dashboard" className="battle-room-back-link">
                        ← Back to Dashboard
                    </Link>

                    {status === "FINISHED" && (
                        <Link
                            to={`/battle/${battleId}/result`}
                            className="battle-room-result-link"
                        >
                            View Results →
                        </Link>
                    )}
                </div>
            </div>
        </main>
    );
};

export default BattleRoom;
