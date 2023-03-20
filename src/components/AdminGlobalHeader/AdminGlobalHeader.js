import React, { Component } from 'react';
import {
  Button,
  Checkbox,
  ComposedModal,
  Header,
  HeaderContainer,
  HeaderName,
  HeaderMenuButton,
  HeaderGlobalBar,
  HeaderGlobalAction,
  InlineLoading,
  ListItem,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  SideNav,
  SideNavItems,
  SideNavLink,
  SideNavMenu,
  SideNavMenuItem,
  SkipToContent,
  UnorderedList
} from '@carbon/react';
import {
  ChartHistogram,
  Dashboard,
  UserAdmin,
  UserAvatar,
  Logout,
  Rocket,
  WarningHex
} from '@carbon/react/icons';
import { Link } from 'react-router-dom';

class AdminGlobalHeader extends Component {
  
  constructor(props) {
      super(props)
      this.state = {
        modalSetupOpen:false,
        modalConfirmOpen:false,
        modalSetupExeOpen:false,
        confirmDisabled:true,
        setupCloseButtonDisabled:true,
        voteStatus:"inactive",
        voteDescription:"waiting...",
        ideaStatus:"inactive",
        ideaDescription:"waiting...",
        userStatus:"inactive",
        userDescription:"waiting...",
        logStatus:"inactive",
        logDescription:"waiting..."
      }
  }
  
  HandleLogout = () => {
    localStorage.removeItem("adminjwt");
    if (!localStorage.getItem("adminjwt")) alert("You have been successfully logged out.")
  }
  
  initSetup = async() => {
    if (!this.state.setupCloseButton) this.setState({setupCloseButtonDisabled:true})
    //Delete all votes
    this.setState({
      voteStatus:"active",
      voteDescription:"Running..."
    })
    const deleteVotesReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/votes/reset/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteVotesRes = await deleteVotesReq.json();
    switch (deleteVotesRes.result) {
      case 200:
        this.setState({
          voteStatus:"finished",
          voteDescription:"Done"
        })
        break;
      case 500:
        this.setState({
          voteStatus:"error",
          voteDescription:"an error was encountreded deleting votes."
        })
        break;
    }
    //Remove all ideas
    this.setState({
      ideaStatus:"active",
      ideaDescription:"Running..."
    })
    const deleteIdeasReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/ideas/reset/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteIdeasRes = await deleteIdeasReq.json();
    switch (deleteIdeasRes.result) {
      case 200:
        this.setState({
          ideaStatus:"finished",
          ideaDescription:"Done"
        })
        break;
      case 500:
        this.setState({
          ideaStatus:"error",
          ideaDescription:"an error was encountreded deleting ideas."
        })
        break;
    }
    //Delete all users
    this.setState({
      userStatus:"active",
      userDescription:"Running..."
    })
    const deleteUserReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/participants/reset/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteUserRes = await deleteUserReq.json();
    switch (deleteUserRes.result) {
      case 200:
        this.setState({
          userStatus:"finished",
          userDescription:"Done"
        })
        break;
      case 500:
        this.setState({
          userStatus:"error",
          userDescription:"an error was encountreded deleting participants."
        })
        break;
    }
    //Clear change log
    this.setState({
      logStatus:"active",
      logDescription:"Running..."
    })
    const deleteLogReq = await fetch(
      `${process.env.REACT_APP_API_BASE_URL}/votes/resetlogs/${localStorage.getItem('adminjwt')}`,
      {mode:'cors', method:"DELETE"}
    );
    const deleteLogRes = await deleteLogReq.json();
    switch (deleteLogRes.result) {
      case 200:
        this.setState({
          logStatus:"finished",
          logDescription:"Done"
        })
        break;
      case 500:
        this.setState({
          logStatus:"error",
          logDescription:"an error was encountered clearing the change log."
        })
        break;
    }

    this.setState({setupCloseButtonDisabled:false})
  }

