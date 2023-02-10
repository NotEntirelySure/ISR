import React, { Component } from 'react'
import {
    Button,
    ComboBox,
    Content,
    Checkbox,
    DataTable,
    DataTableSkeleton,
    Modal,
    NumberInput,
    TableContainer,
    Table,
    TableHead,
    TableHeader,
    TableRow,
    TableBody,
    TableCell,
    TableToolbar,
    TableToolbarContent,
    TableToolbarSearch,
    TextArea,
    Loading
} from '@carbon/react';
import {
  Add,
  RecentlyViewed,
  RequestQuote,
  TrashCan,
  WarningHex
} from '@carbon/react/icons';

const headers = [
    {key:'voteID', header:'Vote ID'},
    {key:'projectID', header:'Project Number'},
    {key:'voter', header:'Voter'},
    {key:'office', header:'Office'},
    {key:'voteValue', header:'Vote Value'},
    {key:'voteTime', header:'Time of Vote'},
    {key:'modified', header:'Modified?'},
    {key:'action', header:'Action'}
];


class AdminVotesPage extends Component {

  constructor(props) {
    super(props)
    this.state = {
      votesList: [{
        id:'0',
        voteID:'-',
        projectID:'-',
        voter:'-',
        office: '-',
        voteValue:'-',
        action:'-'}],
      voteToAdd:{},
      voteToDelete: {
        voteID:"",
        projectID:"",
        voter:""
      },
      modalExistsOpen:false,
      modalAddOpen: false,
      modalEditOpen:false,
      modalDeleteOpen: false,
      modalDeleteAllOpen: false,
      modalHistoryOpen:false,
      modalErrorOpen:false,
      deleteAllDisabled: true,
      addIdInvalid:false,
      addDescriptionInvalid:false,
      addUserComboValue:null,
      addProjectComboValue:null,
      voteToEdit:{},
      displayTable: 'none',
      displaySkeleton: 'block',
      userComboInvalid:false,
      userList:[],
      projectList:[],
      voteHistory:[],
      projctComboInvalid:false,
      selectedProject:"",
      addValueInvalid:false,
      showHistoryContent:'none',
      showLoading:'flex',
      currentVoteHistory:0,
      errorInfo:{
        heading:'',
        message:''
      }
    }
  }

  componentDidMount() {this.GetVotes();}

  GetVotes = async() => {
    const votesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getallvotes/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const votesResponse = await votesRequest.json();
    let votes = [];
    for (let i=0; i<votesResponse.length; i++){
      votes.push({
        "id":String(i),
        "voteID":votesResponse[i].voteid,
        "projectID":votesResponse[i].voteprojectid,
        "voter":`${votesResponse[i].participanttitle} ${votesResponse[i].participantfname} ${votesResponse[i].participantlname}`,
        "office":votesResponse[i].officename,
        "voteValue":votesResponse[i].votevalue,
        "voteTime":votesResponse[i].votetime ? `${new Date(votesResponse[i].votetime).toUTCString()}`:"",
        "modified":votesResponse[i].votemodified ? "yes":"no",
        "action":
          <>
            <div style={{display:'flex', gap:'0.25rem'}}>
              <Button
                hasIconOnly
                size='md'
                renderIcon={RequestQuote}
                iconDescription='Edit Vote'
                kind="primary"
                onClick={() => {
                  document.getElementById("editVoteValue").value = votesResponse[i].votevalue;
                  this.setState({
                    voteToEdit:{
                      "voteid":votesResponse[i].voteid,
                      "voter":`${votesResponse[i].participanttitle} ${votesResponse[i].participantfname} ${votesResponse[i].participantlname}`,
                      "votevalue":votesResponse[i].votevalue,
                      "projectid":votesResponse[i].voteprojectid
                    },
                    modalEditOpen:true
                  })
                }}
              />
              <Button
                hasIconOnly
                size='md'
                renderIcon={RecentlyViewed}
                iconDescription='Vote History'
                kind="secondary"
                onClick={() => {
                  this.setState({
                    modalHistoryOpen:true,
                    showLoading:'block',
                    showHistoryContent:'none'
                  });
                  this.GetVoteHistory(votesResponse[i].voteid)
                }}
              />
              <Button
                hasIconOnly
                size='md'
                renderIcon={TrashCan}
                iconDescription='Delete Vote'
                kind="danger"
                onClick={() => {
                  this.setState({voteToDelete:{
                    voteID:votesResponse[i].voteid,
                    projectID:votesResponse[i].voteprojectid,
                    voter:`${votesResponse[i].participanttitle} ${votesResponse[i].participantfname} ${votesResponse[i].participantlname}`
                  }})
                  this.setState({modalDeleteOpen:true})
                }}
              />
            </div>
          </>
      })
    }
    this.setState({
      votesList:votes,
      displayTable:'block',
      displaySkeleton:'none'
    });
  }

