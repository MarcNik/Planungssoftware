// cypress/e2e/integration_spec.cy.js

describe('Integrationstest für Benutzerablauf', () => {
    let username = `integrationtestuser_${Date.now()}`;
    let email = `${username}@example.com`;
    let password = 'IntegrationTest1234!';
    let appointmentTitle = 'Integration Test Appointment';

    it('Sollte einen neuen Benutzer registrieren, sich anmelden, einen Termin hinzufügen, Termine abrufen und Benutzerdaten abrufen', () => {
        // 1. Benutzer registrieren
        cy.request({
            method: 'POST',
            url: 'https://localhost:5001/api/register',
            body: {
                email: email,
                password: password,
                username: username,
                is2FAEnabled: 0,
            },
        }).then((registerResponse) => {
            expect(registerResponse.status).to.eq(200);
            expect(registerResponse.body).to.have.property('message', 'User registered successfully');
        });

        // 2. Benutzer anmelden
        cy.request({
            method: 'POST',
            url: 'https://localhost:5001/api/login',
            body: {
                username: username,
                password: password,
            },
        }).then((loginResponse) => {
            expect(loginResponse.status).to.eq(200);
            expect(loginResponse.body).to.have.property('message', 'Login successful');
        });

        // 3. Termin hinzufügen
        cy.request({
            method: 'POST',
            url: 'https://localhost:5001/api/add-appointment',
            body: {
                username: username,
                title: appointmentTitle,
                date: '2025-05-01',
            },
        }).then((addAppointmentResponse) => {
            expect(addAppointmentResponse.status).to.eq(201);
            expect(addAppointmentResponse.body).to.have.property('message', 'Appointment added successfully.');
        });

        // 4. Termine abrufen
        cy.request({
            method: 'POST',
            url: 'https://localhost:5001/api/get-appointment',
            body: {
                username: username,
            },
        }).then((getAppointmentsResponse) => {
            expect(getAppointmentsResponse.status).to.eq(200);
            expect(getAppointmentsResponse.body).to.have.property('appointments');
            expect(getAppointmentsResponse.body.appointments).to.be.an('array');
            expect(getAppointmentsResponse.body.appointments).to.have.length.greaterThan(0); // Überprüft, ob mindestens ein Termin vorhanden ist
        });

        // 5. Benutzerdaten abrufen
        cy.request({
            method: 'GET',
            url: `https://localhost:5001/api/user?username=${username}`,
        }).then((getUserDataResponse) => {
            expect(getUserDataResponse.status).to.eq(200);
            expect(getUserDataResponse.body).to.have.property('username', username);
            expect(getUserDataResponse.body).to.have.property('email', email);
        });
    });
});