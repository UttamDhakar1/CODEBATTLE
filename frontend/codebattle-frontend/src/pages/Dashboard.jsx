
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Dashboard.css";

export default function Dashboard() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [activeBattle, setActiveBattle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [userRes, battleRes] = await Promise.all([
                    api.get("/auth/me"),
                    api.get("/battles/active")
                ]);

                setUser(userRes.data.user || userRes.data);
                setActiveBattle(battleRes.data.battle || null);
            } catch (err) {
                console.error("Dashboard error:", err);
                setError(
                    err.response?.data?.message ||
                    "Unable to load dashboard."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                Loading dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-loading">
                {error}
            </div>
        );
    }

    return (
        <div className="dashboard-container">

            {/* Navbar */}
            <nav className="dashboard-nav">
                <div
                    className="dashboard-logo"
                    onClick={() => navigate("/dashboard")}
                >
                    CodeBattle
                </div>

                <div className="dashboard-nav-links">
                    <button onClick={() => navigate("/battle-history")}>
                        Battle History
                    </button>

                    <button onClick={() => navigate("/profile")}>
                        My Profile
                    </button>

                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </nav>

            <main className="dashboard-main">

                {/* Welcome */}
                <section className="dashboard-welcome">
                    <div>
                        <p className="dashboard-subtitle">
                            YOUR COMPETITIVE PROGRAMMING ARENA
                        </p>

                        <h1>
                            Welcome back, {user?.username || "Player"}!
                        </h1>

                        <p>
                            Challenge others, solve problems, and improve
                            your CodeBattle rating.
                        </p>
                    </div>

                    <div className="rating-card">
                        <span>CodeBattle Rating</span>
                        <h2>
                            {user?.codebattleRating ?? 800}
                        </h2>
                    </div>
                </section>

                {/* Battle Actions */}
                <section className="dashboard-section">
                    <div className="section-heading">
                        <h2>Start Battling</h2>
                        <p>Choose how you want to compete.</p>
                    </div>

                    <div className="dashboard-actions">

                        <div className="action-card">
                            <div className="action-icon">⚔️</div>
                            <h3>Create Battle</h3>
                            <p>
                                Create a new battle and invite another
                                player using a room code.
                            </p>

                            <button
                                onClick={() => navigate("/create-battle")}
                            >
                                Create Battle
                            </button>
                        </div>

                        <div className="action-card">
                            <div className="action-icon">🚀</div>
                            <h3>Join Battle</h3>
                            <p>
                                Have a room code? Join an existing
                                battle and compete.
                            </p>

                            <button
                                onClick={() => navigate("/join-battle")}
                            >
                                Join Battle
                            </button>
                        </div>

                    </div>
                </section>

                {/* Active Battle */}
                <section className="dashboard-section">
                    <div className="section-heading">
                        <h2>Active Battle</h2>
                        <p>Your ongoing battle, if you have one.</p>
                    </div>

                    {activeBattle ? (
                        <div className="active-battle-card">
                            <div>
                                <span className="active-badge">
                                    {activeBattle.status}
                                </span>

                                <h3>
                                    Battle #{activeBattle.id}
                                </h3>

                                <p>
                                    Rating: {activeBattle.battleRating}
                                    {" · "}
                                    Problems: {activeBattle.problemCount}
                                </p>

                                <p>
                                    Room Code: {activeBattle.roomCode}
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    navigate(`/battle/${activeBattle.id}`)
                                }
                            >
                                Open Battle
                            </button>
                        </div>
                    ) : (
                        <div className="empty-battle-card">
                            <h3>No Active Battle</h3>
                            <p>
                                You are not participating in any active
                                battle right now.
                            </p>
                        </div>
                    )}
                </section>

                {/* Quick Links */}
                <section className="dashboard-section">
                    <div className="section-heading">
                        <h2>Your Account</h2>
                    </div>

                    <div className="account-links">
                        <button onClick={() => navigate("/profile")}>
                            <span>👤</span>
                            <div>
                                <strong>My Profile</strong>
                                <small>View your account details and rating</small>
                            </div>
                        </button>

                        <button onClick={() => navigate("/battle-history")}>
                            <span>📊</span>
                            <div>
                                <strong>Battle History</strong>
                                <small>Review your previous battles</small>
                            </div>
                        </button>

                        <button onClick={() => navigate("/verify-codeforces")}>
                            <span>✓</span>
                            <div>
                                <strong>Codeforces Verification</strong>
                                <small>Manage your Codeforces verification</small>
                            </div>
                        </button>
                    </div>
                </section>

            </main>
        </div>
    );
}
