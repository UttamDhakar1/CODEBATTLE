import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./CreateBattle.css";

const CreateBattle = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        battleRating: 800,
        problemCount: 3,
        maxDuration: 60,
        topicPreferences: []
    });

    const [ratingLoading, setRatingLoading] = useState(true);
    const [codeforcesRating, setCodeforcesRating] = useState(0);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [createdBattle, setCreatedBattle] = useState(null);

    // Fetch the user's Codeforces rating.
    useEffect(() => {
        const fetchUserRating = async () => {
            try {
                const response = await api.get("/auth/me");

                const user = response.data.user || response.data;
                const rating = Number(user.codeforcesRating) || 0;

                setCodeforcesRating(rating);

                setFormData((prev) => ({
                    ...prev,
                    battleRating: Math.max(800, rating)
                }));
            } catch (err) {
                console.error("Failed to fetch Codeforces rating:", err);
                setFormData((prev) => ({
                    ...prev,
                    battleRating: 800
                }));
            } finally {
                setRatingLoading(false);
            }
        };

        fetchUserRating();
    }, []);

    const ratingOptions = Array.from(
        new Set([
            ...Array.from({ length: 28 }, (_, i) => 800 + i * 100),
            formData.battleRating
        ])
    ).sort((a, b) => a - b);

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: Number(value)
        }));
    };

    const handleTopicChange = (e) => {
        const topic = e.target.value;

        setFormData((prev) => ({
            ...prev,
            topicPreferences: topic ? [topic] : []
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError("");

            const response = await api.post("/battles", {
                battleRating: Number(formData.battleRating),
                problemCount: Number(formData.problemCount),
                maxDuration: Number(formData.maxDuration),
                topicPreferences:
                    formData.topicPreferences.length > 0
                        ? formData.topicPreferences
                        : null
            });

            setCreatedBattle(response.data.battle);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Failed to create battle. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const copyRoomCode = async () => {
        try {
            await navigator.clipboard.writeText(
                createdBattle.roomCode
            );
        } catch {
            setError("Unable to copy the room code. Please copy it manually.");
        }
    };

    return (
        <div className="create-battle-page">
            <nav className="create-nav">
                <Link to="/" className="create-brand">
                    <span>&lt;/&gt;</span> CodeBattle
                </Link>

                <button
                    type="button"
                    onClick={() => navigate("/")}
                >
                    Back to Dashboard
                </button>
            </nav>

            <main className="create-container">
                {!createdBattle ? (
                    <>
                        <p className="create-eyebrow">
                            SET UP YOUR CHALLENGE
                        </p>

                        <h1>Create a Battle</h1>

                        <p className="create-subtitle">
                            Configure your contest and challenge your opponent.
                        </p>

                        {error && (
                            <div className="create-error">
                                {error}
                            </div>
                        )}

                        <form
                            className="create-form"
                            onSubmit={handleSubmit}
                        >
                            <label htmlFor="battleRating">
                                Battle rating
                            </label>

                            <select
                                id="battleRating"
                                name="battleRating"
                                value={formData.battleRating}
                                onChange={handleChange}
                                required
                                disabled={ratingLoading}
                            >
                                {ratingOptions.map((rating) => (
                                    <option key={rating} value={rating}>
                                        {rating}
                                        {rating === Math.max(800, codeforcesRating)
                                            ? " (Default)"
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            <p className="create-hint">
                                {ratingLoading
                                    ? "Loading your Codeforces rating..."
                                    : `Your Codeforces rating: ${codeforcesRating || "Unrated"}. You can change the battle rating manually.`}
                            </p>

                            <label htmlFor="maxDuration">
                                Battle duration
                            </label>

                            <select
                                id="maxDuration"
                                name="maxDuration"
                                value={formData.maxDuration}
                                onChange={handleChange}
                                required
                            >
                                {[30, 60, 90, 120, 150, 180].map(
                                    (duration) => (
                                        <option
                                            key={duration}
                                            value={duration}
                                        >
                                            {duration} minutes
                                        </option>
                                    )
                                )}
                            </select>

                            <label htmlFor="problemCount">
                                Number of problems
                            </label>

                            <select
                                id="problemCount"
                                name="problemCount"
                                value={formData.problemCount}
                                onChange={handleChange}
                                required
                            >
                                {[3, 4, 5, 6].map((count) => (
                                    <option key={count} value={count}>
                                        {count} problems
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="topicPreferences">
                                Preferred topic (optional)
                            </label>

                            <select
                                id="topicPreferences"
                                name="topicPreferences"
                                value={formData.topicPreferences[0] || ""}
                                onChange={handleTopicChange}
                            >
                                <option value="">Any topic</option>
                                <option value="dp">Dynamic Programming</option>
                                <option value="graphs">Graphs</option>
                                <option value="trees">Trees</option>
                                <option value="greedy">Greedy</option>
                                <option value="math">Math</option>
                                <option value="binary_search">Binary Search</option>
                            </select>

                            <button
                                type="submit"
                                className="create-submit"
                                disabled={loading || ratingLoading}
                            >
                                {loading
                                    ? "Creating battle..."
                                    : ratingLoading
                                        ? "Loading profile..."
                                        : "Create Battle"}
                            </button>
                        </form>
                    </>
                ) : (
                    <section className="battle-created">
                        <div className="success-icon">✓</div>

                        <p className="create-eyebrow">
                            BATTLE CREATED
                        </p>

                        <h1>You're ready to compete!</h1>

                        <p className="create-subtitle">
                            Share this room code with your opponent so
                            they can join your battle.
                        </p>

                        <div className="room-code-box">
                            <span>ROOM CODE</span>
                            <strong>{createdBattle.roomCode}</strong>

                            <button
                                type="button"
                                onClick={copyRoomCode}
                            >
                                Copy code
                            </button>
                        </div>

                        <p className="create-hint">
                            Rating: {createdBattle.battleRating} ·{" "}
                            {createdBattle.problemCount} problems ·{" "}
                            {createdBattle.maxDuration} minutes
                        </p>

                        {error && (
                            <div className="create-error">
                                {error}
                            </div>
                        )}

                        <button
                            className="create-submit"
                            onClick={() =>
                                navigate(`/battle/${createdBattle.id}`)
                            }
                        >
                            Enter Battle Room
                        </button>

                        <button
                            className="create-secondary"
                            onClick={() => navigate("/")}
                        >
                            Back to Dashboard
                        </button>
                    </section>
                )}
            </main>
        </div>
    );
};

export default CreateBattle;