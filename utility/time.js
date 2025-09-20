
export const getHour = ()=>{
     const oraItaliana = new Date().toLocaleTimeString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    return oraItaliana
}

  