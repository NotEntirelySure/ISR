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
  Theme,
  ToastNotification,
  OrderedList,
  ListItem,
  Dropdown
} from '@carbon/react';
import { Renew } from '@carbon/react/icons';
import UserGlobalHeader from '../../components/UserGlobalHeader';
import { Navigate } from "react-router-dom";

var client;

export default class UserVotePage extends Component {

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
      currentTheme:"white",
      themeValues:{
        headerColor:'#f4f4f4',
        tileColor:'#f4f4f4',
        shadowColor:'10px 10px 5px #d3d3d3'
      },
      showDropdown:"none",
      voteData:{"project":"","value":null}
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

      const loginRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userlogin`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({"jwt":token})
      });
      const loginResponse = await loginRequest.json();

      switch (loginResponse.code) {
        case 200:
          const voterInfoRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getvoterinfo/${localStorage.getItem("jwt")}`, {mode:'cors'})
          const voterInfoResponse = await voterInfoRequest.json();
          this.setState({
            voterID:voterInfoResponse.rows[0].participantid,
            title:voterInfoResponse.rows[0].participanttitle,
            firstName:voterInfoResponse.rows[0].participantfname,
            lastName:voterInfoResponse.rows[0].participantlname,
            office:voterInfoResponse.rows[0].officename,
            isAuth:true
          }, this.connectWebSocket);
          break;
        case 401: 
          this.setState({
            modalHeading:"Not Registered",
            modalMessage:<><p>You must register before you are able to vote.</p></>,
            modalOpen:true
          });
          break;
        case 601:
          this.setState({
            modalHeading:"Other Participant Logged In",
            modalMessage:<>
              <p>You have been registered in the system, however, another participant from your office is currently logged in.</p>
              <p>Only one participant from the same office may be logged in at a time. If you wish to vote in the ISR, you can do one of the following:</p>
              <div style={{marginLeft:'5%'}}>
                <OrderedList>
                  <ListItem>Contact the person from your office and ask them to logout.</ListItem>
                  <ListItem>Return to the registration page and register under a different office.</ListItem>
                  <ListItem>Contact the system administrator and ask them to log the other person out.</ListItem>
                </OrderedList>
              </div>
            </>,
            modalOpen:true
          });
          break;
        case 602:
          this.setState({
            modalHeading:"Session Expired",
            modalMessage:<><p>Your session has expired. Please visit the registration page to reregister.</p></>,
            modalOpen:true
          });
          break;
      };
    };
  };
  
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

  SubmitVote = async(buttonSource) => {

    /*the below "if" ensures that a value has been selected and that the source of the button click is from the same tile.
    This prevents instances where there are multiple tiles, someone selects a value from one tile, they click the
    "submit" button from a different tile, and it actually submits. Without this check, that behavior would be successful.*/

    if (this.state.voteData.value !== null && this.state.voteData.project === buttonSource) {
      let requestData = {
        "voterID":this.state.voterID,
        "projectID":this.state.voteData.project,
        "voteValue":this.state.voteData.value,
        "source":"user"
      };

      let voteButton = document.getElementById(`vote-button-${this.state.voteData.project}`);
      let loading = document.getElementById(`loading-${this.state.voteData.project}`);
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
          if (this.state.voteData.value === 0) {message = `Your abstain vote for idea ${this.state.voteData.project} was successfully submitted.`;}
          else {message = `Your vote of ${this.state.voteData.value} for idea ${this.state.voteData.project} was successfully submitted.`;}
  
          this.setState({
            voteData:{"project":"","value":null},
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
          if (this.state.voteData.value === 0) {message = `There was a problem submitting your abstain vote for idea ${this.state.voteData.project}.`;}
          else {message = `There was a problem submitting your vote of ${this.state.voteData.value} for idea ${this.state.voteData.project}`;}
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
        if (this.state.voteData.value === 0) {message = `There was a problem submitting your abstain vote for idea ${this.state.voteData.project}.`;}
        else {message = `There was a problem submitting your vote of ${this.state.voteData.value} for idea ${this.state.voteData.project}`;}
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
            key={`${projectID}-${i}`}
            labelText="abstain"
            value={i}
            id={`radio-${projectID + i}`}
          />
        )
      }
      else {
        radioButtons.push(
          <RadioButton
            key={`${projectID}-${i}`}
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

handleThemeChange = (selectedTheme) => {
  console.info(selectedTheme)
  switch (selectedTheme) {
    case "white":
      this.setState({
        currentTheme:selectedTheme,
        themeValues: {
          headerColor:'#f4f4f4',
          tileColor:'#f4f4f4',
          shadowColor:'10px 10px 5px #d3d3d3'
        }
      })
      break;
    case "g100":
      this.setState({
        currentTheme:selectedTheme,
        themeValues: {
          headerColor:'#262626',
          tileColor:'#393939',
          shadowColor:'10px 10px 5px #6c6c6c'
        }
      })
      break;
    default:
      this.setState({
        currentTheme:selectedTheme,
        themeValues: {
          headerColor:'#f4f4f4',
          tileColor:'#f4f4f4',
          shadowColor:'10px 10px 5px #d3d3d3'
        }
      })
  }

}

  render() {
    return (
      <>
        <UserGlobalHeader
          onThemeChange={theme => this.handleThemeChange(theme)}
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
        <Theme theme={this.state.currentTheme}>
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
        <div style={{minHeight:"100vh"}}>
          <div id='headerContainer' style={{backgroundColor:this.state.themeValues.headerColor}}>
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
                  <h4>{this.state.isAuth ? `${this.state.title} ${this.state.firstName} ${this.state.lastName} (${this.state.office})`:null}</h4>
                </div>
              </div>
            </div>
            <div style={{float:'right'}}>
              <div style={{display:'flex'}}>
                <div>
                  <InlineLoading description={this.state.connectionMessage} status={this.state.connectionStatus}/>
                </div>
                <div>
                  <button style={{display:this.state.reconnectButtonDisplay}} className='reconnectButton' onClick={() => this.connectWebSocket()}><Renew size={20}/></button>
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
            <Content>
              <div id='tileContainer'>
                {this.state.projects.length === 0 ? <>
                  <div 
                    className="tile"
                    style={{
                      backgroundColor:this.state.themeValues.tileColor,
                      boxShadow:this.state.themeValues.shadowColor
                      }}
                  >
                    <br/>
                    <div>
                      <p>No ideas to vote on at this time.</p>
                    </div>
                    <br/>
                  </div>
                </>:
                  this.state.projects.map((projects, index) => {
                    return <>
                      <div
                        className="tile"
                        style={{
                          backgroundColor:this.state.themeValues.tileColor,
                          boxShadow:this.state.themeValues.shadowColor
                          }}
                      >
                        <div><p>{`${projects.projectID}: ${projects.projectDescription}`}</p></div>
                        <hr/>
                        <div className='highResContainer'>
                          <div>
                          <RadioButtonGroup
                            key={projects.projectID + index}
                            name={`radio-group-${projects.projectID}`}
                            onChange={(value) => this.setState({voteData:{"project":projects.projectID,"value":value}})}
                          >
                            {this.BuildRadioButtons(projects.projectID)}
                          </RadioButtonGroup>  
                          </div>
                        </div>
                        <div className='lowResContainer'>
                          <div style={{padding:"0rem 1rem 0rem 1rem"}}>
                            <Dropdown
                              id="votedropdown"
                              titleText='Vote value'
                              label='Select'
                              items={[
                                { id: '0', value:0, text: 'Abstain' },
                                { id: '1', value:1, text: '1 - Impact low/none' },
                                { id: '2', value:2, text: '2 - Impact low/none' },
                                { id: '3', value:3, text: '3 - Low impact' },
                                { id: '4', value:4, text: '4 - Low impact' },
                                { id: '5', value:5, text: '5 - Medium impact' },
                                { id: '6', value:6, text: '6 - Medium impact' },
                                { id: '7', value:7, text: '7 - Medium impact' },
                                { id: '8', value:8, text: '8 - High impact' },
                                { id: '9', value:9, text: '9 - High impact' },
                                { id: '10', value:10, text: '10 - High impact' },
                              ]}
                              itemToString={(item) => (item ? item.text : '')}
                              onChange={
                                (event) => this.setState({
                                  voteData: {"project":projects.projectID,"value":event.selectedItem.value}
                                })
                              }
                            />
                          </div>
                        </div>
                        <div style={{display:'flex', alignItems:'center'}}>
                          <div style={{padding:'1rem'}}>
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
          </div>
        </Theme>
      </>
    );
  }
}