  render () {
    return (
      <>
      <Modal
        id='initSetup'
        modalHeading='Initial Setup'
        primaryButtonText="Execute"
        secondaryButtonText="Cancel"
        onRequestClose={() => {this.setState({modalSetupOpen:false})}}
        onRequestSubmit={() => {this.setState({modalConfirmOpen:true})}}
        zindex={1}
        open={this.state.modalSetupOpen}>
          <p>
            The initial setup option is used to prepare the voting system for a
            new ISR session. Only use this option when preparing the system
            for a new ISR voting session. 
          </p>
          <br/>
          <div style={{display:'flex'}}>
          <WarningHex size={32}/>
          <p style={{marginLeft:'2%', color:'red'}}>
            WARNING: Do not use this option on an in progress ISR voting session.
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
        </Modal>
        <Modal
          danger
          modalHeading='Initial Setup Confirm Execute'
          primaryButtonText="Confirm"
          primaryButtonDisabled={this.state.confirmDisabled}
          secondaryButtonText="Cancel"
          zindex={2}
          open={this.state.modalConfirmOpen}
          onRequestClose={() => {
            this.setState({
              modalSetupOpen:false,
              modalConfirmOpen:false,
              confirmDisabled:true
            });
            document.getElementById("setupAck").checked = false;
          }}
          onRequestSubmit={() => {
            document.getElementById("setupAck").checked = false;
            this.setState({
              modalSetupExeOpen:true,
              modalSetupOpen:false,
              modalConfirmOpen:false,
              confirmDisabled:true
            }, () => this.initSetup());
          }}
        >
          <div style={{display:'flex'}}>
            <WarningHex size={32}/>
            <p style={{paddingLeft:'8px'}}>Warning! Once executed, initial setup actions cannot be undone. Please confirm you that wish to take this action.</p>
          </div>
          <br/>
          <Checkbox
            id="setupAck"
            labelText="I understand these actions cannot be undone"
            onChange={() => {
              if (document.getElementById("setupAck").checked === true) {
                this.setState({confirmDisabled: false});
              }
              if (document.getElementById("setupAck").checked === false) {
                this.setState({confirmDisabled: true});
              }
            }}
          />
        </Modal>
        <ComposedModal 
          open={this.state.modalSetupExeOpen}
          preventCloseOnClickOutside={true}
        >
          <ModalHeader>
            <h4>Executing Initial Setup</h4>
          </ModalHeader>
          <ModalBody>
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
                    status={this.state.voteStatus}
                    iconDescription="Active loading indicator"
                    description={this.state.voteDescription}
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
                    status={this.state.ideaStatus}
                    iconDescription="Active loading indicator"
                    description={this.state.ideaDescription}
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
                    status={this.state.userStatus}
                    iconDescription="Active loading indicator"
                    description={this.state.userDescription}
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
                    status={this.state.logStatus}
                    iconDescription="Active loading indicator"
                    description={this.state.logDescription}
                  />
                  </div>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              disabled={this.state.setupCloseButtonDisabled}
              kind="primary"
              onClick={() => {this.setState({modalSetupExeOpen:false})}}>
              Close
            </Button>
          </ModalFooter> 
        </ComposedModal>
        <HeaderContainer render={({ isSideNavExpanded, onClickSideNavExpand }) => (
          <Header aria-label='admin header'>
            <SkipToContent />
            <HeaderMenuButton
              aria-label="Open menu"
              onClick={onClickSideNavExpand}
              isActive={isSideNavExpanded}
            />
            <HeaderName element={Link} to="/" prefix="ISR">Home</HeaderName>
            <HeaderGlobalBar>
              <HeaderGlobalAction isActive={isSideNavExpanded} tooltipAlignment="end" aria-label="User Avatar">
                <UserAvatar size={20}/>
              </HeaderGlobalAction>
            </HeaderGlobalBar>
          
            <SideNav
              isRail
              isChildOfHeader={true}
              expanded={isSideNavExpanded}
              aria-label="Side navigation">
              <SideNavItems>
              <SideNavLink onClick={() => this.setState({modalSetupOpen:true})} renderIcon={Rocket} element={Link} to="">Initial Setup</SideNavLink>
                <SideNavMenu renderIcon={UserAdmin} title="Admin Pages">
                  <SideNavMenuItem element={Link} to="/useradmin">
                    User Administration
                  </SideNavMenuItem>
                  <SideNavMenuItem element={Link} to="/votesadmin">
                    Vote Administration
                  </SideNavMenuItem>
                  <SideNavMenuItem element={Link} to="/officesadmin">
                    Office Administration
                  </SideNavMenuItem>
                  <SideNavMenuItem element={Link} to="/domainsadmin">
                    Domain Administration
                  </SideNavMenuItem>
                  <SideNavMenuItem element={Link} to="/ideasadmin">
                    Idea Administration
                  </SideNavMenuItem>
                  <SideNavMenuItem element={Link} to="/connections">
                    Server Connections
                  </SideNavMenuItem>
                </SideNavMenu>
                <SideNavLink renderIcon={Dashboard} element={Link} to="/votedashboard">Vote Dashboard</SideNavLink>
                <SideNavLink renderIcon={ChartHistogram} element={Link} to="/statistics">Statistics</SideNavLink>
                <SideNavLink renderIcon={Logout} element={Link} to="/" onClick={() => this.HandleLogout()}>Logout</SideNavLink>
              </SideNavItems>
            </SideNav>
          </Header>
          )}
        />
      </>
    )
  };
}
export default AdminGlobalHeader;
