import { Server } from 'socket.io';
import { botOptions } from './config.js';
import { instancesToken, instances } from './index.js';
import StatsMonitor, { getALLTOKENS } from './utility/statsMonitor.js';
import { appendToFile } from './loggerWrite.js';
// instances Mappa per memorizzare le istanze di TokenMonitor

let io = null;

// Attacco socket.io al server http
export const initSocket = (server) => {
    console.log("🔔 Inizializzo socket.io");
    io = new Server(server, {
        cors: { origin: "*" }
    });

    io.on('connection', (socket) => {

        console.log('🔌 Nuovo client connesso:', socket.id);
        //  socketVar=socket;
        socket.on('clientMessage', (data) => {
            console.log('📩 Messaggio dal client:', data);
        });

        socket.emit('message', 'Benvenuto Nello SrokkoServer!');


    });//fine io.on connection

}//fine initSocket

export const sendMessageToClient = (type = 'newToken', message, data) => {
  
    if(type==='event'){
        appendToFile(`[EVENT] Messaggio: ${message}`, data);
        
    }
    //  appendToFile(`[SOCKETIO] Tipo: ${type} - Messaggio: ${JSON.stringify(message)}`);
    if (io) {
        io.emit(type, message);
        //console.log('📤 Messaggio inviato al client:', message);
    } else {
        // console.log('⚠️ Nessun client connesso.');
    }
};

setInterval(() => {
    let contToken = [];
    let cont = [];
    let setInvio = false;
    if (instancesToken && instancesToken.size > 0) {
        //.  DA SISTEMARE ,FARE UN SOLO SEND...
        instancesToken.forEach((instance, key) => {
            let tmpToken = {
                name: instance.monitor.token?.name || "Unknown",
                symbol: instance.monitor.token?.symbol || "Unknown",
                token: instance.monitor.token,
                id: instance.id,
                marketCapSol: instance.marketCapSol,
                solInPool: instance.solInPool,

                LivePrice: instance.LivePrice,
                startPrice: instance.startPrice,
                buyPrice: instance.buyPrice,
                highPrice: instance.highPrice,

                solTrxNum: instance.solTrxNum,


                volumeNet: instance.volumeNet,
                time: instance.time,
                volume: instance.volume,
                strategy: instance.quickSell || instance.infoSniper,
                stats: { speedLiq: instance.speedLiq, liqDrop: instance.liqDrop, liqTrend: instance.trend, tradesPerSec: instance.tradesPerSec, tradesPerMin: instance.tradesPerMin, tokenLifeSec: instance.monitor.lifeTokenSec, volatility: instance.volatility },
            }
            // contToken.push(tmpToken)
            // setInvio=true;
            sendMessageToClient('tokenLogger', tmpToken)//`NumTrx:${instance.solTrxNumMonitor} Volume:${instance.volume} SOL VolumeNet:${instance.volumeNet} SOL Price:${instance.LivePrice} `);


        })//fine ciclo foreach

    }

    if (instances && instances.size > 0) {

        instances.forEach((instance, key) => {
            //console.log(`🔄 Inviando aggiornamento per il token ${key} al client.`);
            if (!instance.tradeMonitor) {
                setInvio = false;
                return
            }
            let tmp = {
                name: instance.token?.name || "Unknown",
                symbol: instance.token?.symbol || "Unknown",
                token: instance.token,
                id: instance.id,
                marketCapSol: instance.marketCapSol,

                LivePrice: instance.prez,
                solTrxNumMonitor: instance.solTrxNumMonitor,


                volumeNet: instance.solAmount,
                volume: instance.volume,
                time: instance.time,
                stats: { speedLiq: instance.speedLiq, liqDrop: instance.liqDrop, liqTrend: instance.trend, tradesPerSec: instance.tradesPerSec, tradesPerMin: instance.tradesPerMin, tokenLifeSec: instance.lifeTokenSec ,volatility: instance.volatility },

                trxArrayLength: instance.trxArray.length,
            }
            //cont.push(tmp)
            // setInvio=true;
            sendMessageToClient('tokenMonitor', tmp)//`NumTrx:${instance.solTrxNumMonitor} Volume:${instance.volume} SOL VolumeNet:${instance.volumeNet} SOL Price:${instance.LivePrice} `);
        });
    }


}, 2000);
let contStats = 0;
let totToken = 0;
let totWin = 0;
let totLose = 0;
let totPercent = 0;
let objj;

    let strategyy=[
        {strategy:'Bonk Strategy',cont:0,win:0,lose:0},
        {strategy:'BuyHigh Token',cont:0,win:0,lose:0},
        {strategy:'Indirizzo contratto trovato nella pagina',cont:0,win:0,lose:0},
        {strategy:'pagina Twitter',cont:0,win:0,lose:0},
        {strategy:'ChatGpt Token',cont:0,win:0,lose:0},
        {strategy:'💀 Sell Off Panic triggered',cont:0,win:0,lose:0},
        {strategy:'Trend Token!',cont:0,win:0,lose:0},
        {strategy:'Monitor Token',cont:0,win:0,lose:0},
    ];

