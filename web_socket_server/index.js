const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
console.log('Websocket server listening on port 8000');


const wsServer = new webSocketServer({httpServer: server});

var adminConnections = {};
var clients = {};
var resultsPageClients = {};
var votingEnabledProjects = [];
var remainingVoters = [];
var resultsData = {};

wsServer.on('request', function (request) {
  let userId = request.httpRequest.url.substring(1);
  console.log(`${(new Date())} Recieved a new connection from origin ${request.origin}.`);

  try {
    const connection = request.accept(null, request.origin);
    
    switch (userId) {
      case "adminDash":
        adminConnections[userId] = connection;
        console.log(`Admin dashboard page connected.`);
        break;
      case "adminConn":
        adminConnections[userId] = connection;
        console.log(`Admin connections page connected.`);
        break;
      case "adminStat":
        adminConnections[userId] = connection;
        console.log(`Admin statistics page connected.`);
        break;
      default:
        //checks whether the client is connecting to vote, or to view the results
        if (userId.split('-')[0] === "resultsPage") {
          resultsPageClients[userId] = connection;
          console.log(`new connection: ${userId} added to results client list ${Object.getOwnPropertyNames(resultsPageClients)}`);
          //send results to client on connection if there are any results to send
          if (resultsData !== undefined) resultsPageClients[userId].sendUTF(JSON.stringify({action:"publish",data:resultsData}));
        }
        else {
          clients[userId] = connection;
          console.log(`new connection: ${userId} added to voting client list ${Object.getOwnPropertyNames(clients)}`);
          clients[userId].sendUTF(JSON.stringify(votingEnabledProjects))
        }
    }
      
    connection.on('message', function(message) {
      const data = JSON.parse(message.utf8Data);

      if (data.sender === "adminStat") {
        resultsData = data;
        for(key in resultsPageClients) {
          resultsPageClients[key].sendUTF(JSON.stringify({action:"publish",data:resultsData}));
          console.log(`sent message to ${resultsPageClients[key]}`);
        }
      }

      if (data.sender === "adminConn") {
        switch (data.action) {
          case "getClients":
            let clientList = [];
            for(key in clients) {clientList.push({client:key, state:clients[key].state})}
            let response = {
              source:"getClients",
              payload:JSON.stringify(clientList)
            }
            adminConnections["adminConn"].sendUTF(JSON.stringify(response));
            break;
          case "removeClient":
            console.log(data.payload);
            delete clients[data.payload];
            console.log(`Removed ${data.payload} from voting client list.`)
            adminConnections["adminConn"].sendUTF(JSON.stringify({source:"removeClient"}))
            break;
        }
      }
      if (data.sender === "adminDash") {
        switch (data.action) {
          case "getVotingEnabledProjects":
            adminConnections["adminDash"].sendUTF(JSON.stringify({
              source:"getVotingEnabledProjects",
              payload: JSON.stringify(votingEnabledProjects)
            }));
            break;
            
          case "getRemainingVoters": 
            adminConnections["adminDash"].sendUTF(JSON.stringify({
              source:"getRemainingVoters",
              payload: JSON.stringify(remainingVoters)
            }));
            console.log("sent voting enabled projcets");
            break;
          
          case "addProject":  
            votingEnabledProjects = [JSON.parse(data.payload)]
            if (data.source === "dashboard") {
              remainingVoters = Object.keys(clients);
              adminConnections["adminDash"].sendUTF(JSON.stringify({
                source:"addProject",
                payload: JSON.stringify(remainingVoters)
              }));
            }
            for(key in clients) {
              clients[key].sendUTF(JSON.stringify(votingEnabledProjects));
              console.log('sent add project message');
            }
            break;
        
          case "removeProject":
            votingEnabledProjects = []
            adminConnections["adminDash"].sendUTF(JSON.stringify({
              source:"removeProject",
              payload: JSON.stringify(votingEnabledProjects)
            }));
            for (key in clients) {
              clients[key].sendUTF(JSON.stringify(votingEnabledProjects));
              console.log('sent remove project message');
            }
            break;

          case "removeClient":
            try {
              let clientToRemove = data.payload;
              clients[clientToRemove].close();
              delete clients[clientToRemove];
            }
            catch (err) {console.log(err);} 
            break;

          case "batchAdd":
            console.log(data.action,data.payload);
            break;
        
          case "batchRemove": break;
        }
      }
      if (data.sender === "client") {

        switch (data.msg) {
          case "voted":
            let voterExists = false;
            for (let i=0;i<remainingVoters.length;i++) {
              if (data.office === remainingVoters[i]) {
                voterExists = true;
                remainingVoters.splice(i, 1);
              }
            }
            console.log("voter exists: ",voterExists);
            if (voterExists) {
              adminConnections["adminDash"].sendUTF(JSON.stringify({
                source:"clientVoted",
                payload: JSON.stringify(remainingVoters)
              }));
              console.log('sent remaining voters to admin');
            }
            break;
          case "getResults":
            try{
              resultsPageClients[data.id].sendUTF(JSON.stringify({action:"publish",data:resultsData}));
            }
            catch (error) {console.log("error sending vote results to client ",error)}
            break;
        }
      }
    })

    connection.on("close", (event) => {

      console.log("client disconnected",event);
      for(key in clients) {
        if (clients[key].state === "closed") {
          //delete clients[key];
          console.log("connection closed: ",key);
        }
      }
      console.log("remaining clients: ",clients);
      for(key in resultsPageClients) {
        if (resultsPageClients[key].state === "closed") {
          delete resultsPageClients[key];
          console.log("connection closed: ",key);
        }
      }
      console.log("remaining clients: ",clients);
  })
}
catch (err) {console.log(err);}
});