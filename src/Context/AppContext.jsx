import { createContext, useEffect, useState } from "react";
import { API_BASE_URL } from '../config/environment';

export const apiUrl = API_BASE_URL;

export const AppContext = createContext();

export default function AppProvider({ children }) {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [startDay, setStartDay] = useState(0);

    async function getUser() {
        try {
            const res = await fetch(`${apiUrl}/api/user`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                }
            });
            if (res.status === 401) {
                // Expired or revoked token: drop it so the app shows the login page
                localStorage.removeItem('token');
                setToken(null);
                return;
            }
            if (res.ok) setUser(await res.json());
        } catch {
            // Network error: keep the token, the next load retries
        }
    }

    useEffect(() => {
        if (token) {
            getUser();
        }
    }, [token]);

    return (
        <AppContext.Provider value={{ token, setToken, user, setUser, startDay, setStartDay }}>
            {children}
        </AppContext.Provider>
    );
}