"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Stelle sicher, dass useState hier importiert wird
import Calendar from "react-calendar";
import "../styles/dashboardStyle.css";
import "react-calendar/dist/Calendar.css";
import "../styles/calendar.css";

export default function Page() {
    const router = useRouter();
    const [date, setDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [description, setDescription] = useState("");
    const [appointments, setAppointments] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [confirmation, setConfirmation] = useState("");
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [dateOption, setDateOption] = useState("fullDay");
    const [todoItems, setTodoItems] = useState([]);
    const [completedTodos, setCompletedTodos] = useState({});
    const [showCalendar, setShowCalendar] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [pendingAppointment, setPendingAppointment] = useState(null);


    // Beim Laden der Seite: Benutzerdaten laden
    useEffect(() => {

        const storedUsername = localStorage.getItem("username");
        if (!storedUsername) {
            router.push("https://localhost:5001/");
            return;
        }

        setUsername(storedUsername); // Setze den Benutzernamen sofort

        fetch(`/api/user?username=${storedUsername}`)
            .then((res) => {
                if (!res.ok) {
                    console.error("Error fetching user data: Network response was not ok");
                    return; // Beende die Funktion, aber leite nicht weiter
                }
                return res.json();
            })
            .then((data) => {
                setEmail(data.email);
            })
            .catch((err) => {
                console.error("Error fetching user data:", err);
                // Hier könntest du eine Fehlermeldung anzeigen, aber nicht weiterleiten
            });

        const storedCompleted = localStorage.getItem("completedTodos");
        if (storedCompleted) {
            setCompletedTodos(JSON.parse(storedCompleted));
        }

        get_appointments(storedUsername);
    }, [router]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const toggleEditModal = () => {
        setIsEditModalOpen(!isEditModalOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem("username");
        localStorage.removeItem("email");
        window.location.href = "https://localhost:5001/";
    };

    const saveAppointment = async () => {
        if (!fromDate || !toDate || (selectedOption === "option2" ? todoItems.length === 0 : !description)) {
            setConfirmation("Please fill in all fields to save an appointment.");
            return;
        }

        const newStart = new Date(`${fromDate}T${startTime || "00:00"}:00`);
        const newEnd = new Date(`${toDate}T${endTime || "23:59"}:00`);

        const isOverlapping = appointments.some((appt) => {
            const apptStart = new Date(`${appt.fromDate}T${appt.startTime || "00:00"}:00`);
            const apptEnd = new Date(`${appt.toDate}T${appt.endTime || "23:59"}:00`);

            return newStart < apptEnd && newEnd > apptStart;
        });

        if (isOverlapping) {
            setPendingAppointment({
                fromDate,
                toDate,
                description,
                startTime,
                endTime,
                dateOption,
                todoItems: selectedOption === "option2" ? todoItems : null,
                title: selectedOption === "option3" ? "Absence" : "Appointment"
            });
            setShowConflictModal(true);
            return;
        }

        const dateTimeString = `${fromDate}T${startTime}:00`;
        const dateTime = new Date(dateTimeString);

        await add_appointment(
            username,
            selectedOption === "option3" ? "Absence" : "Appointment",
            description,
            dateTime,
            fromDate,
            toDate,
            startTime,
            endTime,
            fromDate !== toDate ? dateOption : null, // dateOption nur übergeben, wenn nötig
            selectedOption === "option2" ? todoItems : null
        );

        const newAppointment = {
            fromDate,
            toDate,
            description: selectedOption !== "option2" ? description : null,
            startTime: selectedOption !== "option2" && fromDate === toDate ? startTime : null,
            endTime: selectedOption !== "option2" && fromDate === toDate ? endTime : null,
            dateOption: selectedOption !== "option2" && fromDate !== toDate ? dateOption : null,
            todoItems: selectedOption === "option2" ? todoItems : null,
            title: selectedOption === "option3" ? "Absence" : "Appointment"
        };

        setAppointments([...appointments, newAppointment]);
        setConfirmation("Appointment saved successfully!");
        setFromDate("");
        setToDate("");
        setStartTime("");
        setEndTime("");
        setDescription("");
        setTodoItems([]);
        setDateOption("fullDay");
        setIsModalOpen(false);
    };


    const handleCalendarChange = (selectedDate) => {
        const formattedDate = formatDateToLocal(selectedDate);
        setSelectedDate(new Date(Date.UTC(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())));
        setDate(formattedDate);
        setFromDate(formattedDate);
        setToDate(formattedDate);
        setIsModalOpen(true);

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

    const add_appointment = async (username, title, description, date, fromDate, toDate, startTime, endTime, dateOption, todoItems) => {
        const t = localStorage.getItem("authToken");
        const response = await fetch("https://localhost:5001/api/add-appointment", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${t}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                title,
                description,
                date,
                fromDate,
                toDate,
                startTime,
                endTime,
                dateOption,
                todoItems,
                token: t
            }),
        });


        const result = await response.json();
    };


    const get_appointments = async (username) => {
        const response = await fetch("https://localhost:5001/api/get-appointment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Fehler beim Abrufen der Termine:", result.error);
            return;
        }

        const appointments = result.appointments || [];

        const appointments_arr = appointments.map(appointment => ({
            fromDate: appointment.from_date,
            toDate: appointment.to_date,
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            description: appointment.description,
            dateOption: appointment.date_option,
            todoItems: appointment.todo_items,
            title: appointment.title
        }));

        setAppointments(appointments_arr);
    };




    return (
        <div className="dashboardContainer">
            {/* Top bar with profile button and username */}
            <div className="topBar">
                <div className="welcomeText">
                    Welcome, {username}
                </div>
                <button className="profileButton" onClick={toggleMenu}>
                    <img src="/icons/profileicon.png" alt="Profile Icon" />
                </button>
            </div>

            {/* Profile menu */}
            <div className={`profileMenu ${isMenuOpen ? 'open' : ''}`}>
                {/* Hier wird das Profilmenü eingefügt */}
                <button className="closeButton" onClick={toggleMenu}>
                    Close X
                </button>
                <div className="profileMenuButtons">
                    <button className="ButtonDesign" onClick={toggleEditModal}>
                        Edit
                    </button>
                    <button className="ButtonDesign" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* Modal for profile editing */}
            {isEditModalOpen && (
                <div className="modalOverlay">
                    <div className="modalContent modalProfile">
                        {/* Hier wird das Profilbearbeitungsmodal eingefügt */}
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

            {/* Termine Übersicht */}
            <div className="appointmentsOverview">
                <h3 className="sectionTitle">Upcoming Appointments</h3>
                {appointments
                    .filter(appt => new Date(appt.toDate) >= new Date())
                    .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))
                    .map((appt, index) => (
                        <div
                            key={index}
                            className={`appointmentItem ${appt.title === "Absence" ? "absence" : ""}`}
                        >
                            <strong>{new Date(appt.fromDate).toLocaleDateString()} → {new Date(appt.toDate).toLocaleDateString()}</strong>

                            {/* Abwesenheiten */}
                            {appt.title === "Absence" ? (
                                <p className="absenceLabel">{appt.description}</p>

                                // To-Do-Listen
                            ) : appt.todoItems && Array.isArray(appt.todoItems) && appt.todoItems.length > 0 ? (
                                <div>
                                    <strong>To-Do:</strong>
                                    <ul>
                                        {appt.todoItems.map((task, taskIndex) => (
                                            <li key={taskIndex} className="todoItem">
                                                <input
                                                    type="checkbox"
                                                    checked={completedTodos[`${index}-${taskIndex}`] || false}
                                                    onChange={() => {
                                                        const key = `${index}-${taskIndex}`;
                                                        const updated = {
                                                            ...completedTodos,
                                                            [key]: !completedTodos[key]
                                                        };
                                                        setCompletedTodos(updated);
                                                        localStorage.setItem("completedTodos", JSON.stringify(updated));
                                                    }}
                                                />
                                                <span className={completedTodos[`${index}-${taskIndex}`] ? "completed" : ""}>
                                                    {task}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                // Normale Termine
                            ) : (
                                <p>
                                    {appt.startTime && appt.endTime ? `${appt.startTime} - ${appt.endTime} - ` : ""}
                                    {appt.description}
                                    {appt.dateOption ? ` (${appt.dateOption})` : ""}
                                </p>
                            )}
                        </div>
                    ))}
            </div>


            {/* Kalender-Button und Kalender */}
            <button className="calendarButton" onClick={() => setShowCalendar(!showCalendar)}>
                {showCalendar ? "Hide Calendar" : "Show Calendar"}
            </button>

            {showCalendar && (
                <div className="calendarContainer">
                    <Calendar onChange={handleCalendarChange} value={selectedDate} />
                </div>
            )}

            {/* Modal to add appoints / time off / todo List */}
            {isModalOpen && (
                <div className="modalOverlay">
                    <div className="modalContent modalCalendar">
                        {/* Hier wird das Termin-Modal eingefügt */}
                        <h2>Add {selectedOption === "option2" ? "To-Do List" : "Appointment"}</h2>

                        {/* Select Box */}
                        <label className="InputFontStacked fullWidth">
                            Select Option:
                            <select value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                                <option value="">Please select...</option>
                                <option value="option1">Appointment</option>
                                <option value="option2">To-Do</option>
                                <option value="option3">Absence</option>
                            </select>
                        </label>

                        {/* Date Range */}
                        <div className="dateInputContainer">
                            <label className="InputFontStacked">
                                From:
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                            </label>
                            <label className="InputFontStacked">
                                To:
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                            </label>

                            {/* Bedingte Anzeige des dritten Inputs */}
                            {selectedOption !== "option2" && fromDate === toDate ? (
                                <div className="timeInputContainer">
                                    <label className="InputFontStacked">
                                        Start Time:
                                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                                    </label>
                                    <label className="InputFontStacked">
                                        End Time:
                                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                                    </label>
                                </div>
                            ) : selectedOption !== "option2" ? (
                                <label className="InputFontStacked">
                                    Option:
                                    <select value={dateOption} onChange={(e) => setDateOption(e.target.value)}>
                                        <option value="fullDay">Full Day</option>
                                        <option value="halfDay">First Half of Day</option>
                                        <option value="halfDay">Second Half of Day</option>
                                    </select>
                                </label>
                            ) : null}
                        </div>

                        {/* To-Do Punkte oder Beschreibung */}
                        {selectedOption === "option2" ? (
                            <div>
                                <label className="InputFontStacked">To-Do List:</label>
                                {todoItems.map((item, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        value={item}
                                        placeholder={`Task ${index + 1}`}
                                        onChange={(e) => {
                                            const newItems = [...todoItems];
                                            newItems[index] = e.target.value;
                                            setTodoItems(newItems);
                                        }}
                                    />
                                ))}
                                {todoItems.length < 5 && (
                                    <button className="ButtonDesign" onClick={() => setTodoItems([...todoItems, ""])}>+ Add Task</button>
                                )}
                            </div>
                        ) : (
                            <label className="InputFontStacked">
                                Description:
                                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
                            </label>
                        )}

                        {/* Buttons */}
                        <div className="modalButtons">
                            <button className="ButtonDesign" onClick={saveAppointment}>Save</button>
                            <button className="ButtonDesign" onClick={() => setIsModalOpen(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {showConflictModal && (
                <div className="modalOverlay">
                    <div className="modalContent modalCalendar">
                        <h2>Time Conflict</h2>
                        <p>This appointment overlaps with an existing one. Do you want to save it anyway?</p>
                        <div className="modalButtons">
                            <button className="ButtonDesign" onClick={async () => {
                                const dateTime = new Date(`${pendingAppointment.fromDate}T${pendingAppointment.startTime}:00`);
                                await add_appointment(
                                    username,
                                    pendingAppointment.title,
                                    pendingAppointment.description,
                                    dateTime,
                                    pendingAppointment.fromDate,
                                    pendingAppointment.toDate,
                                    pendingAppointment.startTime,
                                    pendingAppointment.endTime,
                                    pendingAppointment.dateOption,
                                    pendingAppointment.todoItems
                                );

                                setAppointments([...appointments, pendingAppointment]);
                                setShowConflictModal(false);
                                setIsModalOpen(false);
                            }}>Save anyway</button>

                            <button className="ButtonDesign" onClick={() => {
                                setShowConflictModal(false);
                            }}>Go Back</button>
                        </div>
                    </div>
                </div>
            )}

        </div>


    );
}
