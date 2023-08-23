import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Header,
  HeaderContainer,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderMenuItem,
  HeaderName,
  HeaderNavigation,
  HeaderPanel,
  SideNav,
  SideNavItems,
  SideNavLink,
  SkipToContent,
  Switcher,
  SwitcherDivider,
  SwitcherItem,
  ToastNotification,
  Theme
} from '@carbon/react';
import { 
  Moon,
  Notification,
  NotificationNew, 
  NotificationFilled,
  Sun,
  UserAvatar,
  UserAvatarFilled
} from '@carbon/react/icons'

export default function UserGlobalHeader(props) {
  const navigate = useNavigate();
  const notificationRef = useRef();
  const userRef = useRef();
  
  const [userPanelOpen, setUserPanelOpen] = useState(false);
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [notificationIconActive, setNotificationIconActive] = useState(false);
  const [userAccountIconActive, setUserAccountIconActive] = useState(false);
  const [notificationList, setNotificationList] = useState([]);
  const [bellEmpty, setBellEmpty] = useState("block");
  const [bellNew, setBellNew] = useState("none");
  const [bellFilled, setBellFilled] = useState("none");
  const [userEmpty, setUserEmpty] = useState("block");
  const [userFilled, setUserFilled] = useState("none");
  const [themeSelection, setThemeSelection] = useState("white");
  const [themeIcon, setThemeIcon] = useState(<><Moon size={24}/></>);
  const [themeLabel, setThemeLabel] = useState("Switch to Dark Mode");

  useEffect(() => {if (notificationIconActive) setBellEmpty("block")},[]);
  useEffect(() => {
    if (props.notificationData && props.notificationData.source === "initialLoad") {
      setBellEmpty("none");
      setBellNew("block");
      setBellFilled("none");
      setNotificationList(props.notificationData.payload);
    };
    if (props.notificationData && props.notificationData.source === "user") {
      setBellEmpty("none");
      setBellNew("block");
      setBellFilled("none");
      setNotificationList(previousState => [props.notificationData.payload, ...previousState]);
    };
  },[props.notificationData]);

  function checkIfClickedOutside(event) {
    if (!notificationRef.current.contains(event.target)) {
      setNotificationPanelOpen(false);
      setNotificationIconActive(false);
      setBellEmpty("block");
      setBellNew("none")
      setBellFilled("none");
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };  
    
    if (!userRef.current.contains(event.target)) {
      setUserPanelOpen(false);
      setUserAccountIconActive(false);
      setUserEmpty("block");
      setUserFilled("none");
      document.removeEventListener("mousedown", checkIfClickedOutside);
    };
    if (event.target.ariaLabel === "logout") {
      document.removeEventListener("mousedown", checkIfClickedOutside);
      logout();
    }
  };

  function handleThemeChange() {
    if (themeSelection === "white") {
      setThemeIcon(<Sun size={24}/>);
      setThemeSelection('g100');
      setThemeLabel('Switch to Light Mode');
      props.onThemeChange("g100");
    }

    if (themeSelection === "g100") {
      setThemeIcon(<Moon size={24}/>);
      setThemeSelection('white');
      setThemeLabel('Switch to Dark Mode');
      props.onThemeChange("white");
    }
  }

  function handleNotificationClick() {
    if (notificationPanelOpen) {
      setNotificationPanelOpen(false);
      setNotificationIconActive(false);
      setUserAccountIconActive(false);
      setBellEmpty("block");
      setBellNew("none");
      setBellFilled("none");
    }
    if (!notificationPanelOpen) {
      setNotificationPanelOpen(true);
      setNotificationIconActive(true);
      setBellEmpty("none");
      setBellNew("none");
      setBellFilled("block");
      setUserAccountIconActive(false);
      setUserEmpty("block");
      setUserFilled("none");
      document.addEventListener("mousedown", checkIfClickedOutside);
    }
  }

  function handleUserAccountClick () {
    if (userPanelOpen) {
      setUserPanelOpen(false);
      setUserAccountIconActive(false);
      setNotificationIconActive(false);
      setUserEmpty("block");
      setUserFilled("none");
    }

    if (!userPanelOpen) {
      setUserPanelOpen(true);
      setNotificationIconActive(false);
      setUserAccountIconActive(true);
      setUserEmpty("none");
      setUserFilled("block");
      document.addEventListener("mousedown", checkIfClickedOutside);
    }
  }

  async function logout() {
    const logoutRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/logout`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "participantId":props.userInfo.voterID,
        "source":"participant",
        "token":localStorage.getItem('jwt')
      })
    });
    const logoutResponse = await logoutRequest.json();
    navigate('/');
  };

  return (
    <>
      <Theme theme={themeSelection}>
      <HeaderContainer render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <Header aria-label="ISRVotingSystem">
          <SkipToContent />
          <HeaderMenuButton
            aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
            onClick={onClickSideNavExpand}
            isActive={isSideNavExpanded}
          />
          <HeaderName element={Link} to="/" prefix="ISR">Home</HeaderName>
          <HeaderNavigation aria-label='navItems'>
            <HeaderMenuItem key='vote' element={Link} to="/vote">Vote</HeaderMenuItem>
            <HeaderMenuItem key='register' element={Link} to="/register">Register</HeaderMenuItem>
            <HeaderMenuItem key='results' element={Link} to="/results">Voting Results</HeaderMenuItem>
          </HeaderNavigation>
          <HeaderGlobalBar>
            {props.isAuth && ( 
              <>
                <HeaderGlobalAction
                  aria-label={themeLabel}
                  onClick={() => handleThemeChange()} 
                  children={themeIcon}
                />
                <HeaderGlobalAction
                  aria-label="Notifications"
                  isActive={notificationIconActive}
                  onClick={() => handleNotificationClick()}
                  children={
                    <>
                      <Notification size={20} display={bellEmpty}/>
                      <NotificationNew size={20} display={bellNew}/>
                      <NotificationFilled size={20} display={bellFilled}/>
                    </>
                  }
                />
                <HeaderGlobalAction
                  aria-label="User Account" 
                  isActive={userAccountIconActive}
                  onClick={() => {handleUserAccountClick()}}
                  children={
                    <>
                      <UserAvatar size={20} display={userEmpty}/>
                      <UserAvatarFilled size={20} display={userFilled}/>
                    </>
                  }
                />
              </>
            )}
            <HeaderPanel 
              aria-label='notification panel'
              ref={notificationRef}
              expanded={notificationPanelOpen}
              children={
                <div className='notificationPanel'>
                  {
                    notificationList.map((item, index) => (
                      <div style={{marginTop:'0.25rem'}}>
                        <ToastNotification
                          className='panelNotification'
                          key={`notification-${index}`}
                          timeout={0}
                          kind={item.kind}
                          lowContrast={false}
                          title={item.title}
                          subtitle={item.message}
                          statusIconDescription={item.kind}
                          hideCloseButton={true}
                          children={item.timestamp}
                        />
                      </div>
                    ))
                  }
                </div>
              }
            />
            <HeaderPanel
              aria-label='User Panel'
              className='userPanel' 
              ref={userRef}
              expanded={userPanelOpen}
              children={
                props.isAuth && (
                <>
                  <br/>
                  <Switcher aria-label='switcher'>  
                    <img
                      className='user-icon'
                      src={`${process.env.PUBLIC_URL}/office_symbols/${props.userInfo.office}.png`}
                      onError={err => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                      alt=''
                    />
                    <p>{props.userInfo.office}</p>
                    <SwitcherDivider/>
                    <p>Title: {props.userInfo.title}</p>
                    <p>First Name: {props.userInfo.fname}</p>
                    <p>Last Name: {props.userInfo.lname}</p>
                    <SwitcherDivider/>
                    <SwitcherItem 
                      aria-label='logout'
                      onClick={() => {logout()}}
                      children={'Logout'}
                    />
                  </Switcher>
                </>
              )}
            />
          </HeaderGlobalBar>
          <SideNav
            id="headersidenav"
            isPersistent={false}
            isChildOfHeader={true}
            expanded={isSideNavExpanded}
            aria-label="Side navigation"
            >
            <SideNavItems>
              <SideNavLink element={Link} to="/vote">Vote</SideNavLink>
              <SideNavLink element={Link} to="/register">Register</SideNavLink>
              <SideNavLink element={Link} to="/results">Voting Results</SideNavLink>
            </SideNavItems>
          </SideNav>
        </Header>
        )}
      />
      </Theme>
    </>
  );
};