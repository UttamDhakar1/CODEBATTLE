
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import "./Register.css";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        codeforcesHandle: ""
    });

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await api.post("/auth/register", formData);

            const { token } = response.data;

            if (!token) {
                throw new Error("Server did not return an authentication token.");
            }

            localStorage.setItem("token", token);

            navigate("/verify-codeforces", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                err.message ||
                "Registration failed. Please try again."
            );
        }
    };
    
    return (
        <div className="register-page">
            <div className="register-card">
                <Link to="/" className="register-brand">
                    <span className="register-brand-icon">&lt;/&gt;</span>
                    CodeBattle
                </Link>

                <h1>Create account</h1>
                <p className="register-subtitle">
                    Join the battle. Prove your skills.
                </p>

                {error && (
                    <div className="register-error">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        name="username"
                        placeholder="Choose a username"
                        value={formData.username}
                        onChange={handleChange}
                        autoComplete="username"
                        required
                    />

                    <label htmlFor="reg-email">Email address</label>
                    <input
                        id="reg-email"
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        required
                    />

                    <label htmlFor="reg-password">Password</label>
                    <input
                        id="reg-password"
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        required
                    />

                    <label htmlFor="codeforcesHandle">
                        Codeforces handle
                    </label>
                    <input
                        id="codeforcesHandle"
                        name="codeforcesHandle"
                        placeholder="Your Codeforces username"
                        value={formData.codeforcesHandle}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading
                            ? "Creating account..."
                            : "Create account"}
                    </button>
                </form>

                <p className="register-login-prompt">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
