"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import '../styles/dashboardStyle.css';
import 'react-calendar/dist/Calendar.css';
import '../styles/calendar.css';

export default function Page() {
    const router = useRouter(); // Router-Instance von Next.js
    const [date, setDate] = useState(""); // Speichert das ausgewählte Datum im YYYY-MM-DD Format
    const [time, setTime] = useState(""); // Speichert die ausgewählte Uhrzeit
    const [description, setDescription] = useState(""); // Speichert die Beschreibung des Termins
    const [appointments, setAppointments] = useState([]); // Array zur Speicherung aller Termine
    const [selectedDate, setSelectedDate] = useState(null); // Speichert das aktuell ausgewählte Datum im Kalender
    const [confirmation, setConfirmation] = useState(""); // Zeigt eine Bestätigungsnachricht nach dem Speichern eines Termins
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Zustand für das Profil-Side-Menü

    // Token-Überprüfung
    useEffect(() => {
        const token = localStorage.getItem("authToken");

        if (!token) {
            router.push("https://localhost:5001/");
        }
    }, [router]);

    useEffect(() => {
        // Setzt das initial ausgewählte Datum nach dem Laden der Komponente (um SSR-Mismatch zu vermeiden)
        setSelectedDate(new Date());
    }, []);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken"); // Token aus localStorage entfernen
        window.location.href = "https://localhost:5001/";
    };

    const saveAppointment = () => {
        if (!date || !time || !description) {
            setConfirmation("Please fill in all fields to save an appointment.");
            return;
        }

        setAppointments([...appointments, { date, time, description }]);
        setConfirmation("Appointment saved successfully!");
        setDate("");
        setTime("");
        setDescription("");
    };

    return (
        <div>
            {/* Profil Button */}
            <div className="profile-container">
                <button className="profile-button" onClick={toggleMenu}>
                    <img
                        src="/profile-icon.png"
                        alt="Profile Icon"
                        className="profile-icon"
                    />
                </button>
                {isMenuOpen && (
                    <div className="side-menu">
                        <button onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>

            <h1 className="TitleFont">Add Appointment</h1>

            {/* Formular zur Eingabe neuer Termine */}
            <label className="InputFontSideBySide">
                Date:
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </label>
            <br />

            <label className="InputFontSideBySide">
                Time:
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
            </label>
            <br />

            <label className="InputFontSideBySide">
                Description:
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>
            <br />

            <button className="ButtonDesign" onClick={saveAppointment}>
                Save Appointment
            </button>

            {confirmation && <p className="InputFontSideBySide">{confirmation}</p>}

            {/* Kalenderansicht */}
            <h2 className="TitleFont">Calendar</h2>
            <Calendar
                onChange={(date) => setSelectedDate(new Date(date))}
                value={selectedDate}
            />

            <h3 className="TitleFont">Appointments for {selectedDate?.toLocaleDateString()}</h3>
            {/* Termine */}
            {appointments
                .filter((appt) => appt.date === selectedDate?.toISOString().split("T")[0])
                .map((appt, index) => (
                    <div key={index}>
                        <p>{appt.time} - {appt.description}</p>
                    </div>
                ))}
        </div>
    );
}
