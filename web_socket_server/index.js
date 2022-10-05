const webSocketsServerPort = 8000;
const webSocketServer = require('websocket').server;
const http = require('http');

// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
console.log('Websocket server listening on port 8000');


const wsServer = new webSocketServer({httpServer: server});

var adminConnection;
var clients = {};
var votingEnabledProjects = [];
var remainingVoters = [];

wsServer.on('request', function (request) {
  let userID = request.httpRequest.url.substring(1);
  console.log(`${(new Date())} Recieved a new connection from origin ${request.origin}.`);

  try {
    const connection = request.accept(null, request.origin);
    if (userID === "admin") {
      adminConnection = connection;
      console.log('connected admin');
    }
    if (userID !== "admin") {
      clients[userID] = connection;
      console.log(`new connection: ${userID} added to client list ${Object.getOwnPropertyNames(clients)}`);
      clients[userID].sendUTF(JSON.stringify(votingEnabledProjects))
    }
    connection.on('message', function(message) {
      let data = JSON.parse(message.utf8Data)
      if (data.sender === "admin") {
        switch (data.action) {
          case "getClients":
            let clientList = [];
            for(key in clients) {clientList.push({client:key, state:clients[key].state})}
            let response = {
              source:"getClients",
              payload:JSON.stringify(clientList)
            }
            adminConnection.sendUTF(JSON.stringify(response));
            break;
            
          case "getVotingEnabledProjects":
            adminConnection.sendUTF(JSON.stringify({
              source:"getVotingEnabledProjects",
              payload: JSON.stringify(votingEnabledProjects)
            }));
            break;
            
          case "getRemainingVoters": 
            adminConnection.sendUTF(JSON.stringify({
              source:"getRemainingVoters",
              payload: JSON.stringify(remainingVoters)
            }));
            console.log("sent voting enabled projcets");
            break;
          
          case "addProject":  
            votingEnabledProjects = [JSON.parse(data.payload)]
            if (data.source === "dashboard") {
              remainingVoters = Object.keys(clients);
              adminConnection.sendUTF(JSON.stringify({
                source:"addProject",
                payload: JSON.stringify(remainingVoters)
              }));
            }
            for(key in clients) {
              clients[key].sendUTF(JSON.stringify(votingEnabledProjects));
              console.log('sent Message');
            }
            break;
        
          case "removeProject":
            votingEnabledProjects = []
            adminConnection.sendUTF(JSON.stringify({
              source:"removeProject",
              payload: JSON.stringify(votingEnabledProjects)
            }));
            for (key in clients) {
              clients[key].sendUTF(JSON.stringify(votingEnabledProjects));
              console.log('sent Message');
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
        
          case "batchRemove":
          //this code is from the "removeProjects" case. It needs to be adapted for the bactchRemove 
          /*let projectExists = false;
            let payload = JSON.parse(data.payload);
            for (let i=0;i<votingEnabledProjects.length;i++) {
              if (payload.id === votingEnabledProjects[i].id) {
                projectExists = true;
                votingEnabledProjects.splice(i, 1);
              }
            }
            
            if (projectExists) {
              adminConnection.sendUTF(JSON.stringify({
                source:"removeProject",
                payload: JSON.stringify(votingEnabledProjects)
              }));
              for (key in clients) {
                clients[key].sendUTF(JSON.stringify(votingEnabledProjects));
                console.log('sent Message');
              }
            }
            console.log(data.action,data.payload);
            */
            break;
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
            adminConnection.sendUTF(JSON.stringify({
              source:"clientVoted",
              payload: JSON.stringify(remainingVoters)
            }));
            console.log('sent remaining voters to admin');
          }
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
  })
}
catch (err) {console.log(err);}
});