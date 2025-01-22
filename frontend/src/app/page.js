"use client";

import { useState } from "react";
import './styles/loginStyle.css';

export default function Page() {
    const [username, setUsername] = useState(""); // State für den Benutzernamen
    const [password, setPassword] = useState(""); // State für das Passwort
    const [email, setEmail] = useState(""); // State für die E-Mail-Adresse (nur für Registrierung)
    const [error, setError] = useState(""); // State für Fehlermeldungen
    const [isRegistering, setIsRegistering] = useState(false); // State um zwischen Login und Registrierung zu wechseln
    const [is2FAEnabled, setIs2FAEnabled] = useState(false); // State für den 2FA-Schalter

    async function sha256(ascii) {
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(ascii);                    

        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);

        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer));

        // convert bytes to hex string                  
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    async function hashPassword(password) {
        return await sha256(password);
    }

    // Funktion zur Handhabung des Login-Formulars
    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username || !password) {
            setError("Please enter both username and password.");
            return;
        }

        var hashedPassword = await hashPassword(password);

        setError("");
        console.log("Logging in with:", { username, password });
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password: hashedPassword }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Login failed.');
                return;
            }
    
            const result = await response.json();
            console.log('Login successful:', result);
    
            // Redirect nach erfolgreichem Login
            window.location.href = "/dashboard";
        } catch (error) {
            console.error('Error during login:', error);
            setError('An error occurred during login.');
        }
    };

    // Funktion zur Handhabung des Registrierungsformulars
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!username || !password || !email) {
            setError("Please fill in all fields.");
            return;
        }

        var hashedPassword = await hashPassword(password);

        setError("");
        console.log("Registering with:", { username, password, email, is2FAEnabled });
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password: hashedPassword, email, is2FAEnabled }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.error || 'Login failed.');
                return;
            }
    
            const result = await response.json();
            console.log('Login successful:', result);
    
            // Redirect nach erfolgreicher Registrierung
            window.location.href = "/dashboard";
        } catch (error) {
            console.error('Error during login:', error);
            setError('An error occurred during login.');
        }
    };

    return (
        <div className="BackgroundLogin">
            <h1 className="TitleFont">{isRegistering ? "Register" : "Login"}</h1>
            <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                {/* Benutzernamen-Eingabe */}
                <label className="InputFontStacked">
                    Username:
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </label>
                <br />

                {/* Passwort-Eingabe */}
                <label className="InputFontStacked">
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
                        <label className="InputFontStacked">
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
                        <label className="InputFontSideBySide">
                            Enable Two-Factor Authentication
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
                {error && <p style={{ color: "red" }} className="ErrorFont">{error}</p>}

                {/* Absenden-Button */}
                <button className="ButtonDesign" type="submit">{isRegistering ? "Register" : "Login"}</button>
            </form>

            {/* Umschalten zwischen Login und Registrierung */}
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
        </div>
    );
}
