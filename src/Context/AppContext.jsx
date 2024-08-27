import { createContext, useEffect, useState } from "react";

export const AppContext = createContext();
export default function AppProvider({children}){

    const [token,setToken] = useState(localStorage.getItem('token'));
    const [user,setUser] = useState(null);
    const [startDay,setStartDay] = useState(0);
    const [displayAuth,setDisplayAuth] = useState(0);

    async function getstartDay(){
        const res = await fetch('/api/getstartDay');
        const data = await res.json();
        setStartDay(data);
    }

    async function getdisplayAuth(){
        const res = await fetch('/api/getdisplayAuth');
        const data = await res.json();
        setDisplayAuth(data);
    }

    async function getUser(){
        const res = await fetch('/api/user',{
            headers:{
                Authorization : `Bearer ${token}`,
            }
        })
        const data = await res.json();
        if(res.ok){
            setUser(data);
        }
        // console.log(data);
    }

    // useEffect(()=>{
    //     if(startDay){
    //         getstartDay();
    //         GetWaitingListBySpeciality(specialityId);
    //         getAppoitments();
    //     }
    // })

    useEffect(()=>{
        if(token){
            getUser();
            getstartDay();
            getdisplayAuth();
        }
    },[token])
    return <AppContext.Provider value={{token,setToken,user,setUser,startDay,setStartDay,displayAuth,setDisplayAuth}}>
        {children}
    </AppContext.Provider>
}