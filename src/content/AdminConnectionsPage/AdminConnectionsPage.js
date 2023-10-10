import React, { useState, useEffect } from 'react'
import { w3cwebsocket } from "websocket";
import { 
  Button, 
  DataTable,
  DataTableSkeleton,
  InlineLoading,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
} from '@carbon/react';
import { Renew, TrashCan } from '@carbon/react/icons';

const headers = [
  {key:'client', header:'Connected Users'},
  {key:'state', header:'Connection Status'},
  {key:'action', header:'Action'}
];
var client;

export default function AdminConnectionsPage() {

  const [displaySkeleton, setDisplaySkeleton] = useState('block');
  const [displayTable, setDisplayTable] = useState('none');
  const [connectionStatus, setConnectionStatus] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [clients, setClients] = useState([]);

  useEffect (() => {ConnectWebSocket()},[]);
  useEffect(() => {if (connectionStatus === "finished") GetClients();},[connectionStatus]);

  function ConnectWebSocket() {

    setConnectionStatus("active");
    setConnectionMessage("Connecting...");
    
    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/adminConn`);
    
    client.onopen = () => {
      setConnectionStatus("finished");
      setConnectionMessage("Connected to server");
    };
    
    client.onmessage = (message) => {
      let messageData = JSON.parse(message.data);
      switch (messageData.source) {
        case "getClients":
          let payload = JSON.parse(messageData.payload);
          let clientList = [];
          for (let i=0; i<payload.length;i++) {
            clientList.push({
              id:String(i),
              client:payload[i].client,
              state:payload[i].state,
              action:<>
                <Button 
                  hasIconOnly
                  size="md"
                  renderIcon={TrashCan}
                  iconDescription='Remove Connecton'
                  style={{color:'#DA1E28'}}
                  kind="primary--ghost"
                  onClick={() => RemoveClient(payload[i].client)}
                />
              </>
            })
          }
          setClients(clientList);
          setDisplaySkeleton("none");
          setDisplayTable("block");
          break;
        case "removeClient":
          GetClients();
          break;
        }

    };
    
    client.onclose = () => {
      setConnectionStatus("error");
      setConnectionMessage("Disconnected from server");
      console.log("connection closed");
    }

    client.onerror = (event) => {
      console.log(event);
      setConnectionStatus("error");
      setConnectionMessage("Failed to connect to server");
    }
  }

  function GetClients() {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        sender: "adminConn",
        action: "getClients",
      }));
    };
  };

  function RemoveClient(clientToRemove) {
    client.send(JSON.stringify({
      sender:"adminConn",
      action: "removeClient",
      payload: clientToRemove
    }))
  }

  return (
    <>
      <div style={{display: `${displayTable}`}} className="bx--grid adminPageBody">
        <div className='bx--row vote-dashboard-page__banner'>
          <div className="bx--offset-lg-1 bx--col-lg-8">
            <h1 className="vote-dashboard-page__heading">Websocket Connections</h1>
            <p>Displays a list of connections to the WebSocket server.</p>             
          </div>
          <div className='bx--offset-lg-3 bx--col' style={{display:"flex",marginTop:'1%'}}>
            <div>
              <InlineLoading
              style={{ marginLeft: '1rem'}}
              description={connectionMessage}
              status={connectionStatus}
            />
            </div>
          </div>
        </div>
        <div className="bx--row bx--offset-lg-1 admin-offices-page__r1" >
          <div className="bx--col-lg-15">
            <DataTable
              rows={clients}
              headers={headers}
              isSortable={true}
              render={({
                rows,
                headers,
                getHeaderProps,
                getRowProps,
                getTableProps,
                onInputChange
              }) => (
                <TableContainer>
                  <TableToolbar>
                      <TableToolbarContent>
                          <TableToolbarSearch onChange={onInputChange} />
                      </TableToolbarContent>
                      <Button renderIcon={Renew} hasIconOnly iconDescription='Refresh' onClick={() => GetClients()} />
                  </TableToolbar>
                  <Table {...getTableProps()}>
                <TableHead>
                  <TableRow>
                    {headers.map((header) => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>)
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id} {...getRowProps({ row })}>
                      {row.cells.map((cell) => (
                        <TableCell key={cell.id}>{cell.value}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                </TableContainer>
              )}
            />
          </div>
        </div>
      </div>
      <div style={{display: `${displaySkeleton}`}} className="bx--offset-lg-1 bx--col-lg-13">
        <DataTableSkeleton columnCount={3} headers={headers}/>
      </div>
    </>
  );
}