import React, { Component } from 'react'
import { w3cwebsocket } from "websocket";
import { 
    Button, 
    Content,
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
} from 'carbon-components-react';
import { Renew32, TrashCan32 } from '@carbon/icons-react';

const headers = [
  {key:'client', header:'Connected Users'},
  {key:'state', header:'Connection Status'},
  {key:'action', header:'Action'}
];
var client;

class AdminConnectionsPage extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      displaySkeleton: "block",
      displayTable:"none",
      connectionStatus:"",
      connectionMessage:"",
      clients:[]
    }
  }

  componentDidMount() {this.connectWebSocket()}
    
  connectWebSocket = () => {
    this.setState({
      connectionStatus:"active",
      connectionMessage:"Connecting..."
    });
    
    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/admin`);
    
    client.onopen = () => {
      this.setState({
        connectionStatus:"finished",
        connectionMessage:"Connected to server"
      })
      this.GetClients();
    };
    
    client.onmessage = (message) => {
      let messageData = JSON.parse(message.data);
      console.log(messageData);
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
                  renderIcon={TrashCan32}
                  iconDescription='Remove Connecton'
                  kind="danger"
                  onClick={() => this.RemoveClient(payload[i].client)}
                />
              </>
            })
          }
          this.setState({
            clients: clientList,
            displaySkeleton:"none",
            displayTable:"block"});
          break;
        }

    };
    
    client.onclose = () => {
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Disconnected from server"
      })
      console.log("connection closed");
    }

    client.onerror = (event) => {
      console.log(event);
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Failed to connect to server"
      })
    }
  }

  GetClients = () => {
    client.send(JSON.stringify({
      sender:"admin",
      action: "getClients",
    }))
  }

  RemoveClient = (clientToRemove) => {
    client.send(JSON.stringify({
      sender:"admin",
      action: "removeClient",
      payload: clientToRemove
    }))
  }

  render() {
    return (
      <>
        <Content>
          <div style={{display: `${this.state.displayTable}`}} className="bx--grid admin-offices-page">
            <div className='bx--row vote-dashboard-page__banner'>
              <div className="bx--offset-lg-1 bx--col-lg-8">
                <h1 className="vote-dashboard-page__heading">Websocket Connections</h1>
                <p>Displays a list of connections to the WebSocket server.</p>             
              </div>
              <div className='bx--offset-lg-3 bx--col' style={{display:"flex",marginTop:'1%'}}>
                <div>
                  <InlineLoading
                  style={{ marginLeft: '1rem'}}
                  description={this.state.connectionMessage}
                  status={this.state.connectionStatus}
                />
                </div>
              </div>
            </div>
            <div className="bx--row bx--offset-lg-1 admin-offices-page__r1" >
              <div className="bx--col-lg-15">
                <DataTable
                  rows={this.state.clients}
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
                          <Button renderIcon={Renew32} hasIconOnly iconDescription='Refresh' onClick={() => this.GetClients()} />
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
          <div style={{display: `${this.state.displaySkeleton}`}} className="bx--offset-lg-1 bx--col-lg-13">
            <DataTableSkeleton columnCount={3} headers={headers}/>
          </div>
        </Content>
      </>
    );
  }
}

export default AdminConnectionsPage;