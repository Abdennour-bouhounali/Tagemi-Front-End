import { createContext, useEffect, useState } from "react";
export const apiUrl = import.meta.env.VITE_API_URL;

export const AppContext = createContext();
export default function AppProvider({ children }) {

    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [startDay, setStartDay] = useState(0);





    async function getUser() {
        const res = await fetch(`${apiUrl}/api/user`, {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
        const data = await res.json();
        if (res.ok) {
            setUser(data);
        }
        // console.log(data);
    }


    useEffect(() => {
        if (token) {
            getUser();
        }
    }, [token])

    return <AppContext.Provider value={{ token, setToken, user, setUser, startDay, setStartDay }}>
        {children}
    </AppContext.Provider>
}