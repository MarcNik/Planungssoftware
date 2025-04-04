/// <reference types="cypress" />

describe("Login & Registration UI Tests", () => {
    beforeEach(() => {
        cy.visit("https://localhost:5001/");
    });

    it("should display login form", () => {
        cy.contains("Login");
        cy.get("input[type='text']").should("exist");
        cy.get("input[type='password']").should("exist");
        cy.get("button[type='submit']").contains("Login");
    });

    it("should show error on empty login submission", () => {
        cy.get("button[type='submit']").click();
        cy.contains("Please enter both username and password.");
    });

    it("should switch to registration form", () => {
        cy.contains("Don't have an account?").click();
        cy.contains("Register");
        cy.get("input[type='email']").should("exist");
    });

    it("should register a new user", () => {
        cy.contains("Don't have an account?").click();
        cy.get("input[type='text']").type("testuser");
        cy.get("input[type='email']").type("testuser@example.com");
        cy.get("input[type='password']").type("Test1234!");
        cy.get("button[type='submit']").contains("Register").click();
        cy.contains("Login successful! Redirecting...");
    });

    it("should login with valid credentials", () => {
        cy.get("input[type='text']").type("testuser");
        cy.get("input[type='password']").type("Test1234!");
        cy.get("button[type='submit']").click();
        cy.url().should("include", "/dashboard");
    });

    it("should handle 2FA input", () => {
        cy.get("input[type='text']").type("testuser");
        cy.get("input[type='password']").type("Test1234!");
        cy.get("button[type='submit']").click();
        cy.contains("A code has been sent to you");
        cy.get("input[type='text']").eq(1).type("123456");
        cy.get("button[type='submit']").click();
        cy.url().should("include", "/dashboard");
    });
});

