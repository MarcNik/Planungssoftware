"use client";

import { useState } from "react";

export default function Page() {
    const [username, setUsername] = useState(""); // State für den Benutzernamen
    const [password, setPassword] = useState(""); // State für das Passwort
    const [email, setEmail] = useState(""); // State für die E-Mail-Adresse (nur für Registrierung)
    const [error, setError] = useState(""); // State für Fehlermeldungen
    const [isRegistering, setIsRegistering] = useState(false); // State um zwischen Login und Registrierung zu wechseln
    const [is2FAEnabled, setIs2FAEnabled] = useState(false); // State für den 2FA-Schalter

    // Funktion zur Handhabung des Login-Formulars
    const handleLogin = (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        setError("");
        console.log("Logging in with:", { username, password });
        // Redirect nach erfolgreichem Login
        window.location.href = "/dashboard";
    };

    // Funktion zur Handhabung des Registrierungsformulars
    const handleRegister = (e) => {
        e.preventDefault();
        if (!username || !password || !email) {
            setError("Please fill in all fields.");
            return;
        }

        setError("");
        console.log("Registering with:", { username, password, email, is2FAEnabled });
        // Redirect nach erfolgreicher Registrierung
        window.location.href = "/dashboard";
    };

    return (
        <div>
            <h1>{isRegistering ? "Register" : "Login"}</h1>
            <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                {/* Benutzernamen-Eingabe */}
                <label>
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                <br />

                {/* Passwort-Eingabe */}
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </label>
                <br />

                {/* E-Mail-Adresse (nur bei Registrierung) */}
                {isRegistering && (
                    <>
                        <label>
                            Email:
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>
                        <br />
                    </>
                )}

                {/* 2FA-Schalter (nur bei Registrierung) */}
                {isRegistering && (
                    <>
                        <label>
                            Enable Two-Factor Authentication:
                            <input
                                type="checkbox"
                                checked={is2FAEnabled}
                                onChange={() => setIs2FAEnabled(!is2FAEnabled)}
                            />
                        </label>
                        <br />
                    </>
                )}

                {/* Fehlermeldung */}
                {error && <p style={{ color: "red" }}>{error}</p>}

                {/* Absenden-Button */}
                <button type="submit">{isRegistering ? "Register" : "Login"}</button>
            </form>

            {/* Umschalten zwischen Login und Registrierung */}
            <p>
                {isRegistering ? (
                    <span>
                        Already have an account?{" "}
                        <button onClick={() => setIsRegistering(false)}>Login</button>
                    </span>
                ) : (
                    <span>
                        Don't have an account?{" "}
                        <button onClick={() => setIsRegistering(true)}>Register</button>
                    </span>
                )}
            </p>
        </div>
    );
}
