"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import "./styles/loginStyle.css";

export default function Page() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);
    const [is2FAPending, setIs2FAPending] = useState(false);
    const [tempToken, setTempToken] = useState("");
    const [twoFACode, set2FACode] = useState("");

    // Passwort-Hashing mit SHA-256
    async function sha256(ascii) {
        const msgBuffer = new TextEncoder().encode(ascii);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    async function hashPassword(password) {
        return await sha256(password);
    }

    function validatePassword(password) {
        const minLength = 10;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (password.length < minLength) return "Password must be at least 10 characters long.";
        if (!hasUpperCase) return "Password must contain at least one uppercase letter.";
        if (!hasLowerCase) return "Password must contain at least one lowercase letter.";
        if (!hasNumber) return "Password must contain at least one number.";
        if (!hasSpecialChar) return "Password must contain at least one special character.";
        
        return "";
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        const hashedPassword = await hashPassword(password);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password: hashedPassword }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Login failed.");
                return;
            }

            if (result.is2FAEnabled) {
                setIs2FAPending(true);
                setTempToken(result.tempToken);
            } else {
                localStorage.setItem("username", username); // Benutzername speichern
                router.push("/dashboard");
            }
        } catch (error) {
            setError("An error occurred during login.");
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const passwordError = validatePassword(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        if (!username || !password || !email) {
            setError("Please fill in all fields.");
            return;
        }

        const hashedPassword = await hashPassword(password);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password: hashedPassword, email, is2FAEnabled }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Registration failed.");
                return;
            }

            localStorage.setItem("username", username); // Benutzername speichern
            router.push("/dashboard");
        } catch (error) {
            setError("An error occurred during registration.");
        }
    };

    const handle2FAVerify = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const response = await fetch("/api/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tempToken, twoFACode }),
            });

            const result = await response.json();

            if (response.ok) {
                localStorage.setItem("username", username);
                setSuccess("Login successful! Redirecting...");
                setTimeout(() => router.push("/dashboard"), 2000);
            } else {
                setError(result.error || "2FA verification failed.");
            }
        } catch (err) {
            setError("2FA verification failed.");
        }
    };

    return (
        <div className="BackgroundLogin">
            {!is2FAPending ? (
                <>
                    <h1 className="TitleFont">{isRegistering ? "Register" : "Login"}</h1>
                    <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                        <label className="InputFontStacked">
                            Username:
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </label>
                        <br />

                        <label className="InputFontStacked">
                            Password:
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        </label>
                        <br />

                        {isRegistering && (
                            <>
                                <label className="InputFontStacked">
                                    Email:
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                                </label>
                                <br />

                                <label className="InputFontSideBySide">
                                    Enable Two-Factor Authentication
                                    <input type="checkbox" checked={is2FAEnabled} onChange={() => setIs2FAEnabled(!is2FAEnabled)} />
                                </label>
                                <br />
                            </>
                        )}

                        {error && <p className="ErrorFont" style={{ color: "red" }}>{error}</p>}
                        {success && <p className="SuccessFont" style={{ color: "green" }}>{success}</p>}

                        <button className="ButtonDesign" type="submit">{isRegistering ? "Register" : "Login"}</button>
                    </form>

                    <p>
                        {isRegistering ? (
                            <span className="InputFontStacked">
                                Already have an account?{" "}
                                <button className="ButtonDesign" onClick={() => setIsRegistering(false)}>Login</button>
                            </span>
                        ) : (
                            <span className="InputFontStacked">
                                Don't have an account?{" "}
                                <button className="ButtonDesign" onClick={() => setIsRegistering(true)}>Register</button>
                            </span>
                        )}
                    </p>
                </>
            ) : (
                <div className="twoFAContainer">
                    <form onSubmit={handle2FAVerify}>
                        <p>A code has been sent to you via email</p>
                        <label className="InputFontStacked">
                            Code:
                            <input type="text" value={twoFACode} onChange={(e) => set2FACode(e.target.value)} />
                        </label>
                        <button type="submit">Verify</button>
                    </form>
                    {error && <p className="ErrorFont" style={{ color: "red" }}>{error}</p>}
                    {success && <p className="SuccessFont" style={{ color: "green" }}>{success}</p>}
                </div>
            )}
        </div>
    );
}
