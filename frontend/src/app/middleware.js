import { NextResponse } from "next/server";

export function middleware(req) {
    const token = req.cookies.get("authToken"); // Hole das Token aus Cookies

    // Wenn kein Token vorhanden ist, redirect zur Login-Seite
    if (!token) {
        return NextResponse.redirect("https://localhost:5001/");
    }

    // Zugriff erlauben
    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard"], // Nur für die geschützte Route
};
