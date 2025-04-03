import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "frontend/src/app/dashboard/page.js"; // Der Pfad zu deiner Page-Komponente
import { useRouter } from "next/navigation";

// Mocking des useRouter-Hooks, um das Verhalten des Routings zu testen
jest.mock("next/navigation", () => ({
    useRouter: jest.fn(),
}));

describe("Page Component", () => {
    const mockPush = jest.fn();

    beforeEach(() => {
        useRouter.mockImplementation(() => ({ push: mockPush }));
    });

    it("should render the page correctly and show the username", async () => {
        localStorage.setItem("username", "testuser");

        render(<Page />);

        // Überprüfen, ob der Benutzername korrekt angezeigt wird
        expect(screen.getByText(/Welcome, testuser/i)).toBeInTheDocument();
    });

    it("should redirect to login page if username is not in localStorage", async () => {
        localStorage.removeItem("username");  // Entfernen des Benutzernamens aus dem localStorage

        render(<Page />);

        // Warten, bis der Redirect ausgelöst wird
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith("https://localhost:5001/"));
    });

    it("should toggle the profile menu on click", () => {
        render(<Page />);

        const profileButton = screen.getByRole("button", { name: /Profile/i });
        userEvent.click(profileButton);

        // Überprüfen, ob das Menü jetzt geöffnet ist
        expect(screen.getByText(/Edit/i)).toBeInTheDocument();

        userEvent.click(profileButton); // Menü erneut schließen
        expect(screen.queryByText(/Edit/i)).not.toBeInTheDocument();
    });

    it("should show the calendar when clicked", () => {
        render(<Page />);

        const calendarButton = screen.getByRole("button", { name: /Show Calendar/i });
        userEvent.click(calendarButton);

        // Überprüfen, ob der Kalender angezeigt wird
        expect(screen.getByRole("calendar")).toBeInTheDocument();
    });

    it("should save an appointment correctly", async () => {
        localStorage.setItem("username", "testuser");

        render(<Page />);

        // Simuliere die Eingabe für ein neues Appointment
        userEvent.click(screen.getByRole("button", { name: /Show Calendar/i }));

        userEvent.type(screen.getByLabelText(/From:/), "2025-05-01");
        userEvent.type(screen.getByLabelText(/To:/), "2025-05-01");
        userEvent.type(screen.getByLabelText(/Description:/), "Doctor's appointment");

        userEvent.click(screen.getByRole("button", { name: /Save/i }));

        // Überprüfen, ob die Bestätigungsmeldung angezeigt wird
        await waitFor(() => expect(screen.getByText(/Appointment saved successfully/i)).toBeInTheDocument());
    });

    it("should handle form validation when saving appointment", async () => {
        localStorage.setItem("username", "testuser");

        render(<Page />);

        userEvent.click(screen.getByRole("button", { name: /Show Calendar/i }));

        userEvent.type(screen.getByLabelText(/From:/), "2025-05-01");
        userEvent.type(screen.getByLabelText(/To:/), "2025-05-01");

        // Lege keine Beschreibung an, um die Validierung zu testen
        userEvent.click(screen.getByRole("button", { name: /Save/i }));

        // Überprüfen, ob die Fehlermeldung angezeigt wird
        await waitFor(() => expect(screen.getByText(/Please fill in all fields to save an appointment./i)).toBeInTheDocument());
    });
});
