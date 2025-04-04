import React from 'react';
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Page from "frontend/src/app/page.js";
import { useRouter } from 'next/router';

// Mocken des Routers von Next.js
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

describe("Login Page", () => {
    let pushMock;

    beforeEach(() => {
        pushMock = jest.fn(); // Mock der push Methode
        // Mock für den Router: definiere das Verhalten von useRouter
        useRouter.mockReturnValue({
            push: pushMock,
            pathname: '/login',
        });
    });

    test("renders login form", () => {
        render(<Page />);

        // Überprüfen, ob die Login-Formularfelder vorhanden sind
        expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
        expect(screen.getByText(/Login/)).toBeInTheDocument();
    });

    test("displays error when username or password is missing", async () => {
        render(<Page />);

        const loginButton = screen.getByText(/Login/);
        userEvent.click(loginButton);

        // Überprüfen, ob eine Fehlermeldung erscheint, wenn der Benutzername oder das Passwort fehlt
        await waitFor(() => expect(screen.getByText(/Please enter both username and password/)).toBeInTheDocument());
    });

    test("shows error when login fails", async () => {
        // Mocken des Fetch-Requests, um einen Fehler zurückzugeben
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: false,
            json: jest.fn().mockResolvedValueOnce({ error: "Invalid credentials" }),
        });

        render(<Page />);

        // Eingeben eines Benutzernamens und Passworts
        userEvent.type(screen.getByLabelText(/Username/i), "testuser");
        userEvent.type(screen.getByLabelText(/Password/i), "Test1234!");

        const loginButton = screen.getByText(/Login/);
        userEvent.click(loginButton);

        // Überprüfen, ob eine Fehlermeldung angezeigt wird
        await waitFor(() => expect(screen.getByText(/Invalid credentials/)).toBeInTheDocument());
    });

    test("successful login redirects to dashboard", async () => {
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ is2FAEnabled: false }),
        });

        render(<Page />);

        // Eingeben eines Benutzernamens und Passworts
        userEvent.type(screen.getByLabelText(/Username/i), "testuser");
        userEvent.type(screen.getByLabelText(/Password/i), "Test1234!");

        const loginButton = screen.getByText(/Login/);
        userEvent.click(loginButton);

        // Überprüfen, ob der Benutzer zum Dashboard weitergeleitet wird
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    });

    test("shows registration form when 'Register' is clicked", () => {
        render(<Page />);

        const registerButton = screen.getByText(/Register/);
        userEvent.click(registerButton);

        // Überprüfen, ob das Registrierungsformular angezeigt wird
        expect(screen.getByText(/Register/)).toBeInTheDocument();
    });

    test("validates password strength", async () => {
        render(<Page />);

        // Testen eines schwachen Passworts
        userEvent.type(screen.getByLabelText(/Password/i), "weak");

        const registerButton = screen.getByText(/Register/);
        userEvent.click(registerButton);

        // Überprüfen, ob eine Fehlermeldung zur Passwortvalidierung erscheint
        await waitFor(() => expect(screen.getByText(/Password must be at least 10 characters long/)).toBeInTheDocument());
    });

    test("2FA verification form appears when 2FA is enabled", async () => {
        // Mocken des erfolgreichen Login-Requests mit aktivierter 2FA
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({ is2FAEnabled: true, tempToken: "dummyToken" }),
        });

        render(<Page />);

        // Eingeben eines Benutzernamens und Passworts
        userEvent.type(screen.getByLabelText(/Username/i), "testuser");
        userEvent.type(screen.getByLabelText(/Password/i), "Test1234!");

        const loginButton = screen.getByText(/Login/);
        userEvent.click(loginButton);

        // Überprüfen, ob das 2FA-Formular angezeigt wird
        await waitFor(() => expect(screen.getByText(/A code has been sent to you/)).toBeInTheDocument());
    });

    test("successful 2FA verification redirects to dashboard", async () => {
        // Mocken des 2FA-Verifizierungs-Requests
        global.fetch = jest.fn().mockResolvedValueOnce({
            ok: true,
            json: jest.fn().mockResolvedValueOnce({}),
        });

        render(<Page />);

        // Simulieren des 2FA-Formulars
        userEvent.type(screen.getByLabelText(/Code/i), "123456");

        const verifyButton = screen.getByText(/Verify/);
        userEvent.click(verifyButton);

        // Überprüfen, ob der Benutzer zum Dashboard weitergeleitet wird
        await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/dashboard"));
    });
});