  CheckVoteExists = () => {
    if (this.state.addUserComboValue === null) {
      this.setState({userComboInvalid:true});
      return;
    }
    if (this.state.addProjectComboValue === null) {
      this.setState({projctComboInvalid:true});
      return;
    }
    const voteValue = document.getElementById("addVoteValue").value;
    if (!voteValue || voteValue < 0 || voteValue > 10) return;
    const comment = document.getElementById("addComment").value
    this.setState({
      voteToAdd: {
        "voterID":this.state.addUserComboValue.userid,
        "voter":`${this.state.addUserComboValue.title} ${this.state.addUserComboValue.fname} ${this.state.addUserComboValue.lname}`,
        "office":this.state.addUserComboValue.office,
        "projectID":this.state.addProjectComboValue,
        "voteValue":voteValue,
        "comment":comment,
        "source":"admin"
      }
    }, async() => {
      const checkVoteReqest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/checkvote/${this.state.voteToAdd.voterID}&${this.state.voteToAdd.projectID}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
      const checkVoteResponse = await checkVoteReqest.json();

      if (checkVoteResponse[0].exists) {this.setState({modalExistsOpen:true})}
      if (!checkVoteResponse[0].exists) {this.AddVote()}
    })

  }

  AddVote = async() => {
    const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/submitvote`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({values:this.state.voteToAdd,token:localStorage.getItem('adminjwt')})
    })
    this.setState({
      modalAddOpen:false,
      modalExistsOpen:false,
      voteToAdd:{},
      userList:[{}],
      projectList:[{}]
    })
    document.getElementById("addVoteValue").value = 0;
    document.getElementById("addComment").value = "";
    this.GetVotes();
  }

  EditVote = async() => {

    const newVoteValue = parseInt(document.getElementById('editVoteValue').value);

    if (newVoteValue >= 0 && newVoteValue <= 10) {

      this.setState({modalEditOpen: false});

      let requestData = {
        "voteid":this.state.voteToEdit.voteid,
        "newvalue": newVoteValue,
        "previousvalue":this.state.voteToEdit.votevalue,
        "comment":document.getElementById('editComment').value
      };

      const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/editvote`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({values:requestData,token:localStorage.getItem('adminjwt')})
      })
      document.getElementById("editComment").value = "";
      this.GetVotes()
    }
  }

  DeleteVote = async() => {
    let fetchUrl;
    let reqBody = {};
    
    if (this.state.voteToDelete.voteID === "all") {
      fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/deleteallvotes`;
      reqBody = {
        method:'DELETE',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token:localStorage.getItem('adminjwt')})
      }
    }
    if (this.state.voteToDelete.voteID !== "all") {
      fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/deletevote`;
      reqBody = {
        method:'DELETE',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({"voteId":this.state.voteToDelete.voteID,token:localStorage.getItem('adminjwt')})
      }
    }
    const deleteRequest = await fetch(fetchUrl, reqBody);
    const deleteResponse = await deleteRequest.json()
    if (deleteResponse.code === 200) this.GetVotes();
    if (deleteResponse.code === 404) {
      this.setState({
        modalErrorOpen:true,
        errorInfo:{
          heading:`Error Deleting Vote ${this.state.voteToDelete.voteID}`,
          message:`An error occured while attempting to delete vote ${this.state.voteToDelete.voteID}. A vote with that ID was not found in the database.`
        }
      })
    }
  }

  GetUsers = async() => {
    const usersRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getallvoters/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const usersResponse = await usersRequest.json();
    let users = [];
    for (let i=0; i<usersResponse.rows.length; i++){
      users.push({
        "userid":usersResponse.rows[i].participantid,
        "title":usersResponse.rows[i].participanttitle,
        "fname":usersResponse.rows[i].participantfname,
        "lname":usersResponse.rows[i].participantlname,
        "office":usersResponse.rows[i].participantoffice,
        "text":`${usersResponse.rows[i].participanttitle} ${usersResponse.rows[i].participantfname} ${usersResponse.rows[i].participantlname} (${usersResponse.rows[i].officename})`
      })
    }
    this.setState({userList:users});
  }

  GetProjects = async() => {
    const projectsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/projects/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const projectsResponse = await projectsRequest.json();
    let projects = [];
    for (let i=0; i<projectsResponse.rows.length; i++){
      projects.push({
        "projectid":projectsResponse.rows[i].projectid,
        "text":`${projectsResponse.rows[i].projectid}: ${projectsResponse.rows[i].projectdescription}`
      })
    }

    this.setState({projectList:projects});
  }

  GetVoteHistory = async(voteId) => {
    this.setState({
      showLoading:'flex',
      showHistoryContent:'none'
    });
    const historyRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getchangelogbyid/${voteId}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const historyResponse = await historyRequest.json();
    let historyList = [];
    if (historyResponse.length <= 0) {
      historyList.push(<><p>This vote has not been modified.</p></>);
    }
    if (historyResponse.length > 0) {
      for (let i=0; i<historyResponse.length;i++){
        historyList.push(
          <>
            <div 
              style={{
                margin:'0.5rem',
                padding:'0.5rem',
                backgroundColor:'#dedede',
                borderRadius:'10px'
              }}>
              <h6>Modification type: {historyResponse[i].changeaction}</h6>
              <h6>Time of modification: {historyResponse[i].changetime}</h6>
              {
                historyResponse[i].changeaction==="add" ? 
                  <>
                    <h6>Initial Value: {historyResponse[i].changenewvalue}</h6>
                  </>
                  :null
              }
              {
                historyResponse[i].changeaction==="edit" ? 
                  <>
                    <h6>Previous Value: {historyResponse[i].changepreviousvalue}</h6>
                   <h6>New Value: {historyResponse[i].changenewvalue}</h6>
                  </>
                  :null
              }
              <TextArea
                rows={2}
                labelText="Comment"
                value={historyResponse[i].changecomment}
                />
              
            </div>
          </>
        );
      };
    }

    this.setState({
      showLoading:'none',
      showHistoryContent:'block',
      currentVoteHistory:voteId,
      voteHistory:historyList
    })
  }
  render() {
    return (
      <>
        <Modal
          danger
          id='modalExists'
          modalHeading='Vote Already Exists'
          primaryButtonText="Update Vote"
          secondaryButtonText="Cancel"
          onRequestClose={() => {this.setState({modalExistsOpen:false})}}
          onRequestSubmit={() => {this.AddVote()}}
          open={this.state.modalExistsOpen}>
            <p>A vote cast by {this.state.voteToAdd.voter} for idea {this.state.voteToAdd.projectID} has already been recorded.</p>
            <br/>
            <p>If you choose to continue, the existing vote will be updated with the specified value of {this.state.voteToAdd.voteValue} instead of creating a new vote entry.</p>
        </Modal>
        <Modal
          id='modalAdd'
          primaryButtonText="Add"
          secondaryButtonText="Cancel"
          shouldSubmitOnEnter={true}
          modalHeading='Add Vote'
          onRequestClose={() => {
            this.setState({modalAddOpen: false, voteToAdd:{}})
            document.getElementById("addComment").value = "";
          }}
          onRequestSubmit={() => {this.CheckVoteExists();}}
          open={this.state.modalAddOpen}>

          <ComboBox
            onChange={(item) => {
              if (this.state.userComboInvalid === true) this.setState({userComboInvalid:false})
              if (item.selectedItem === null) this.setState({addUserComboValue:null})
              if (item.selectedItem !== null) {
                this.setState({
                  addUserComboValue:{
                    "userid":item.selectedItem.userid,
                    "title":item.selectedItem.title,
                    "fname":item.selectedItem.fname,
                    "lname":item.selectedItem.lname,
                    "office":item.selectedItem.office
                  }
                })
              }
            }}
            id="addUserCombobox"
            placeholder="Select"
            invalid={this.state.userComboInvalid}
            invalidText="This is a required field."
            items={this.state.userList}
            itemToString={(user) => (user ? `${user.userid} - ${user.text}` : '')}
            titleText="User"
            helperText=""
            tabIndex={0}
          />
          <br/>
          <ComboBox
            onChange={(item) => {
              if (this.state.projctComboInvalid === true) this.setState({projctComboInvalid:false})
              if (item.selectedItem === null) this.setState({addProjectComboValue:null})
              if (item.selectedItem !== null) this.setState({addProjectComboValue:item.selectedItem.projectid})
            }}
            id="addProjectCombobox"
            placeholder="Select"
            invalid={this.state.projctComboInvalid}
            invalidText="This is a required field."
            items={this.state.projectList}
            itemToString={(project) => (project ? project.text: "")}
            titleText="Idea"
            helperText=""
            tabIndex={0}
          />
          <br/>
          <NumberInput
            id="addVoteValue"
            min={0}
            max={10}
            value={0}
            label="Vote Value"
            invalidText="Number is not valid. Please enter a value of 0 - 10."
            tabIndex={0}
          />
          <br/>
          <TextArea
            id="addComment"
            labelText="Comment"
            helperText="Enter the reason for manually adding the vote."
            rows={2}
          />
        </Modal>
        <Modal
          id='modalEdit'
          primaryButtonText="Save"
          secondaryButtonText="Cancel"
          shouldSubmitOnEnter={true}
          modalHeading={`Edit vote for idea ${this.state.voteToEdit.projectid}`}
          onRequestClose={() => {
            this.setState({modalEditOpen: false})
            document.getElementById("editComment").value = "";
          }}
          onRequestSubmit={() => {this.EditVote();}}
          open={this.state.modalEditOpen}
        >
          <p>Edit vote for idea {this.state.voteToEdit.projectid} cast by {this.state.voteToEdit.voter}</p>
          <NumberInput
            id="editVoteValue"
            min={0}
            max={10}
            value={this.state.voteToEdit.votevalue}
            label="Vote Value"
            invalidText="Number is not valid. Please enter a value of 0 - 10."
            tabIndex={0}
          />
          <br/>
          <br/>
          <TextArea
            id="editComment"
            labelText="Comment"
            helperText="Enter the reason for editing the vote."
            rows={2}
          />
        </Modal>
        <Modal
          danger
          modalHeading='Confirm Delete'
          primaryButtonText="Delete"
          secondaryButtonText="Cancel"
          onRequestClose={() => this.setState({modalDeleteOpen: false, voteToDelete:{voteID:""}})}
          onRequestSubmit={() => {
            this.setState({modalDeleteOpen: false});
            this.DeleteVote();
            }
          }
          open={this.state.modalDeleteOpen}>
            <p>Are you sure you want to delete {this.state.voteToDelete.voter}'s vote for project {this.state.voteToDelete.projectID}?</p>
        </Modal>
        <Modal
          danger
          modalHeading='Confirm Delete All'
          primaryButtonText="Delete"
          primaryButtonDisabled={this.state.deleteAllDisabled}
          secondaryButtonText="Cancel"
          onRequestClose={() => {
            this.setState({modalDeleteAllOpen: false, deleteAllDisabled:true});
            document.getElementById("deleteAllAck").checked = false;
          }}
          onRequestSubmit={() => {
            this.setState({
              deleteAllDisabled:true,
              modalDeleteAllOpen: false,
              voteToDelete:{
                voteID:"all",
                projectID:"",
                voter:""
              }
            })
            document.getElementById("deleteAllAck").checked = false;
            this.DeleteVote();
            }
          }
          open={this.state.modalDeleteAllOpen}>
            <div style={{display:'flex'}}><WarningHex size={32}/><p style={{paddingLeft:'8px'}}>Warning! This action will delete all votes from the database. Once executed, this action cannot be undone.</p></div>
            <br/>
            <Checkbox
              id="deleteAllAck"
              labelText="I understand this action cannot be undone"
              onChange={() => {
                let isChecked = document.getElementById("deleteAllAck").checked
                if (isChecked === true) {
                  this.setState({
                    deleteAllDisabled: false,
                    voteToDelete:{voteID:"all"}
                  });
                }
                if (isChecked === false) {
                  this.setState({
                    deleteAllDisabled: true,
                    voteToDelete:{voteID:""}
                  });
                }
              }}
            />
        </Modal>
        <Modal
          hasScrollingContent={true}
          id='voteHistory'
          modalHeading={`History of Vote ID ${this.state.currentVoteHistory}`}
          primaryButtonText="Ok"
          onRequestClose={() => this.setState({modalHistoryOpen:false})}
          onRequestSubmit={() => this.setState({modalHistoryOpen:false})}
          open={this.state.modalHistoryOpen}>
            <div
              style={{
                display:this.state.showLoading,
                justifyContent:'center',
                padding:'1rem'
              }}
            >
              <Loading
                withOverlay={false}
                active={true}
                description="Loading History..."
              />
            </div>
            <div style={{display:this.state.showHistoryContent}}>
              {this.state.voteHistory}
            </div>
        </Modal>
        <Modal
          id='modalError'
          modalHeading={this.state.errorInfo.heading}
          primaryButtonText="Ok"
          onRequestClose={() => this.setState({
              modalErrorOpen:false,
              errorInfo:{
                heading:"",
                message:""
              }
            }
          )}
          onRequestSubmit={() => this.setState({
              modalErrorOpen:false,
              errorInfo:{
                heading:"",
                message:""
              }
            }
          )}
          open={this.state.modalErrorOpen}>
            <div>
              {this.state.errorInfo.message}
            </div>
        </Modal>
        <Content>
          <div style={{display:this.state.displayTable}} className="bx--grid bx--grid--full-width adminPageBody">
            <div className="bx--row bx--offset-lg-1 ManageProjects__r1" >
              <div className="bx--col-lg-15">
                <DataTable
                  stickyHeader={false}
                  rows={this.state.votesList}
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
                    <TableContainer title="Votes" description="Displays list of all votes cast at the ISR">
                      <TableToolbar>
                          <TableToolbarContent>
                              <TableToolbarSearch onChange={onInputChange} />
                          </TableToolbarContent>
                          <Button
                            renderIcon={Add}
                            hasIconOnly={true}
                            size='lg'
                            iconDescription='Add Vote'
                            onClick={() => {
                              this.GetUsers();
                              this.GetProjects();
                              this.setState({modalAddOpen:true})}
                            }
                          />
                          <Button onClick={() => {this.setState({modalDeleteAllOpen:true})}} kind='danger' renderIcon={TrashCan} size='sm'>Delete All</Button>
                      </TableToolbar>
                      <Table {...getTableProps()}>
                        <TableHead>
                          <TableRow>
                            {headers.map((header, i) => (<TableHeader key={i} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
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
            <DataTableSkeleton columnCount={5} headers={headers}/>
          </div>
        </Content>
      </>
    );
  }
}

export default AdminVotesPage;