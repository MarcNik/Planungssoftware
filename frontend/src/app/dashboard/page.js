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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [dateOption, setDateOption] = useState("fullDay");
    const [todoItems, setTodoItems] = useState([]);
    const [completedTodos, setCompletedTodos] = useState({});

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

    const saveAppointment = () => {
        if (!fromDate || !toDate || (selectedOption === "option2" ? todoItems.length === 0 : !description)) {
            setConfirmation("Please fill in all fields to save an appointment.");
            return;
        }

        const dateTimeString = `${date}T${time}:00`; // Die Zeit bekommt noch Sekunden
        const dateTime = new Date(dateTimeString);

        add_appointment("Test", description, dateTime);

        const newAppointment = {
            fromDate,
            toDate,
            description: selectedOption !== "option2" ? description : null,
            time: selectedOption !== "option2" && fromDate === toDate ? time : null,
            dateOption: selectedOption !== "option2" && fromDate !== toDate ? dateOption : null,
            todoItems: selectedOption === "option2" ? todoItems : null
        };
    
        setAppointments([...appointments, newAppointment]);
        setConfirmation("Appointment saved successfully!");
        setFromDate("");
        setToDate("");
        setTime("");
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
            <div className={`profileMenu ${isMenuOpen ? 'open' : ''}`}>
                <button className="closeButton" onClick={toggleMenu}>
                    Schließen X
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

            {/* open calendar popup/modal on click */}
            <Calendar onChange={handleCalendarChange} value={selectedDate} />

            {/* MODAL to add appoints / time off / todo List */}
            {isModalOpen && (
                <div className="modalOverlay">
                    <div className="modalContent" id="modalCalendar">
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
                     <label className="InputFontStacked">
                         Time:
                         <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                     </label>
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
 
 <h3 className="TitleFont">Upcoming Appointments</h3>
 {appointments
     .filter(appt => new Date(appt.toDate) >= new Date()) // Nur zukünftige Termine
     .sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate)) // Nach Datum sortieren
     .map((appt, index) => (
         <div key={index} className="appointmentItem">
             <strong>{new Date(appt.fromDate).toLocaleDateString()} → {new Date(appt.toDate).toLocaleDateString()}</strong>
             {appt.todoItems ? (
                 <div>
                     <strong>To-Do:</strong>
                     <ul>
                         {appt.todoItems.map((task, taskIndex) => (
                             <li key={taskIndex} className="todoItem">
                                 <input
                                     type="checkbox"
                                     checked={completedTodos[`${index}-${taskIndex}`] || false}
                                     onChange={() => {
                                         setCompletedTodos(prev => ({
                                             ...prev,
                                             [`${index}-${taskIndex}`]: !prev[`${index}-${taskIndex}`]
                                         }));
                                     }}
                                 />
                                 <span className={completedTodos[`${index}-${taskIndex}`] ? "completed" : ""}>
                                     {task}
                                 </span>
                             </li>
                         ))}
                     </ul>
                 </div>
             ) : (
                 <p>
                     {appt.time ? `${appt.time} - ` : ""}
                     {appt.description}
                     {appt.dateOption ? ` (${appt.dateOption})` : ""}
                 </p>
             )}
         </div>
     ))}
             </div>
     );
 }
