"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "react-calendar";
import "../styles/dashboardStyle.css";
import "react-calendar/dist/Calendar.css";
import "../styles/calendar.css";

export default function Page() {
    const router = useRouter();
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [description, setDescription] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [confirmation, setConfirmation] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [username, setUsername] = useState("JohnDoe");
    const [email, setEmail] = useState("john.doe@example.com");

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("https://localhost:5001/");
        }
    }, [router]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleEditModal = () => {
        setIsEditModalOpen(!isEditModalOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
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

    const handleCalendarChange = (selectedDate) => {
        setSelectedDate(selectedDate);
        const formattedDate = formatDateToLocal(selectedDate);
        setDate(formattedDate);
    };

    const formatDateToLocal = (date) => {
        const newDate = new Date(date);
        newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
        return newDate.toISOString().split("T")[0];
    };

    const saveProfileChanges = () => {
        console.log("Profile updated:", { username, email });
        setIsEditModalOpen(false);
    };

    return (
        <div>
            {/* Top bar with profile button and username */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
                <div className="InputFontSideBySide" style={{ fontSize: "18px", fontWeight: "bold" }}>Welcome, {username}</div>
                <button className="ProfileDesign" onClick={toggleMenu}>
                    <img src="/icons/profileicon.png" alt="Profile Icon" />
                </button>
            </div>

            {/* Profile menu */}
            {isMenuOpen && (
                <div className="profileMenu">
                    <button className="ButtonDesign" onClick={toggleEditModal}>
                        Edit
                    </button>
                    <button className="ButtonDesign" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            )}

            {/* Modal for profile editing */}
            {isEditModalOpen && (
                <div className="modalOverlay">
                    <div className="modalContent">
                        <div className="modalHeader">
                            <img
                                src="/icons/profileicon.png"
                                alt="Profile Icon"
                                className="modalProfileImage"
                            />
                        </div>
                        <label className="InputFontStacked">
                            Username:
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </label>
                        <br />
                        <label className="InputFontStacked">
                            Email:
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </label>
                        <br />
                        <button className="ButtonDesign" onClick={saveProfileChanges}>
                            Save
                        </button>
                        <button className="ButtonDesign" onClick={toggleEditModal}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <h1 className="TitleFont">Add Appointment</h1>

            {/* Appointment form */}
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
                    type="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </label>
            <br />

            <button className="ButtonDesign" onClick={saveAppointment}>
                Save Appointment
            </button>

            {confirmation && <p className="InputFontSideBySide">{confirmation}</p>}

            <h2 className="TitleFont">Calendar</h2>
            <Calendar onChange={handleCalendarChange} value={selectedDate} />

            <h3 className="TitleFont">Appointments for {selectedDate?.toLocaleDateString()}</h3>
            {appointments
                .filter(
                    (appt) =>
                        new Date(appt.date).toISOString().split("T")[0] ===
                        selectedDate?.toISOString().split("T")[0]
                )
                .map((appt, index) => (
                    <div key={index}>
                        <p>
                            {appt.time} - {appt.description}
                        </p>
                    </div>
                ))}
        </div>
    );
}