setInterval(async () => {
    let data = {
        walletSol: botOptions.botCash
    }
    sendMessageToClient('wallet', data)//`NumTrx:${instance.solTrxNumMonitor} Volume:${instance.volume} SOL VolumeNet:${instance.volumeNet} SOL Price:${instance.LivePrice} `);
    let dataStats = getALLTOKENS();
   // console.log(`📊 Invio statistiche al client. Totale token monitorati: ${dataStats.size} `);


    if (dataStats.size > contStats) {
    let index = 0;
    //let settato=false;
    // Scorri la mappa per trovare l'elemento ,senza ridoppiarlo
    // all'indice contStats
    for (const [key, value] of dataStats) {
        if(value.length < 2 || value[1] === undefined){console.log('socketstat -elemento anora nn pronto-',value);break}
        if (index === contStats) {
            console.log('socketstat '+`$${key} -`,value); // Questo è l'elemento che stai cercando
            totToken++;
            totPercent = parseFloat(totPercent) + parseFloat(value[1]['gainPercent']);
            objj = value;
            let winOrLose = false;

            if (value[1]['winner']) {
                totWin++;
                winOrLose = true;
            } else {
                totLose++;
            }

            strategyy.forEach((stratObj) => {
                if (value[0].strategy.includes(stratObj.strategy)) {
                    stratObj.cont++;
                    if (winOrLose) {
                        stratObj.win++;
                    } else {
                        stratObj.lose++;
                    }
                }
            });
            contStats++;
           // break; // Esci dal ciclo dopo aver trovato l'elemento
        }
        index++;
    }
    //if(settato) contStats = dataStats.size;
}
    /*
    if(dataStats.size > contStats) {
        totToken++
        totPercent = parseFloat(totPercent) + parseFloat(dataStats[contStats][1]['gainPercent']);
        objj=dataStats[contStats];
        let winOrLose = false;
            if (dataStats[contStats][1]['winner']) {
                totWin++;
                winOrLose = true;
            } else {
                totLose++;
            }

        strategyy.forEach((stratObj) => {
                if (dataStats[contStats].strategy.includes(stratObj.strategy)) {
                   // instance.strategy = stratObj.strategy;
                    stratObj.cont++;
                    if (winOrLose) {
                        stratObj.win++;
                    } else {
                        stratObj.lose++;
                    }
                }
            });
        contStats=dataStats.size;
    }*/

    //STRATEGY instance.strategy
    const dataToSend = {
        totalTokens: totToken,
        totalWins: totWin,
        totalLosses: totLose,
        totalPercent: totPercent.toFixed(2),
        stats: objj,
        pumpToken: botOptions.pumpToken,
        bonkToken: botOptions.bonkToken,
        otherToken: botOptions.otherToken,
        strategyCount: strategyy,
        solpriceup: botOptions.solanaInfo.price,
        percent_change_1h: botOptions.solanaInfo.percent_change_1h,
        percent_change_24h: botOptions.solanaInfo.percent_change_24h.toFixed(2),
        fearAndGreed: botOptions.fearAndGreed,
        btc:botOptions.btcInfo
    };
 sendMessageToClient('stats', dataToSend);
}, 130000)
