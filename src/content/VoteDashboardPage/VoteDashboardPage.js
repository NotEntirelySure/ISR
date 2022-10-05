import React, { Component } from 'react'
import { w3cwebsocket } from "websocket";
import {
  Content,
  InlineLoading,
  Tile,
  Toggle,
  Pagination
} from 'carbon-components-react';
import { Renew20 } from '@carbon/icons-react';
import "@carbon/charts/styles.css";

var client;

class VoteDashboardPage extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      connectionMessage:"",
      connectionStatus:"inactive",
      projects:[],
      graphData: [],
      remainingVoters:[],
      voteData:[],
      totalItems:0,
      currentProject: {},
      votingEnabledProjects: [],
      reconnectAttempts:0,
      reconnectButtonDisplay:"none",
      toggleChecked:false
    }
  }
    
  componentDidMount = async() => {
    const projectsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/projects`, {mode:'cors'});
    const projectsResponse = await projectsRequest.json();

    let objProjects = [];  
    
    for (var i=0; i<projectsResponse.rowCount; i++) {
      objProjects.push({
        "projectID": projectsResponse.rows[i].projectid,
        "projectDescription": projectsResponse.rows[i].projectdescription,
        "projectDomain":projectsResponse.rows[i].projectdomainname,
        "projectDomainColor":projectsResponse.rows[i].projectdomaincolorhex
      })
    }
    this.setState({
      projects: objProjects,
      totalItems:projectsResponse.rowCount,
      currentProject: {
        "projectID":projectsResponse.rows[0].projectid,
        "projectDescription":projectsResponse.rows[0].projectdescription,
        "projectDomain":projectsResponse.rows[0].projectdomainname,
        "projectDomainColor":projectsResponse.rows[0].projectdomaincolorhex
      }
    });
    this.connectWebSocket();
  }
 
  connectWebSocket = () => {
    this.setState({
      connectionStatus:"active",
      connectionMessage:"Connecting...",
      reconnectButtonDisplay:"none"
    });
    
    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/admin`);

    client.onopen = () => {
      this.setState({
        connectionStatus:"finished",
        connectionMessage:"Connected to server",
        reconnectAttempts:0
      })

      client.send(JSON.stringify({
        sender:"admin",
        action: "getVotingEnabledProjects",
      }))
    };
    
    client.onmessage = (message) => {
      const messageData = JSON.parse(message.data);
      let payload;
      let votingProjects = [];
      switch (messageData.source) {

        case "getVotingEnabledProjects":
          payload = JSON.parse(messageData.payload);
          for (let i=0; i<payload.length;i++) {votingProjects.push({projectID:payload[i].id})}
          this.setState({votingEnabledProjects: votingProjects});
          break;
        
        case "getRemainingVoters":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) this.setState({remainingVoters: JSON.parse(messageData.payload)});
          break;
        
        case "addProject":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) this.setState({remainingVoters: JSON.parse(messageData.payload)});
          break;

        case "removeProject":
          payload = JSON.parse(messageData.payload);
          if (payload.length > 0) {
            payload = JSON.parse(messageData.payload);
            for (let i=0; i<payload.length;i++) {votingProjects.push({projectID:payload[i].id})}
            this.setState({votingEnabledProjects: votingProjects});
          }
          break;

        case "clientVoted":
          this.setState({remainingVoters: JSON.parse(messageData.payload)})
          break;
      }
    };
    
    client.onclose = () => {
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Disconnected from server"
      })
      if (this.state.reconnectAttempts <= 2) {
        this.setState({reconnectAttempts: this.state.reconnectAttempts + 1}, () => {
          console.log("attempt:",this.state.reconnectAttempts)
          setTimeout(() => {this.connectWebSocket()}, 1500);
        })
      }
      if (this.state.reconnectAttempts >= 3) {
        this.setState({
          connectionStatus:"error",
          connectionMessage:"Failed to connect to server",
          reconnectButtonDisplay:"block"
        })
      }
    }

    client.onerror = (event) => {
      console.log(event);
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Failed to connect to server"
      },console.log("the websocket server is down"))
    }
  }

  HandlePageChange = (pageNumber) => {

    if (this.state.toggleChecked) {
      this.setState({toggleChecked:false})
      client.send(JSON.stringify({
        sender:"admin",
        source:"dashboard",
        action: "removeProject",
        payload: `{"id":"${this.state.currentProject.projectID}","description":"${this.state.currentProject.projectDescription}"}`
      }));
    }
    let index = pageNumber - 1; 
    this.setState({
      currentProject:{
        "projectID":this.state.projects[index].projectID,
        "projectDescription":this.state.projects[index].projectDescription,
        "projectDomain":this.state.projects[index].projectDomain,
        "projectDomainColor":this.state.projects[index].projectDomainColor
      },
      remainingVoters:[]
      }, () => {
        for (let i=0;i<this.state.votingEnabledProjects.length; i++){
          if (this.state.votingEnabledProjects[i].projectID === this.state.currentProject.projectID) {
            client.send(JSON.stringify({
              sender:"admin",
              action: "getRemainingVoters"
            }))
          }
        }
    });
  }

  render() {
      return (
        <>
          <Content>
            <div  className="bx--grid bx--grid--full-width vote-dashboard-page">
              <div className='bx--row vote-dashboard-page__banner'>
                <div className="bx--offset-lg-1 bx--col-lg-8">
                  <h1 className="vote-dashboard-page__heading">Voting Dashboard</h1>             
                </div>
                <div className='bx--offset-lg-3 bx--col' style={{display:"flex",marginTop:'1%'}}>
                  <div>
                    <InlineLoading
                    style={{ marginLeft: '1rem'}}
                    description={this.state.connectionMessage}
                    status={this.state.connectionStatus}
                  />
                  </div>
                  <div>
                    <button style={{display:this.state.reconnectButtonDisplay}} className='reconnectButton' onClick={() => this.connectWebSocket()}><Renew20/></button>
                  </div>
                </div>
              </div>
              <div className='bx--row' style={{backgroundColor:this.state.currentProject.projectDomainColor, textAlign:'center'}}>
                <div className='bx--col'>
                  <p style={{fontWeight:'bold'}}>{this.state.currentProject.projectDomain}</p>
                </div>
              </div>
              <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r1'>
                <div className="bx--col ideaNameAndToggle">
                  <div>
                    <h1 style={{fontWeight:'bold'}}>{`${this.state.currentProject.projectID}: ${this.state.currentProject.projectDescription}`}</h1>
                  </div>
                  <div style={{paddingRight:"20%"}}>
                    <Toggle
                      labelText="Idea Voting"
                      size="sm"
                      labelA="Disabled"
                      labelB="Enabled"
                      checked={this.state.toggleChecked}
                      onToggle={(state) => {
                        this.setState({toggleChecked:state})
                        client.send(JSON.stringify({
                          sender:"admin",
                          source:"dashboard",
                          action: state ? "addProject":"removeProject",
                          payload: `{"id":"${this.state.currentProject.projectID}","description":"${this.state.currentProject.projectDescription}"}`
                        }));
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r2'>
                <div className="vote-dashboard-page-voter-list">
                  {this.state.remainingVoters.map(office => {
                    return <div key={office} className='officeTile'>
                      <Tile>
                        <div style={{textAlign:'center'}}>
                          <div id='office-icon-div'>
                            <img
                              className='office-icon'
                              src={`${process.env.PUBLIC_URL}/office_symbols/${office}.png`}
                              onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                              alt=''
                            />
                          </div>
                          <br/>
                          <div style={{textAlign:'center'}} id='office-name-div'>{office}</div>
                        </div>
                      </Tile>
                    </div>
                  })}
                </div>
              </div>
              <div className='bx--row bx--offset-lg-1 vote-dashboard-page__r3'>
                <div className='bx--col-lg-16 bx--offset-lg-12'>  
                  {this.state.remainingVoters.length > 0 ? <p>Remaining Voters: {this.state.remainingVoters.length}</p>:null}
                </div>
              </div>
            </div>
            <div className='vote-dashboard-page__r4'>
              <Pagination
                totalItems={this.state.totalItems}
                backwardText="Previous page"
                forwardText="Next page"
                pageSize={1}
                pageSizes={[1]}
                itemsPerPageText="Items per page"
                onChange={event => this.HandlePageChange(event.page)}
              />
            </div>
          </Content>
        </>
      )
  }
}
export default VoteDashboardPage;