import React, { useState, useEffect, useRef } from 'react'
import { w3cwebsocket } from "websocket";
import { Buffer } from 'buffer';
import { useNavigate } from 'react-router-dom';
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

export default function UserVotePage() {

  const voteData = useRef({"project":"","value":null});

  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentTheme, setCurrentTheme] = useState("white");
  const [themeValues, setThemeValues] = useState({
    headerColor:'#f4f4f4',
    tileColor:'#f4f4f4',
    shadowColor:'10px 10px 5px #d3d3d3'
  });
  const [connectionInfo, setConnectionInfo] = useState({
    status:"inactive",
    message:"",
    attempts:0,
    displayReconnect:'none'
  });
  const [voterInfo, setVoterInfo] = useState({
    id:"",
    title:"",
    firstName:"",
    lastName:"",
    office:""
  });
  const [modalInfo, setModalOpen] = useState({
    open:false,
    heading:"",
    message:""
  });
  const [notificationInfo, setNotificationInfo] = useState({
    open:true,
    count:0,
    kind:"success",
    title:"",
    message:"",
    data:{}
  });

  useEffect(() => Login(),[]);
  useEffect(() => ConnectWebSocket(),[voterInfo]);
  useEffect(() => ShowToast(),[notificationInfo])

  async function Login() {

    const token = localStorage.getItem("jwt");

    if (token === null) {
      this.setState({
        heading:"Not Registered",
        message:<><p>You must register before you are able to vote.</p></>,
        open:true
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
          setVoterInfo({
            id:voterInfoResponse.rows[0].participantid,
            title:voterInfoResponse.rows[0].participanttitle,
            firstName:voterInfoResponse.rows[0].participantfname,
            lastName:voterInfoResponse.rows[0].participantlname,
            office:voterInfoResponse.rows[0].officename,
          });
          setIsAuth(true)
          break;
        case 401: 
          setModalOpen({
            heading:"Not Registered",
            message:<><p>You must register before you are able to vote.</p></>,
            open:true
          });
          break;
        case 601:
          setModalOpen({
            heading:"Other Participant Logged In",
            message:<>
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
            open:true
          });
          break;
        case 602:
          setModalOpen({
            heading:"Session Expired",
            message:<><p>Your session has expired. Please visit the registration page to reregister.</p></>,
            open:true
          });
          break;
      };
    };
  };
  
  function ConnectWebSocket() {
    setConnectionInfo({
      status:"active",
      message:"Connecting...",
      displayReconnect:'none',
      attempts:0
    });

    client = new w3cwebsocket(`${process.env.REACT_APP_WEBSOCKET_BASE_URL}/${voterInfo.office}`);

    client.onopen = () => {
      setConnectionInfo({
        status:"active",
        message:"Connecting...",
        displayReconnect:'none',
        attempts:0
      });
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
      setProjects(objProjects);
    };

    client.onclose = () => {
      this.setState({
        connectionStatus:"error",
        connectionMessage:"Disconnected from server"
      })
      if (connectionInfo.attempts <= 2) {
        setTimeout(() => {
          console.log("attempt:",connectionInfo.attempts);
          setConnectionInfo({...connectionInfo, [attempts]: connectionInfo.attempts + 1});
          ConnectWebSocket();
        });
      }
      if (connectionInfo.attempts >= 3) {
        setConnectionInfo({
          status:"error",
          message:"Failed to connect to server",
          displayReconnect:"block",
          attempts:4
        })
      }
    }

    client.onerror = (event) => {
      console.log(event);
      setConnectionInfo({
        ...connectionInfo,
        ["status"]:"error",
        [message]:"Failed to connect to server"
      })
      console.log("the websocket server is down")
    }

  }

  async function SubmitVote(buttonSource) {

    /*the below "if" ensures that a value has been selected and that the source of the button click is from the same tile.
    This prevents instances where there are multiple tiles, someone selects a value from one tile, they click the
    "submit" button from a different tile, and it actually submits. Without this check, that behavior would be successful.*/

    if (voteData.current.value !== null && voteData.current.project === buttonSource) {
      let requestData = {
        "voterID":voterInfo.voterID,
        "projectID":voteData.current.project,
        "voteValue":voteData.current.value,
        "source":"user"
      };

      let voteButton = document.getElementById(`vote-button-${voteData.current.project}`);
      let loading = document.getElementById(`loading-${voteData.current.project}`);
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
          if (voteData.current.value === 0) {message = `Your abstain vote for idea ${voteData.current.project} was successfully submitted.`;}
          else {message = `Your vote of ${voteData.current.value} for idea ${voteData.current.project} was successfully submitted.`;}
  
          voteData.current = ({"project":"","value":null});
        
          setNotificationInfo({
            count:notificationInfo.count + 1,
            kind:"success",
            title:"Success!",
            message:message,
            data:{
              kind:"success",
              title:"Success!",
              message:message,
              timestamp: new Date().toLocaleString()
            }
          });
          client.send(JSON.stringify({
            sender:"client",
            office:voterInfo.office,
            msg: "voted"
          }));
        }
        if (voteRequest.status === 500 || voteRequest.status === 404) {
          if (voteData.current.value === 0) {message = `There was a problem submitting your abstain vote for idea ${voteData.current.project}.`;}
          else {message = `There was a problem submitting your vote of ${voteData.current.value} for idea ${voteData.current.project}`;}
          this.setState({
            count:notificationInfo.count + 1,
            kind:"error",
            title:`Error: ${voteRequest.status}`,
            message:message,
            data:{
              kind:"error",
              title:`Error: ${voteRequest.status}`,
              message:message,
              timestamp: new Date().toLocaleString()
            }
          });
        }
      }

      catch (err) {
        if (voteData.current.value === 0) {message = `There was a problem submitting your abstain vote for idea ${voteData.current.project}.`;}
        else {message = `There was a problem submitting your vote of ${voteData.current.value} for idea ${voteData.current.project}`;}
          this.setState({
            count:notificationInfo.count + 1,
            kind:"error",
            title:`Error: ${err.message}`,
            message:message,
            data:{
              kind:"error",
              title:`Error: ${err.message}`,
              message:message,
              timestamp: new Date().toLocaleString()
            }
          });
      }

      voteButton.style.display = 'block';
      loading.style.display = 'none';

    }
  }

  function BuildRadioButtons(projectID) {

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

  function ShowToast() {
    let slideout = document.getElementById('notification');
    slideout.classList.toggle('visible');
    //toggle the visibility back to hidden. If this doesn't happen, the next button click will not show the notification (it will take 2 clicks to show).
    setTimeout(() => slideout.classList.toggle('visible'), 5000);
}

function HandleThemeChange(selectedTheme) {
  setCurrentTheme(selectedTheme);
  switch (selectedTheme) {
    case "white":
      setThemeValues({
          headerColor:'#f4f4f4',
          tileColor:'#f4f4f4',
          shadowColor:'10px 10px 5px #d3d3d3'
        })
      break;
    case "g100":
      setThemeValues({
        headerColor:'#262626',
        tileColor:'#393939',
        shadowColor:'10px 10px 5px #6c6c6c'
      })
      break;
    default:
      setThemeValues({
        headerColor:'#f4f4f4',
        tileColor:'#f4f4f4',
        shadowColor:'10px 10px 5px #d3d3d3'
      })
  }

}

  return (
    <>
      <UserGlobalHeader
        onThemeChange={theme => HandleThemeChange(theme)}
        notificationActive={isAuth}
        isAuth={isAuth}
        notificationData={notificationInfo.data}
        userInfo={{
          "voterID":voterInfo.id,
          "title":voterInfo.title,
          "fname":voterInfo.firstName,
          "lname":voterInfo.lastName,
          "office":voterInfo.office
          }}
        />
      <Theme theme={currentTheme}>
      <Modal
        modalHeading={modalInfo.heading}
        open={modalInfo.open}
        acknowledgment="true"
        preventCloseOnClickOutside={true}
        primaryButtonText="Register"
        onRequestClose={() => navigate('/register')}
        onRequestSubmit={() => navigate('/register')}
      >
        {modalInfo.message}
      </Modal>
      <div id="notification">
        <ToastNotification
          className='bx--toast-notification'
          open={notificationInfo.open}
          key={notificationInfo.count}
          timeout={0}
          kind={notificationInfo.kind}
          lowContrast={false}
          role='alert'
          title={notificationInfo.title}
          subtitle={notificationInfo.message}
          iconDescription='Icon description (iconDescription)'
          statusIconDescription='describes the status icon'
          hideCloseButton={false}
          onCloseButtonClick={() => setNotificationInfo({...notificationInfo, [open]:false})}
        />
      </div>
      <div style={{minHeight:"100vh"}}>
        <div id='headerContainer' style={{backgroundColor:themeValues.headerColor}}>
          <div id='titleContainer'>
            <h1>Idea Voting</h1>
            <br/>
            <div id='userInfo'>
              <div>
                <img
                  id='user-icon'
                  src={`${process.env.PUBLIC_URL}/office_symbols/${voterInfo.office}.png`}
                  onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                  alt=''
                />
              </div>
              <div >
                <h4>{isAuth ? `${voterInfo.title} ${voterInfo.firstName} ${voterInfo.lastName} (${voterInfo.office})`:null}</h4>
              </div>
            </div>
          </div>
          <div style={{float:'right'}}>
            <div style={{display:'flex'}}>
              <div>
                <InlineLoading description={connectionInfo.message} status={connectionInfo.status}/>
              </div>
              <div>
                <button style={{display:connectionInfo.displayReconnect}} className='reconnectButton' onClick={() => ConnectWebSocket()}><Renew size={20}/></button>
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
              {projects.length === 0 ? <>
                <div 
                  className="tile"
                  style={{
                    backgroundColor:themeValues.tileColor,
                    boxShadow:themeValues.shadowColor
                    }}
                >
                  <br/>
                  <div>
                    <p>No ideas to vote on at this time.</p>
                  </div>
                  <br/>
                </div>
              </>:
                projects.map((projects, index) => {
                  return <>
                    <div
                      className="tile"
                      style={{
                        backgroundColor:themeValues.tileColor,
                        boxShadow:themeValues.shadowColor
                        }}
                    >
                      <div><p>{`${projects.projectID}: ${projects.projectDescription}`}</p></div>
                      <hr/>
                      <div className='highResContainer'>
                        <div>
                        <RadioButtonGroup
                          key={projects.projectID + index}
                          name={`radio-group-${projects.projectID}`}
                          onChange={(value) => voteData.current = {"project":projects.projectID,"value":value}}
                        >
                          {BuildRadioButtons(projects.projectID)}
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
                            onChange={(event) => voteData.current = {"project":projects.projectID,"value":event.selectedItem.value}}
                          />
                        </div>
                      </div>
                      <div style={{display:'flex', alignItems:'center'}}>
                        <div style={{padding:'1rem'}}>
                          <Button id={`vote-button-${projects.projectID}`} onClick={() => {SubmitVote(projects.projectID)}}>
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