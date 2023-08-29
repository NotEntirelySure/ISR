import React, { useState, useEffect, useRef } from 'react';
import {
  Checkbox,
  Header,
  HeaderContainer,
  HeaderName,
  HeaderMenuButton,
  HeaderGlobalBar,
  HeaderGlobalAction,
  InlineLoading,
  ListItem,
  Modal,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
  SkipToContent,
  UnorderedList
} from '@carbon/react';
import {
  Building,
  Certificate,
  ChartHistogram,
  Dashboard,
  Idea,
  User,
  UserAdmin,
  UserAvatar,
  Logout,
  Rocket,
  ServerProxy,
  WarningHex,
  Wikis
} from '@carbon/react/icons';
import { Link } from 'react-router-dom';

export default function AdminGlobalHeader(props) {
  
  const setupAck = useRef(); 

  const [isSmallWindow, setIsSmallWindow] = useState(false);
  const [modalSetupOpen, setModalSetupOpen] = useState(false);
  const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
  const [modalSetupExeOpen, setModalSetupExeOpen] = useState(false);
  const [confirmDisabled, setConfirmDisabled] = useState(true);
  const [setupCloseButtonDisabled, setSetupCloseButtonDisabled] = useState(true);
  const [voteStatus, setVoteStatus] = useState("inactive");
  const [voteDescription, setVoteDescription] = useState('waiting...');
  const [ideaStatus, setIdeaStatus] = useState('inactive...');
  const [ideaDescription, setIdeaDescription] = useState('waiting...');
  const [userStatus, setUserStatus] = useState('inactive');
  const [userDescription, setUserDescription] = useState('waiting...');
  const [logStatus, setLogStatus] = useState('inactive');
  const [logDescription, setLogDescription] = useState('waiting...');
  const [menuItemActiveStatus, setMenuItemActiveStatus] = useState({
    "votedashboard":false,
    "ideasadmin":false,
    "useradmin":false,
    "connections":false,
    "votesadmin":false,
    "statistics":false,
    "officesadmin":false,
    "domainsadmin":false
  })
  
  useEffect(() => {
    handleWindowResize();
    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  },[])

  useEffect(() => {HandleActiveMenuItem(props.activePage)},[props.active]);
  
  function handleWindowResize() {
    if (window.innerWidth <1000) setIsSmallWindow(true);
    else {setIsSmallWindow(false);}
  }

  function HandleLogout() {
    localStorage.removeItem("adminjwt");
    if (!localStorage.getItem("adminjwt")) alert("You have been successfully logged out.")
  };
  
  function HandleActiveMenuItem(activePage) {
    const activeObj = {...menuItemActiveStatus};
    for (let key in activeObj) {
      if (activeObj.hasOwnProperty(key)) activeObj[key] = key === activePage;
    }
    setMenuItemActiveStatus(activeObj);
  };

  async function initSetup() {
    if (!setupCloseButtonDisabled) setSetupCloseButtonDisabled(true);
    //Delete all votes
    setVoteStatus("active");
    setVoteDescription("Running...");

    const deleteVotesReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/votes/reset/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteVotesRes = await deleteVotesReq.json();
    switch (deleteVotesRes.result) {
      case 200:
        setVoteStatus("finished");
        setVoteDescription("Done");
        break;
      case 500:
        setVoteStatus("error");
        setVoteDescription("an error was encountreded deleting votes.");
        break;
      default: 
        setVoteStatus("error");
        setVoteDescription("an unknown was encountreded deleting votes.");
    }
    //Remove all ideas
    setIdeaStatus("active");
    setIdeaDescription("Running...");
    const deleteIdeasReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/ideas/reset/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteIdeasRes = await deleteIdeasReq.json();
    switch (deleteIdeasRes.result) {
      case 200:
        setIdeaStatus("finished");
        setIdeaDescription("Done");
        break;
      case 500:
        setIdeaStatus("error");
        setIdeaDescription("an error was encountreded deleting ideas.");
        break;
      default: 
        setVoteStatus("error");
        setVoteDescription("an unknown was encountreded deleting votes.");
    }
    //Delete all users
    setUserStatus("active");
    setUserDescription("Running...");
  
    const deleteUserReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/participants/reset/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteUserRes = await deleteUserReq.json();
    switch (deleteUserRes.result) {
      case 200:
        setUserStatus("finished");
        setUserDescription("Done");
        break;
      case 500:
        setUserStatus("error");
        setUserDescription("an error was encountreded deleting participants.");
        break;
      default: 
        setVoteStatus("error");
        setVoteDescription("an unknown was encountreded deleting votes.");
    }
    //Clear change log
    setLogStatus("active");
    setLogDescription("Running...");
    const deleteLogReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/votes/resetlogs/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteLogRes = await deleteLogReq.json();
    switch (deleteLogRes.result) {
      case 200:
        setLogStatus("finished");
        setLogDescription("Done");
        break;
      case 500:
        setLogStatus("error");
        setLogDescription("an error was encountered clearing the change log.");
        break;
      default:
        setVoteStatus("error");
        setVoteDescription("an unknown was encountreded deleting votes.");
    }

    setSetupCloseButtonDisabled(false);
  }

  return (
    <>
      <Modal
        id='initSetup'
        size='sm'
        modalHeading='Initial Setup'
        primaryButtonText="Execute"
        secondaryButtonText="Cancel"
        onRequestClose={() => setModalSetupOpen(false)}
        onRequestSubmit={() => setModalConfirmOpen(true)}
        zindex={1}
        open={modalSetupOpen}
        children={
          <>
            <p>
              The initial setup option is used to prepare the voting system for a
              new ISR session. Only use this option when preparing the system
              for a new ISR voting session. 
            </p>
            <br/>
            <div style={{display:'flex'}}>
              <WarningHex color="red" size={48}/>
              <p style={{marginLeft:'2%', color:'red'}}>
                WARNING: Do not use this Initial Setup option on an in progress ISR voting session.
                IT WILL DELETE ALL VOTING DATA!
              </p>
            </div>
            <br/>
            <p>Initial setup will perform the following functions:</p>
            <div style={{marginLeft:'5%'}}>
            <UnorderedList>
              <ListItem>Delete all votes</ListItem>
              <ListItem>Delete all ideas</ListItem>
              <ListItem>Remove all participants</ListItem>
              <ListItem>Clear the change log</ListItem>
            </UnorderedList>
            </div>
          </>
        }
      />
        
      <Modal
        danger
        size='sm'
        modalHeading='Initial Setup Confirm Execute'
        primaryButtonText="Confirm"
        primaryButtonDisabled={confirmDisabled}
        secondaryButtonText="Cancel"
        zindex={2}
        open={modalConfirmOpen}
        onRequestClose={() => {
          setModalSetupOpen(false);
          setModalConfirmOpen(false);
          setConfirmDisabled(true);
          setupAck.current.checked = false;
        }}
        onRequestSubmit={() => {
          setupAck.current.checked = false;
          setModalSetupExeOpen(true);
          setModalSetupOpen(false);
          setModalConfirmOpen(false);
          setConfirmDisabled(true);
          initSetup()
        }}
        children={
          <>
            <div style={{display:'flex'}}>
              <WarningHex color='red' size={48}/>
              <p style={{paddingLeft:'8px', color:'red'}}>Warning! Once executed, initial setup actions cannot be undone. Please confirm that you wish to take this action.</p>
            </div>
            <br/>
            <Checkbox
              id="setupAck"
              ref={setupAck}
              labelText="I understand these actions cannot be undone"
              onChange={() => {
                if (setupAck.current.checked) setConfirmDisabled(false);
                if (!setupAck.current.checked) setConfirmDisabled(true);
              }}
            />
          </>
        }
      />
      <Modal
        size='xs'
        modalHeading="Executing Initial Setup"
        open={modalSetupExeOpen}
        preventCloseOnClickOutside={true}
        primaryButtonText="Close"
        primaryButtonDisabled={setupCloseButtonDisabled}
        onRequestClose={() => setModalSetupExeOpen(false)}
        onRequestSubmit={() => setModalSetupExeOpen(false)}
        children={
          <div>
            <br/>
            <div style={{marginLeft:'5%'}}>
              <div style={{display:'flex'}}>
                <div>
                  <UnorderedList>
                    <ListItem>Delete all votes</ListItem>
                  </UnorderedList>
                </div>
                <div style={{marginTop:'-1%', marginLeft:'2%'}}>
                <InlineLoading
                  status={voteStatus}
                  iconDescription="Active loading indicator"
                  description={voteDescription}
                />
                </div>
              </div>
              <div style={{display:'flex'}}>  
                <div>
                  <UnorderedList>
                    <ListItem>Delete all ideas</ListItem>
                  </UnorderedList>
                </div>
                <div style={{marginTop:'-1%', marginLeft:'2%'}}>
                <InlineLoading
                  status={ideaStatus}
                  iconDescription="Active loading indicator"
                  description={ideaDescription}
                />
                </div>
              </div>
              <div style={{display:'flex'}}>
                <div>
                  <UnorderedList>
                    <ListItem>Remove all users</ListItem>
                  </UnorderedList>
                </div>
                <div style={{marginTop:'-1%', marginLeft:'2%'}}>
                <InlineLoading
                  status={userStatus}
                  iconDescription="Active loading indicator"
                  description={userDescription}
                />
                </div>
              </div>
              <div style={{display:'flex'}}>
                <div>
                  <UnorderedList>
                    <ListItem>Clear change log</ListItem>
                  </UnorderedList>
                </div>
                <div style={{marginTop:'-1%', marginLeft:'2%'}}>
                <InlineLoading
                  status={logStatus}
                  iconDescription="Active loading indicator"
                  description={logDescription}
                />
                </div>
              </div>
            </div>
          </div>
        }
      />
      <HeaderContainer render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <Header aria-label='admin header'>
          <SkipToContent />
          <HeaderMenuButton
            isCollapsible
            aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
            onClick={onClickSideNavExpand}
            isActive={isSideNavExpanded}
          />
          <HeaderName element={Link} to="/adminhome" prefix="ISR">Home</HeaderName>
          <HeaderGlobalBar>
            <HeaderGlobalAction isActive={isSideNavExpanded} tooltipAlignment="end" aria-label="User Avatar">
              <UserAvatar size={20}/>
            </HeaderGlobalAction>
          </HeaderGlobalBar>
        
          <SideNav
            isRail
            isChildOfHeader
            isFixedNav={isSmallWindow}
            expanded={isSideNavExpanded}
            aria-label="Side navigation">
            <SideNavItems>
              <SideNavLink
                onClick={() => setModalSetupOpen(true)}
                renderIcon={Rocket}
                element={Link}
                to=""
                children={"Initial Setup"}
              />
              <SideNavMenu renderIcon={UserAdmin} title="Admin Pages">
                <SideNavMenuItem 
                  element={Link}
                  to="/useradmin"
                  isActive={menuItemActiveStatus.useradmin}
                  children={<><User/> User Administration</>}
                />
                <SideNavMenuItem
                  element={Link}
                  to="/votesadmin"
                  isActive={menuItemActiveStatus.votesadmin}
                  children={<><Certificate/> Vote Administration</>}  
                />
                <SideNavMenuItem
                  element={Link}
                  to="/officesadmin"
                  isActive={menuItemActiveStatus.officesadmin}
                  children={<><Building/> Office Administration</>}
                />
                <SideNavMenuItem
                  element={Link}
                  to="/domainsadmin"
                  isActive={menuItemActiveStatus.domainsadmin}
                  children={<><Wikis/> Domain Administration</>}
                />
                <SideNavMenuItem
                  element={Link}
                  to="/ideasadmin"
                  isActive={menuItemActiveStatus.ideasadmin}
                  children={<><Idea/> Idea Administration</>}
                />
                <SideNavMenuItem
                  element={Link}
                  to="/connections"
                  isActive={menuItemActiveStatus.connections}
                  children={<><ServerProxy/> Server Connections</>}
                />
              </SideNavMenu>
              <SideNavLink
                renderIcon={Dashboard}
                isActive={menuItemActiveStatus.votedashboard}
                element={Link}
                to="/votedashboard"
                children={"Vote Dashboard"}
              />
              <SideNavLink
                renderIcon={ChartHistogram}
                isActive={menuItemActiveStatus.statistics}
                element={Link}
                to="/statistics"
                children={"Statistics"}
              />
              <SideNavLink
                renderIcon={Logout}
                element={Link}
                to="/"
                onClick={() => HandleLogout()}
                children={"Logout"}
              />
            </SideNavItems>
          </SideNav>
        </Header>
        )}
      />
    </>
  );
};