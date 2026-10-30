
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./VerifyCodeforces.css";

export default function VerifyCodeforces() {
    const navigate = useNavigate();

    const [verificationCode, setVerificationCode] = useState("");
    const [codeforcesHandle, setCodeforcesHandle] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [timeLeft, setTimeLeft] = useState(120);

    // Two-minute countdown.
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((previous) => {
                if (previous <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return previous - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // Load verification details.
    useEffect(() => {
        let cancelled = false;

        const loadVerificationCode = async () => {
            if (!localStorage.getItem("token")) {
                navigate("/login", { replace: true });
                return;
            }

            try {
                const response = await api.get("/auth/verification-code");

                if (!cancelled) {
                    setVerificationCode(response.data.verificationCode);
                    setCodeforcesHandle(response.data.codeforcesHandle);
                }
            } catch (err) {
                if (!cancelled) {
                    if (err.response?.status === 401) {
                        localStorage.removeItem("token");
                        navigate("/login", { replace: true });
                    } else {
                        setError(
                            err.response?.data?.message ||
                            "Could not load your verification code."
                        );
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadVerificationCode();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const handleVerify = async () => {
        setError("");
        setMessage("");
        setSubmitting(true);

        try {
            const response = await api.post("/auth/verify-codeforces", {
                verificationCode
            });

            setMessage(
                response.data.message || "Verification successful!"
            );

            navigate("/", { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Verification failed. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const copyCode = async () => {
        try {
            await navigator.clipboard.writeText(verificationCode);
            setMessage("Verification code copied.");
            setError("");
        } catch {
            setError("Could not copy the code. Please copy it manually.");
        }
    };

    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");

    if (loading) {
        return (
            <div className="verify-page">
                Loading verification details...
            </div>
        );
    }

    return (
        <div className="verify-page">
            <div className="verify-card">
                <h1>Verify Codeforces Account</h1>

                <p>
                    Verify ownership of your Codeforces account to continue
                    using CodeBattle.
                </p>

                <p>
                    <strong>Codeforces handle:</strong> {codeforcesHandle}
                </p>

                <p>
                    Open Codeforces settings and set the following code as
                    your profile's <strong>First name</strong>.
                </p>

                <div className="verification-code">
                    <code>{verificationCode}</code>

                    <button
                        type="button"
                        onClick={copyCode}
                        disabled={!verificationCode}
                    >
                        Copy code
                    </button>
                </div>

                <a
                    className="verify-external-link"
                    href="https://codeforces.com/settings/social"
                    target="_blank"
                    rel="noreferrer"
                >
                    Open Codeforces Settings
                </a>

                <div className="verification-timer">
                    <p>
                        <strong>Important:</strong> It may take up to 2 minutes for your
                        name change to be reflected by the Codeforces API. Please wait
                        before clicking Verify Codeforces.
                    </p>
                </div>

                {error && <p className="verify-error">{error}</p>}
                {message && <p className="verify-message">{message}</p>}

                <button
                    type="button"
                    onClick={handleVerify}
                    disabled={submitting || !verificationCode}
                >
                    {submitting ? "Verifying..." : "Verify Codeforces"}
                </button>
            </div>
        </div>
    );
}
