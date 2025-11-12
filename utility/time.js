
export const getHour = ()=>{
     const oraItaliana = new Date().toLocaleTimeString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    return oraItaliana
}

export const getDate = ()=>{
    const dataItaliana = new Date().toLocaleDateString("it-IT", {
      timeZone: "Europe/Rome",
      month: "2-digit",
      day: "2-digit"
    });
    return dataItaliana
}

export const getDateTime = ()=>{
    return getDate() + ' ' + getHour();
}

  