"use client";

import { useState } from "react";
import Calendar from "react-calendar";

export default function Page() {
    // State to manage input fields and stored appointments
    const [date, setDate] = useState(""); // Stores the selected date
    const [time, setTime] = useState(""); // Stores the selected time
    const [description, setDescription] = useState(""); // Stores the description of the appointment
    const [appointments, setAppointments] = useState([]); // Array to store all saved appointments
    const [selectedDate, setSelectedDate] = useState(new Date()); // Tracks the currently selected date in the calendar
    const [confirmation, setConfirmation] = useState(""); // Displays a confirmation message after saving an appointment

    // Function to save a new appointment
    const handleSaveAppointment = () => {
        // Validate that all input fields are filled
        if (!date || !time || !description) {
            alert("Please fill in all fields!"); // Alert user if any field is empty
            return;
        }

        // Create a new appointment object
        const newAppointment = {
            date,
            time,
            description,
        };

        // Add the new appointment to the existing list
        setAppointments([...appointments, newAppointment]);
        setConfirmation("Appointment successfully saved!"); // Set confirmation message

        // Reset input fields
        setDate("");
        setTime("");
        setDescription("");
    };

    // Handle calendar date selection and sync with input field
    const handleDateSelection = (selectedDate) => {
        setSelectedDate(selectedDate); // Update the selected date in the calendar
        setDate(selectedDate.toISOString().split("T")[0]); // Update the date input field
    };

    // Filter appointments for the currently selected date in the calendar
    const appointmentsForSelectedDate = appointments.filter(
        (appointment) => appointment.date === selectedDate.toISOString().split("T")[0]
    );

    return (
        <div>
            <h1>Add Appointment</h1>

            {/* Input form for new appointments */}
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

            {/* Button to save the appointment */}
            <button onClick={handleSaveAppointment}>Save Appointment</button>

            {/* Display confirmation message if set */}
            {confirmation && <p>{confirmation}</p>}

            {/* Calendar view */}
            <h2>Calendar</h2>
            <Calendar
                onChange={handleDateSelection} // Update selected date and sync with input
                value={selectedDate} // Current selected date
            />

            {/* Display appointments for the selected date */}
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
