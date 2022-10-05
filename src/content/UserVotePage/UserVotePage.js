import React, { Component } from 'react'
import { w3cwebsocket } from "websocket";
import { Buffer } from 'buffer';
import {
  Accordion,
  AccordionItem,
  Button,
  Content,
  InlineLoading,
  Modal,
  RadioButton,
  RadioButtonGroup,
  Table,
  TableCell,
  TableBody,
  TableRow,
  TableContainer,
  ToastNotification,
  OrderedList,
  ListItem
} from 'carbon-components-react';
import { Renew20 } from '@carbon/icons-react';
import UserGlobalHeader from '../../components/UserGlobalHeader';
import { Navigate } from "react-router-dom";

var client;

class UserVotePage extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isAuth:false,
      connectionStatus:"inactive",
      connectionMessage: "",
      reconnectAttempts:0,
      reconnectButtonDisplay:"none",
      projects: [],
      voterID:"",
      title: "",
      firstName: "",
      lastName: "",
      office:"",
      modalOpen:false,
      modalHeading:"",
      modalMessage:"",
      redirect: false,
      notificationOpen: true,
      notificationCount:0,
      notificationKind:"success",
      notificationTitle:"",
      notificationMessage:"",
      notificationData:{},
    }
  }

  componentDidMount = async() => {

    const token = localStorage.getItem("jwt");

    if (token === null) {
      this.setState({
        modalHeading:"Not Registered",
        modalMessage:<><p>You must register before you are able to vote.</p></>,
        modalOpen:true
      })
    }

    if (token !== null) {

      const token = localStorage.getItem("jwt");
      const jwtRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/verifyjwt/${token}`, {mode:'cors'});
      const jwtResponse = await jwtRequest.json();

      switch (jwtResponse.status) {
        case 200:
          //extract participant id from JWT
          const voterID = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString('ascii')).participantid;
          const voterInfoRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getvoterinfo/${voterID}`, {mode:'cors'})
          const voterInfoResponse = await voterInfoRequest.json();
          if (voterInfoResponse.rowCount === 0) this.setState({modalOpen: true});
          if (voterInfoResponse.rowCount > 0) {
            const officeLoggedInReq = await fetch(`${process.env.REACT_APP_API_BASE_URL}/checkofficeloggedin/${voterInfoResponse.rows[0].participantoffice}`, {mode:'cors'});
            const officeLoggedInRes = await officeLoggedInReq.json();
            if (officeLoggedInRes.rowCount > 0) {
              let loggedInUsers = []
              //loop through the users from the office that have their login status as true. 
              for (let i=0;i<officeLoggedInRes.rowCount;i++) {loggedInUsers.push(officeLoggedInRes.rows[i].participantid);}
              if (loggedInUsers.includes(voterInfoResponse.rows[0].participantid)) {
                const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userlogin`, {
                  method:'POST',
                  mode:'cors',
                  headers:{'Content-Type':'application/json'},
                  body:`{"userId":"${voterInfoResponse.rows[0].participantid}"}`
                });
                const loginResponse = await loginRequest.json();
                if(loginResponse.error) this.setState({modalOpen: true})
                else {
                  this.setState({
                    voterID:voterInfoResponse.rows[0].participantid,
                    title:voterInfoResponse.rows[0].participanttitle,
                    firstName:voterInfoResponse.rows[0].participantfname,
                    lastName:voterInfoResponse.rows[0].participantlname,
                    office:voterInfoResponse.rows[0].participantoffice,
                    isAuth:true
                  }, this.connectWebSocket);
                }
              }
              if (!loggedInUsers.includes(voterInfoResponse.rows[0].participantid)) this.setState({
                modalHeading:"Other Participant Logged In",
                modalMessage:<>
                  <p>You have been registered in the system, however, another participant from {voterInfoResponse.rows[0].participantoffice} is currently logged in.</p>
                  <p>Only one participant from the same office may be logged in at a time. If you wish to vote in the ISR, you can do one of the following:</p>
                  <div style={{marginLeft:'5%'}}>
                    <OrderedList>
                      <ListItem>Contact the person from office {voterInfoResponse.rows[0].participantoffice} and ask them to logout.</ListItem>
                      <ListItem>Return to the registration page and register under a different office.</ListItem>
                      <ListItem>Contact the system administrator to manually log the participant, from {voterInfoResponse.rows[0].participantoffice}, out.</ListItem>
                    </OrderedList>
                  </div>
                </>,
                modalOpen: true});
            }
            //if the result is empty, it means no one is logged in. Log the user in.
            if (officeLoggedInRes.rowCount === 0) {
              const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userlogin`, {
                method:'POST',
                mode:'cors',
                headers:{'Content-Type':'application/json'},
                body:`{"userId":"${voterInfoResponse.rows[0].participantid}"}`
              });
              const loginResponse = await loginRequest.json();
              this.setState({
                voterID:voterInfoResponse.rows[0].participantid,
                title:voterInfoResponse.rows[0].participanttitle,
                firstName:voterInfoResponse.rows[0].participantfname,
                lastName:voterInfoResponse.rows[0].participantlname,
                office:voterInfoResponse.rows[0].participantoffice,
                isAuth:true
              }, this.connectWebSocket);
            }
          }
          break;
        
        case 401:
          this.setState({
            modalHeading:"Session Expired",
            modalMessage:<><p>Your session has expired. Please visit the registration page to reregister.</p></>,
            modalOpen:true
          });
          break;
        
        default: 
          this.setState({
            modalHeading:"Not Registered",
            modalMessage:<><p>You must register before you are able to vote.</p></>,
            modalOpen:true
          })
      }
    };
  }

  connectWebSocket = () => {
    this.setState({
      connectionStatus:"active",
      connectionMessage:"Connecting...",
      reconnectButtonDisplay:'none'
    });

    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/${this.state.office}`);

    client.onopen = () => {
      this.setState({
        connectionStatus:"finished",
        connectionMessage:"Connected to server",
        reconnectAttempts:0
      })
    };

    client.onmessage = (message) => {
      let data = JSON.parse(message.data);
      let objProjects = [];
      for (var i=0; i<data.length; i++) {
        objProjects.push( {
            projectID: data[i].id,
            projectDescription: data[i].description
        });
      }
      this.setState({projects: objProjects});
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

  SubmitVote = async(projectID) => {
    let buttonGroup = document.getElementsByName("radio-group-" + projectID);
    let voteValue;
    for (var i=0; i<buttonGroup.length; i++){
      if (buttonGroup[i].checked === true) {voteValue = buttonGroup[i].value};
    }

    if (voteValue !== undefined) {
      let requestData = {
        "voterID":this.state.voterID,
        "projectID":projectID,
        "office":this.state.office,
        "voteValue":voteValue,
        "source":"user"
      };

      let voteButton = document.getElementById(`vote-button-${projectID}`);
      let loading = document.getElementById(`loading-${projectID}`);
      voteButton.style.display = 'none';
      loading.style.display = 'block';
      let message;
      
      try {
        const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/submitvote`, {
          method:'POST',
          mode:'cors',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(requestData)
        })
        if (voteRequest.status === 200) {
          if (voteValue === "0") {message = `Your abstain vote for idea ${projectID} was successfully submitted.`;}
          else {message = `Your vote of ${voteValue} for idea ${projectID} was successfully submitted.`;}
  
          this.setState({
            notificationCount:this.state.notificationCount + 1,
            notificationKind:"success",
            notificationTitle:"Success!",
            notificationMessage:message,
            notificationData:{
              notificationKind:"success",
              notificationTitle:"Success!",
              notificationMessage:message,
              notificationTimestamp: new Date().toLocaleString()
            }
          }, this.ShowToast());
          client.send(JSON.stringify({
            sender:"client",
            office:this.state.office,
            msg: "voted"
          }));
        }
        if (voteRequest.status === 500 || voteRequest.status === 404) {
          if (voteValue === "0") {message = `There was a problem submitting your abstain vote for idea ${projectID}.`;}
          else {message = `There was a problem submitting your vote of ${voteValue} for idea ${projectID}`;}
          this.setState({
            notificationCount:this.state.notificationCount + 1,
            notificationKind:"error",
            notificationTitle:`Error: ${voteRequest.status}`,
            notificationMessage:message,
            notificationData:{
              notificationKind:"error",
              notificationTitle:`Error: ${voteRequest.status}`,
              notificationMessage:message,
              notificationTimestamp: new Date().toLocaleString()
            }
          }, this.ShowToast());
        }
      }

      catch (err) {
        if (voteValue === "0") {message = `There was a problem submitting your abstain vote for idea ${projectID}.`;}
        else {message = `There was a problem submitting your vote of ${voteValue} for idea ${projectID}`;}
          this.setState({
            notificationCount:this.state.notificationCount + 1,
            notificationKind:"error",
            notificationTitle:`Error: ${err.message}`,
            notificationMessage:message,
            notificationData:{
              notificationKind:"error",
              notificationTitle:`Error: ${err.message}`,
              notificationMessage:message,
              notificationTimestamp: new Date().toLocaleString()
            }
          }, this.ShowToast());
      }

      voteButton.style.display = 'block';
      loading.style.display = 'none';

    }
  }

  BuildRadioButtons = (projectID) => {

    let radioButtons = [];
    for (let i=0; i<11; i++) {
      if(i === 0) {
        radioButtons.push(
          <RadioButton
            labelText="abstain"
            value={i}
            id={`radio-${projectID + i}`}
          />
        )
      }
      else {
        radioButtons.push(
          <RadioButton
            labelText={i}
            value={i}
            id={`radio-${projectID + i}`}
          />
        )
      }
    }
    return radioButtons;
  }

  ShowToast = () => {
    let slideout = document.getElementById('notification');
    slideout.classList.toggle('visible');
    //toggle the visibility back to hidden. If this doesn't happen, the next button click will not show the notification (it will take 2 clicks to show).
    setTimeout(() => slideout.classList.toggle('visible'), 5000);
}

  render() {
    return (
      <>
      <UserGlobalHeader 
        notificationActive={this.state.isAuth}
        isAuth={this.state.isAuth}
        notificationData={this.state.notificationData}
        userInfo={{
          "voterID":this.state.voterID,
          "title":this.state.title,
          "fname":this.state.firstName,
          "lname":this.state.lastName,
          "office":this.state.office
          }}
        />
        <Modal
          modalHeading={this.state.modalHeading}
          open={this.state.modalOpen}
          acknowledgment="true"
          preventCloseOnClickOutside={true}
          primaryButtonText="Register"
          onRequestClose={() => this.setState({redirect:true})}
          onRequestSubmit={() => this.setState({redirect:true})}
        >
          {this.state.redirect ? <Navigate to='/register'/>:null}
          {this.state.modalMessage}
        </Modal>
        <div id="notification">
          <ToastNotification
            className='bx--toast-notification'
            open={this.state.notificationOpen}
            key={this.state.notificationCount}
            timeout={0}
            kind={this.state.notificationKind}
            lowContrast={false}
            role='alert'
            title={this.state.notificationTitle}
            subtitle={this.state.notificationMessage}
            iconDescription='Icon description (iconDescription)'
            statusIconDescription='describes the status icon'
            hideCloseButton={false}
            onCloseButtonClick={() => this.setState({notificationOpen:false})}
          />
        </div>
        <Content>
          <div id='headerContainer' style={{display:'flex'}}>
            <div id='titleContainer'>
              <h1>Idea Voting</h1>
              <br/>
              <div id='userInfo'>
                <div>
                  <img
                    id='user-icon'
                    src={`${process.env.PUBLIC_URL}/office_symbols/${this.state.office}.png`}
                    onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                    alt=''
                  />
                </div>
                <div >
                  <h4>{`${this.state.title} ${this.state.firstName} ${this.state.lastName} (${this.state.office})`}</h4>
                </div>
              </div>
            </div>
            <div style={{float:'right'}}>
              <div style={{display:'flex'}}>
                <div>
                  <InlineLoading description={this.state.connectionMessage} status={this.state.connectionStatus}/>
                </div>
                <div>
                  <button style={{display:this.state.reconnectButtonDisplay}} className='reconnectButton' onClick={() => this.connectWebSocket()}><Renew20/></button>
                </div>
              </div>
            </div>
          </div>
          <div>
            <Accordion>
              <AccordionItem open={false} title="Voting Criteria">
                <div id="votingCriteriaContainer">
                  <div>
                    <img id="votingCriteriaImage" src={`${process.env.PUBLIC_URL}/Voting_criteria.png`} alt='Voting Criteria'></img>
                  </div>
                </div>
              </AccordionItem>
            </Accordion>
          </div>
          <div id='tileContainer' style={{display:'flex'}}>
            {this.state.projects.length === 0 ? <><div className="tile"><br/><div><p>No ideas to vote on at this time.</p></div><br/></div></>:
              this.state.projects.map((projects, index) => {
                return <>
                  <div className="tile">
                    <div><p>{`${projects.projectID}: ${projects.projectDescription}`}</p></div>
                    <br/>
                    <br/>
                    <div style={{display:'flex'}}>
                      <div>
                        <TableContainer>
                          <Table useStaticWidth={true}>
                            <TableBody>
                              <TableRow key={String(projects.projectID)}>
                                <TableCell key={String(projects.projectID)}>
                                  <RadioButtonGroup key={projects.projectID + index} name={`radio-group-${projects.projectID}`}>
                                    {this.BuildRadioButtons(projects.projectID)}
                                  </RadioButtonGroup>
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </div>
                      <div>
                        <Button id={`vote-button-${projects.projectID}`} onClick={() => {this.SubmitVote(projects.projectID)}}>
                          Submit Vote
                        </Button>
                      </div>
                      <div id={`loading-${projects.projectID}`} style={{display:'none'}}>
                        <InlineLoading status="active" description="Submitting vote..."/>
                      </div>
                    </div>
                  </div>
                </>
              })
            }
          </div>
        </Content>
      </>
    );
  }
}

export default UserVotePage;