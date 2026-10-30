
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import "./Profile.css";

const Profile = () => {
    const [user, setUser] = useState(null);
    const [battles, setBattles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError("");

                const [userResponse, historyResponse] = await Promise.all([
                    api.get("/auth/me"),
                    api.get("/battles/history")
                ]);

                setUser(userResponse.data.user || userResponse.data);

                setBattles(
                    historyResponse.data.battles || []
                );
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load your profile."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const wins = battles.filter(
        battle => battle.result === "WIN"
    ).length;

    const losses = battles.filter(
        battle => battle.result === "LOSS"
    ).length;

    const ties = battles.filter(
        battle => battle.result === "TIE"
    ).length;

    const completedBattles = wins + losses + ties;

    const winRate = completedBattles
        ? ((wins / completedBattles) * 100).toFixed(1)
        : "0.0";

    const formatDate = (date) => {
        if (!date) return "—";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    if (loading) {
        return (
            <main className="profile-page">
                <div className="profile-loading">
                    <div className="profile-spinner" />
                    <p>Loading your profile...</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="profile-page">
                <div className="profile-error">
                    <h2>Unable to load profile</h2>
                    <p>{error}</p>
                    <Link to="/dashboard">Back to Dashboard</Link>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-page">
            <header className="profile-navbar">
                <Link to="/dashboard" className="profile-brand">
                    <span className="profile-brand-icon">CB</span>
                    CodeBattle
                </Link>

                <Link
                    to="/dashboard"
                    className="profile-dashboard-link"
                >
                    ← Back to Dashboard
                </Link>
            </header>

            <div className="profile-container">
                <section className="profile-heading">
                    <div>
                        <p className="profile-eyebrow">
                            YOUR ACCOUNT
                        </p>
                        <h1>My Profile</h1>
                        <p>
                            Your CodeBattle identity and performance.
                        </p>
                    </div>
                </section>

                <section className="profile-main-card">
                    <div className="profile-avatar">
                        {(user?.username || "U")
                            .charAt(0)
                            .toUpperCase()}
                    </div>

                    <div className="profile-main-info">
                        <h2>{user?.username || "User"}</h2>
                        <p>{user?.email || "Email not available"}</p>

                        <span className="profile-member-badge">
                            CodeBattle Member
                        </span>
                    </div>

                    <div className="profile-rating">
                        <span>CODEBATTLE RATING</span>
                        <strong>
                            {user?.codebattleRating ?? 800}
                        </strong>
                    </div>
                </section>

                <section className="profile-section">
                    <div className="profile-section-heading">
                        <h2>Account Information</h2>
                        <p>Your personal and connected account details</p>
                    </div>

                    <div className="profile-info-grid">
                        <div className="profile-info-card">
                            <span>Username</span>
                            <strong>{user?.username || "—"}</strong>
                        </div>

                        <div className="profile-info-card">
                            <span>Email Address</span>
                            <strong>{user?.email || "—"}</strong>
                        </div>

                        <div className="profile-info-card">
                            <span>Codeforces Handle</span>
                            <strong>
                                {user?.codeforcesHandle || "Not connected"}
                            </strong>
                        </div>

                        <div className="profile-info-card">
                            <span>Codeforces Verification</span>
                            <strong
                                className={
                                    user?.codeforcesVerified
                                        ? "profile-verified"
                                        : "profile-unverified"
                                }
                            >
                                {user?.codeforcesVerified
                                    ? "Verified"
                                    : "Not verified"}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="profile-section">
                    <div className="profile-section-heading">
                        <h2>Battle Statistics</h2>
                        <p>Your overall competitive performance</p>
                    </div>

                    <div className="profile-stats-grid">
                        <div className="profile-stat-card">
                            <span>Total Battles</span>
                            <strong>{battles.length}</strong>
                        </div>

                        <div className="profile-stat-card">
                            <span>Wins</span>
                            <strong className="stat-win">{wins}</strong>
                        </div>

                        <div className="profile-stat-card">
                            <span>Losses</span>
                            <strong className="stat-loss">{losses}</strong>
                        </div>

                        <div className="profile-stat-card">
                            <span>Ties</span>
                            <strong>{ties}</strong>
                        </div>

                        <div className="profile-stat-card">
                            <span>Win Rate</span>
                            <strong>{winRate}%</strong>
                        </div>
                    </div>
                </section>

                <section className="profile-section">
                    <div className="profile-section-heading profile-history-heading">
                        <div>
                            <h2>Recent Battles</h2>
                            <p>Your latest battle activity</p>
                        </div>

                        <Link to="/battle-history">
                            View All →
                        </Link>
                    </div>

                    {battles.length === 0 ? (
                        <div className="profile-empty">
                            <span>⚔️</span>
                            <h3>No battles yet</h3>
                            <p>
                                Start your first battle to build your
                                competitive history.
                            </p>
                            <Link to="/create-battle">
                                Create a Battle
                            </Link>
                        </div>
                    ) : (
                        <div className="profile-battle-list">
                            {battles.slice(0, 5).map((battle) => (
                                <div
                                    className="profile-battle-row"
                                    key={battle.battleId}
                                >
                                    <div className="profile-battle-icon">
                                        ⚔
                                    </div>

                                    <div className="profile-battle-details">
                                        <strong>
                                            Battle #{battle.battleId}
                                        </strong>
                                        <span>
                                            {formatDate(battle.joinedAt)}
                                        </span>
                                    </div>

                                    <div className="profile-battle-performance">
                                        <strong>
                                            {battle.acceptedCount ?? 0} solved
                                        </strong>
                                        <span>
                                            Penalty: {battle.totalPenalty ?? 0}
                                        </span>
                                    </div>

                                    <span
                                        className={`profile-result ${
                                            (battle.result || "pending").toLowerCase()
                                        }`}
                                    >
                                        {battle.result || battle.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
};

export default Profile;
