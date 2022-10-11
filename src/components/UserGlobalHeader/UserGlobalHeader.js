import React, { Component, createRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
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

class UserGlobalHeader extends Component {
  
  constructor(props) {
      super(props)
      this.notificationRef = React.createRef()
      this.userRef = React.createRef();
      this.state = {
        redirect:false,
        userPanelOpen:false,
        userPanelActive:false,
        notificationPanelOpen:false,
        notificationIconActive:false,
        userAccountIconActive:false,
        notificationList:[],
        bellEmpty:"block",
        bellNew:"none",
        bellFilled:"none",
        userEmpty:"block",
        userFilled:"none",
        themeSelection:"white",
        themeIcon:<><Moon size={24}/></>,
        themeLabel:"Switch to Dark Mode"
      }
  }

  componentDidMount() {if (this.props.notificationActive) {this.setState({bellEmpty:"block"})}}
  componentDidUpdate (previousProps) {
    
    if (previousProps.notificationData !== this.props.notificationData) {
      this.setState(previousState => ({
        bellEmpty:"none",
        bellNew:"block",
        bellFilled:"none",
        notificationList:[...previousState.notificationList, this.props.notificationData]}));
    }
    if (localStorage.getItem("jwt")) {

    }
  }

  checkIfClickedOutside = (event) => {

    if (this.state.notificationPanelOpen && this.notificationRef.current && !this.notificationRef.current.contains(event.target)) {
      this.setState({
        notificationPanelOpen:false,
        notificationIconActive:false,
        bellEmpty:"block",
        bellNew:"none",
        bellFilled:"none"
      },document.removeEventListener("mousedown", this.checkIfClickedOutside))  
    }

    if (this.state.userPanelOpen && this.userRef.current && !this.userRef.current.contains(event.target)) {
      this.setState({
        userPanelOpen:false,
        userAccountIconActive:false,
        userEmpty:"block",
        userFilled:"none"
      },document.removeEventListener("mousedown", this.checkIfClickedOutside))  
    }
  }

  handleThemeChange = () => {
    if (this.state.themeSelection === "white") {
      this.setState({
        themeIcon:<Sun size={24}/>,
        themeSelection:'g100',
        themeLabel:'Switch to Light Mode'
      })
    this.props.onThemeChange("g100");
  }

    if (this.state.themeSelection === "g100") {
      this.setState({
        themeIcon:<Moon size={24}/>,
        themeSelection:'white',
        themeLabel:'Switch to Dark Mode'
      })
      this.props.onThemeChange("white");
    }
  }

  handleNotificationClick = () => {
    if (this.state.notificationPanelOpen) {
      this.setState({
        notificationPanelOpen:false,
        notificationIconActive:false,
        bellEmpty:"block",
        bellNew:"none",
        bellFilled:"none"
      })
    }
    if (!this.state.notificationPanelOpen) {
      this.setState({
        notificationPanelOpen:true,
        userAccountIconActive:false,
        notificationIconActive:true,
        bellEmpty:"none",
        bellNew:"none",
        bellFilled:"block",
        userEmpty:"block",
        userFilled:"none"
      })
      document.addEventListener("mousedown", this.checkIfClickedOutside);
    }
  }

  handleUserAccountClick = () => {
    if (this.state.userPanelOpen) {
      this.setState({
        userPanelOpen:false,
        userAccountIconActive:false,
        notificationIconActive:false,
        userEmpty:"block",
        userFilled:"none"
      })
    }

    if (!this.state.userPanelOpen) {
      this.setState({
        userPanelOpen:true,
        notificationIconActive:false,
        userAccountIconActive:true,
        userEmpty:"none",
        userFilled:"block"
      })
      document.addEventListener("mousedown", this.checkIfClickedOutside);
    }
  }

  logout = async() => {
    const logoutRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userlogout`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"voterId":"${this.props.userInfo.voterID}"}`
    })
    const logoutResponse = await logoutRequest.json();
    this.setState({redirect:true});
  }

  render () {
    return (
      <>
        {this.state.redirect ? <Navigate to='/'/>:null}
        <Theme theme={this.state.themeSelection}>
        <HeaderContainer render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header onClick={isSideNavExpanded === true ? onClickSideNavExpand : null} aria-label="ISRVotingSystem">
            <SkipToContent />
            <HeaderMenuButton
              aria-label="Open menu"
              onClick={onClickSideNavExpand}
              isActive={isSideNavExpanded}
              />
            <HeaderName element={Link} to="/" prefix="ISR">Home</HeaderName>
            <HeaderNavigation aria-label='navItems'>
              <HeaderMenuItem element={Link} to="/vote">Vote</HeaderMenuItem>
              <HeaderMenuItem element={Link} to="/register">Register</HeaderMenuItem>
            </HeaderNavigation>
            <HeaderGlobalBar>
              {this.props.isAuth ? 
                <>
                  <HeaderGlobalAction onClick={() => this.handleThemeChange()} aria-label={this.state.themeLabel}>
                    {this.state.themeIcon}
                  </HeaderGlobalAction>
                  <HeaderGlobalAction
                    aria-label="Notifications"
                    isActive={this.state.notificationIconActive}
                    onClick={() => {this.handleNotificationClick()}}
                    >
                    <Notification size={20} display={this.state.bellEmpty}/>
                    <NotificationNew size={20} display={this.state.bellNew}/>
                    <NotificationFilled size={20} display={this.state.bellFilled}/>
                  </HeaderGlobalAction>
                  <HeaderGlobalAction
                    aria-label="User Account" 
                    isActive={this.state.userAccountIconActive}
                    onClick={() => {this.handleUserAccountClick()}}
                    >
                    <UserAvatar size={20} display={this.state.userEmpty}/>
                    <UserAvatarFilled size={20} display={this.state.userFilled}/>
                    </HeaderGlobalAction>
                </>:null
              }
            <HeaderPanel aria-label='userPanel' className='userPanel' ref={this.userRef} expanded={this.state.userPanelOpen}>
              {this.props.isAuth ? 
                <>
                  <br/>
                  <Switcher>
                    <img
                      id='user-icon'
                      src={`${process.env.PUBLIC_URL}/office_symbols/${this.props.userInfo.office}.png`}
                      onError={(err) => err.currentTarget.src = `${process.env.PUBLIC_URL}/office_symbols/USCG.png`}
                      alt=''
                      />
                    <p>{this.props.userInfo.office}</p>
                    <SwitcherDivider/>
                    <p style={{}}>Title: {this.props.userInfo.title}</p>
                    <p>First Name: {this.props.userInfo.fname}</p>
                    <p>Last Name: {this.props.userInfo.lname}</p>
                    <SwitcherDivider/>
                    <SwitcherItem onClick={() => {this.logout()}}>Logout</SwitcherItem>
                  </Switcher>
                </>:null     
              }
            </HeaderPanel>
                <HeaderPanel 
                  aria-label='notificationPanel'
                  className='notificationPanel'
                  ref={this.notificationRef}
                  expanded={this.state.notificationPanelOpen}
                >
                
                  {[...this.state.notificationList].reverse().map((item, index) => {
                    return <>
                      <ToastNotification
                        className='panelNotification'
                        key={index}
                        timeout={0}
                        kind={item.notificationKind}
                        lowContrast={false}
                        title={item.notificationTitle}
                        subtitle={item.notificationMessage}
                        statusIconDescription={item.notificationKind}
                        hideCloseButton={true}
                        >
                        {item.notificationTimestamp}
                      </ToastNotification>
                    </>
                  })}
                </HeaderPanel>
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
              </SideNavItems>
            </SideNav>
          </Header>
          )}
          />
        </Theme>
      </>
      
    )
  };
}
export default UserGlobalHeader;
