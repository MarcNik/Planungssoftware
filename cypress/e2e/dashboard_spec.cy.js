/// <reference types="cypress" />

describe("Dashboard UI Tests", () => {
    beforeEach(() => {
        // Hier gehe ich davon aus, dass der Benutzer vorher eingeloggt ist, oder ich simuliere das Login
        cy.visit("https://localhost:5001/dashboard");  // Ersetze mit dem richtigen Pfad zu deinem Dashboard
    });

    it("should display the dashboard with user details", () => {
        // Überprüfe, ob der Benutzername angezeigt wird
        cy.contains("Welcome, testuser");

        // Überprüfe, ob die Profil-Buttons existieren
        cy.get(".profileButton").should("exist");

        // Überprüfe, ob der Kalender-Button existiert
        cy.get(".calendarButton").should("exist");
    });

    it("should open and close the profile menu", () => {
        cy.get(".profileButton").click();
        cy.get(".profileMenu").should("have.class", "open");

        cy.get(".closeButton").click();
        cy.get(".profileMenu").should("not.have.class", "open");
    });

    it("should open the profile edit modal", () => {
        cy.get(".profileButton").click();
        cy.get(".ButtonDesign").contains("Edit").click();

        cy.get(".modalProfile").should("exist");
        cy.get("input[type='text']").should("have.value", "testuser");  // Hier wird der Benutzername überprüft
        cy.get("input[type='email']").should("have.value", "testuser@example.com");  // Hier wird die Email überprüft
    });

    it("should logout the user", () => {
        cy.get(".profileButton").click();
        cy.get(".ButtonDesign").contains("Logout").click();

        // Überprüfe, ob der Benutzer auf der Login-Seite ist (hier gehe ich davon aus, dass /login der Pfad ist)
        cy.url().should("include", "/login");
    });

    it("should display the upcoming appointments", () => {
        cy.get(".appointmentsOverview").should("exist");
        cy.get(".appointmentItem").should("have.length.greaterThan", 0); // Überprüft, ob mindestens ein Termin angezeigt wird
    });

    it("should show the calendar when the button is clicked", () => {
        cy.get(".calendarButton").click();
        cy.get(".calendarContainer").should("exist");

        cy.get(".calendarButton").click();  // Verstecke den Kalender
        cy.get(".calendarContainer").should("not.exist");
    });

    it("should open the modal to add an appointment", () => {
        cy.get(".calendarButton").click();
        cy.get(".react-calendar__tile").first().click();  // Wähle das erste Datum im Kalender aus

        cy.get(".modalCalendar").should("exist");
        cy.get("select").should("exist");  // Überprüft, ob das Auswahlfeld für den Termin existiert
    });

    it("should save an appointment", () => {
        cy.get(".calendarButton").click();
        cy.get(".react-calendar__tile").first().click();  // Wähle das erste Datum im Kalender aus

        cy.get("select").select("option1");  // Wähle die Terminoption
        cy.get("input[type='text']").type("Test Appointment");
        cy.get("input[type='date']").first().type("2025-05-01");
        cy.get("input[type='date']").last().type("2025-05-01");

        // Hier gehe ich davon aus, dass es sich um die Schaltfläche zum Speichern handelt
        cy.get(".ButtonDesign").contains("Save").click();

        // Überprüfe, ob der Termin erfolgreich gespeichert wurde (z. B. durch eine Bestätigungsmeldung)
        cy.contains("Appointment saved successfully!").should("exist");
    });

    it("should toggle the edit modal", () => {
        cy.get(".profileButton").click();
        cy.get(".ButtonDesign").contains("Edit").click();

        cy.get(".modalProfile").should("exist");
        cy.get(".ButtonDesign").contains("Cancel").click();
        cy.get(".modalProfile").should("not.exist");
    });
});
