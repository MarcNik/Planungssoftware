"use client";

import { useState, useEffect } from "react";
import Calendar from "react-calendar";

export default function Page() {
    const [date, setDate] = useState(""); // Speichert das ausgewählte Datum im YYYY-MM-DD Format
    const [time, setTime] = useState(""); // Speichert die ausgewählte Uhrzeit
    const [description, setDescription] = useState(""); // Speichert die Beschreibung des Termins
    const [appointments, setAppointments] = useState([]); // Array zur Speicherung aller Termine
    const [selectedDate, setSelectedDate] = useState(null); // Speichert das aktuell ausgewählte Datum im Kalender
    const [confirmation, setConfirmation] = useState(""); // Zeigt eine Bestätigungsnachricht nach dem Speichern eines Termins

    useEffect(() => {
        // Setzt das initial ausgewählte Datum nach dem Laden der Komponente (um SSR-Mismatch zu vermeiden)
        setSelectedDate(new Date());
    }, []);

    // Funktion, um einen neuen Termin zu speichern
    const handleSaveAppointment = () => {
        // Überprüfen, ob alle Eingabefelder ausgefüllt sind
        if (!date || !time || !description) {
            alert("Please fill in all fields!"); // Fehlermeldung, wenn ein Feld leer ist
            return;
        }

        // Neuen Termin erstellen
        const newAppointment = {
            date,
            time,
            description,
        };

        // Den neuen Termin zur Liste der gespeicherten Termine hinzufügen
        setAppointments([...appointments, newAppointment]);
        setConfirmation("Appointment successfully saved!"); // Bestätigungsnachricht setzen

        // Eingabefelder zurücksetzen
        setDate("");
        setTime("");
        setDescription("");
    };

    // Funktion, um das Datum im Kalender auszuwählen und mit dem Eingabefeld zu synchronisieren
    const handleDateSelection = (selectedDate) => {
        // Konvertiere das Datum in UTC ohne Zeitzonenverschiebung
        const utcDate = new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()));

        // Setze die ausgewählte Zeit in den Zustand
        setSelectedDate(utcDate);

        // Update das Eingabefeld Datum (YYYY-MM-DD Format)
        setDate(utcDate.toISOString().split("T")[0]); // Datum im Format YYYY-MM-DD speichern
    };

    // Termine für das aktuell ausgewählte Datum filtern
    const appointmentsForSelectedDate = appointments.filter(
        (appointment) => appointment.date === selectedDate?.toISOString().split("T")[0]
    );

    // Wenn selectedDate noch null ist, warte auf das Laden der Daten
    if (selectedDate === null) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h1>Add Appointment</h1>

            {/* Formular zur Eingabe neuer Termine */}
            <label>
                Date:
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
            </label>
            <br />

            <label>
                Time:
                <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                />
            </label>
            <br />

            <label>
                Description:
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>
            <br />

            {/* Button zum Speichern des Termins */}
            <button onClick={handleSaveAppointment}>Save Appointment</button>

            {/* Bestätigungsnachricht anzeigen, wenn gesetzt */}
            {confirmation && <p>{confirmation}</p>}

            {/* Kalenderansicht */}
            <h2>Calendar</h2>
            <Calendar
                onChange={handleDateSelection} // Datum im Kalender aktualisieren
                value={selectedDate} // Das aktuell ausgewählte Datum
            />

            {/* Termine für das ausgewählte Datum anzeigen */}
            <h3>Appointments for {selectedDate.toLocaleDateString()}</h3>
            {appointmentsForSelectedDate.length > 0 ? (
                <ul>
                    {appointmentsForSelectedDate.map((appointment, index) => (
                        <li key={index}>
                            <strong>{appointment.time}</strong>: {appointment.description}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No appointments for this date.</p>
            )}
        </div>
    );
}
