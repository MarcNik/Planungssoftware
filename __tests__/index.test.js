const request = require("supertest");
const app = require("../backend/index");  // Hier importieren wir den Express-Server

describe("API Tests", () => {

    describe("POST /api/register", () => {
        it("should register a new user successfully", async () => {
            const response = await request(app)
                .post("/api/register")
                .send({
                    email: "test@example.com",
                    password: "password123",
                    username: "testuser",
                    is2FAEnabled: false
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("User registered successfully");
        });

        it("should return error if username already exists", async () => {
            // Angenommen, der Benutzer 'testuser' existiert bereits
            const response = await request(app)
                .post("/api/register")
                .send({
                    email: "another@example.com",
                    password: "password123",
                    username: "testuser",
                    is2FAEnabled: false
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Benutzername existiert bereits.");
        });

        it("should return error if email already exists", async () => {
            // Angenommen, die E-Mail existiert bereits
            const response = await request(app)
                .post("/api/register")
                .send({
                    email: "test@example.com",
                    password: "password123",
                    username: "newuser",
                    is2FAEnabled: false
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("E-Mail existiert bereits.");
        });
    });

    describe("POST /api/login", () => {
        it("should login successfully", async () => {
            const response = await request(app)
                .post("/api/login")
                .send({
                    username: "testuser",
                    password: "password123"
                });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe("Login successful");
        });

        it("should return error for incorrect username or password", async () => {
            const response = await request(app)
                .post("/api/login")
                .send({
                    username: "testuser",
                    password: "wrongpassword"
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Username or Password is wrong");
        });
    });

    describe("POST /api/add-appointment", () => {
        it("should add an appointment successfully", async () => {
            const response = await request(app)
                .post("/api/add-appointment")
                .send({
                    username: "testuser",
                    title: "Test Appointment",
                    description: "Test appointment description",
                    date: "2025-04-04",
                    fromDate: "2025-04-04",
                    toDate: "2025-04-05",
                    time: "12:00",
                    dateOption: "single",
                    todoItems: [],
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe("Appointment added successfully.");
        });

        it("should return error if required fields are missing", async () => {
            const response = await request(app)
                .post("/api/add-appointment")
                .send({
                    username: "testuser",
                    title: "Test Appointment"
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Required fields missing: username, title, date or fromDate");
        });
    });

    describe("POST /api/get-appointment", () => {
        it("should return user's appointments", async () => {
            const response = await request(app)
                .post("/api/get-appointment")
                .send({
                    username: "testuser"
                });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body.appointments)).toBe(true);
        });

        it("should return error if username is missing", async () => {
            const response = await request(app)
                .post("/api/get-appointment")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe("Username is required.");
        });
    });
});
