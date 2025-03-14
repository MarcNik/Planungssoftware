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
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    // Beim Laden der Seite: Authentifizierung prüfen und Benutzerdaten laden
    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) {
            router.push("https://localhost:5001/");
            return;
        }

        fetch("/api/user", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    console.error(data.error);
                    router.push("https://localhost:5001/");
                } else {
                    setUsername(data.username);
                    setEmail(data.email);
                }
            })
            .catch((err) => console.error("Error fetching user data:", err));

            get_appointments();
    }, [router]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleEditModal = () => {
        setIsEditModalOpen(!isEditModalOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        window.location.href = "https://localhost:5001/";
    };

    const saveAppointment = () => {
        if (!date || !time || !description) {
            setConfirmation("Please fill in all fields to save an appointment.");
            return;
        }

        const dateTimeString = `${date}T${time}:00`; // Die Zeit bekommt noch Sekunden
        const dateTime = new Date(dateTimeString);

        add_appointment("Test", description, dateTime);

        setAppointments([...appointments, { date, time, description }]);
        setConfirmation("Appointment saved successfully!");
        setDate("");
        setTime("");
        setDescription("");
    };

    const handleCalendarChange = (selectedDate) => {
        setSelectedDate(new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())));
        setDate(formatDateToLocal(selectedDate));
    };

    const formatDateToLocal = (date) => {
        const newDate = new Date(date);
        newDate.setMinutes(newDate.getMinutes() - newDate.getTimezoneOffset());
        return newDate.toISOString().split("T")[0];
    };

    const saveProfileChanges = () => {
        localStorage.setItem("username", username);
        localStorage.setItem("email", email);
        setIsEditModalOpen(false);
    };

    const add_appointment = async (title, description, date) => {
        const t = localStorage.getItem("authToken");
        const response = await fetch("/api/add-appointment", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${t}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, description, date, token: t }),
        });

        const result = await response.json();
    };

    const get_appointments = async () => {
        const t = localStorage.getItem("authToken");
        const response = await fetch("/api/get-appointment", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${t}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ token: t }),
        });

        const result = await response.json();
        const appointments = result.appointments;

        const appointments_arr = appointments.map(appointment => {
            return {
                date: new Date(appointment.date).toISOString().split("T")[0],
                time: new Date(appointment.date).toTimeString().split(":").slice(0, 2).join(":"),
                description: appointment.description
            };
        });

        setAppointments(appointments_arr);
    };

    return (
        <div>
            {/* Top bar with profile button and username */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px" }}>
                <div className="InputFontSideBySide" style={{ fontSize: "18px", fontWeight: "bold" }}>
                    Welcome, {username}
                </div>
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
                            <img src="/icons/profileicon.png" alt="Profile Icon" className="modalProfileImage" />
                        </div>
                        <label className="InputFontStacked">
                            Username:
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                        </label>
                        <br />
                        <label className="InputFontStacked">
                            Email:
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </label>
                        <br />
                        <button className="ButtonDesign" onClick={saveProfileChanges}>Save</button>
                        <button className="ButtonDesign" onClick={toggleEditModal}>Cancel</button>
                    </div>
                </div>
            )}

            <h1 className="TitleFont">Add Appointment</h1>

            {/* Appointment form */}
            <label className="InputFontSideBySide">
                Date:
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <br />

            <label className="InputFontSideBySide">
                Time:
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </label>
            <br />

            <label className="InputFontSideBySide">
                Description:
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <br />

            <button className="ButtonDesign" onClick={saveAppointment}>Save Appointment</button>

            {confirmation && <p className="InputFontSideBySide">{confirmation}</p>}

            <h2 className="TitleFont">Calendar</h2>
            <Calendar onChange={handleCalendarChange} value={selectedDate} />

            <h3 className="TitleFont">Appointments for {selectedDate?.toLocaleDateString()}</h3>
            {appointments
                .filter(appt => new Date(appt.date).toISOString().split("T")[0] === selectedDate?.toISOString().split("T")[0])
                .map((appt, index) => (
                    <div key={index}>
                        <p>{appt.time} - {appt.description}</p>
                    </div>
                ))}
        </div>
    );
}
