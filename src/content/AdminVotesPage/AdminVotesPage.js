import React, { useState, useEffect, useRef } from 'react'
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

export default function AdminVotesPage() {
	
	const addVoteCombosRef = useRef({voterId:"",voterName:"",projectId:""});
	const addVoteValueRef = useRef(0);
	const addVoteCommentRef = useRef();
	const voteToEdit = useRef({});
	const voteToDelete = useRef({
		voteID:"",
		projectID:"",
		voter:""
	});
	
	const [modalExistsOpen, setModalExistsOpen] = useState(false);
	const [modalAddOpen, setModalAddOpen] = useState(false);
	const [modalEditOpen, setModalEditOpen] = useState(false);
	const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
	const [modalDeleteAllOpen, setModalDeleteAllOpen] = useState(false);
	const [modalHistoryOpen, setModalHistoryOpen] = useState(false);
	const [modalErrorOpen, setModalErrorOpen] = useState(false);
	const [deleteAllDisabled, setDeleteAllDisabled] = useState(true);
	const [userComboInvalid, setUserComboInvalid] = useState(false);
	const [projectComboInvalid, setProjectComboInvalid] = useState(false);
	const [displayTable, setDisplayTable] = useState('none');
	const [displaySkeleton, setDisplaySkeleton] = useState('block');
	const [userList, setUserList] = useState([]);
	const [projectList, setProjectList] = useState([]);
	const [voteHistory, setVoteHistory] = useState([]);
	const [showHistoryContent, setShowHistoryContent] = useState('none');
	const [showLoading, setShowLoading] = useState('flex');
	const [currentVoteHistory, setCurrentVoteHistory] = useState(0);
	const [errorInfo, setErrorInfo] = useState({heading:'',	message:''});
	const [addProjectComboSelection, setAddProjectComboSelection] = useState({projectid:""});
	const [addVoteInputValue, setAddVoteInputValue] = useState(6);
	const [addUserComboSeletion, setAddUserComboSelection] = useState({
		fname:"",
		lname:"",
		office:"",
		text:"",
		title:"",
		userid:""
	});
	const [votesList, setVotesList] = useState([{
		id:'0',
		voteID:'-',
		projectID:'-',
		voter:'-',
		office: '-',
		voteValue:'-',
		action:'-'
	}]);

  useEffect(() => GetVotes(),[])
	
  async function GetVotes() {
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
                  document.getElementById("editVoteValue").value = votesResponse[i].votevalue; //this should be a useRef
                  voteToEdit.current = {
										"voteid":votesResponse[i].voteid,
										"voter":`${votesResponse[i].participanttitle} ${votesResponse[i].participantfname} ${votesResponse[i].participantlname}`,
										"votevalue":votesResponse[i].votevalue,
										"projectid":votesResponse[i].voteprojectid
									}
									setModalEditOpen(true);
                }}
              />
              <Button
                hasIconOnly
                size='md'
                renderIcon={RecentlyViewed}
                iconDescription='Vote History'
                kind="secondary"
                onClick={() => {
									setModalHistoryOpen(true);
									setShowLoading('block');
                  setShowHistoryContent('none');
                  GetVoteHistory(votesResponse[i].voteid)
                }}
              />
              <Button
                hasIconOnly
                size='md'
                renderIcon={TrashCan}
                iconDescription='Delete Vote'
                kind="danger"
                onClick={() => {
                  voteToDelete.current = {
                    voteID:votesResponse[i].voteid,
                    projectID:votesResponse[i].voteprojectid,
                    voter:`${votesResponse[i].participanttitle} ${votesResponse[i].participantfname} ${votesResponse[i].participantlname}`
                  };
                  setModalDeleteOpen(true);
                }}
              />
            </div>
          </>
      })
    }
    setVotesList(votes);
    setDisplayTable('block');
    setDisplaySkeleton('none');
  }

  async function CheckVoteExists() {
		console.log(addVoteCombosRef.current)
    if (!addVoteCombosRef.current.voterId || addVoteCombosRef.current.voterId === "") {
      setUserComboInvalid(true);
      return;
    }
    if (!addVoteCombosRef.current.projectId || addVoteCombosRef.current.projectId === "") {
      setProjectComboInvalid(true);
      return;
    }

    if (!addVoteValueRef.current.value || addVoteValueRef.current.value < 0 || addVoteValueRef.current.value > 10) return;
    
		const checkVoteReqest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/checkvote/${addVoteCombosRef.current.voterId}&${addVoteCombosRef.current.projectId}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
		const checkVoteResponse = await checkVoteReqest.json();

		if (checkVoteResponse[0].exists) setModalExistsOpen(true);
		if (!checkVoteResponse[0].exists) AddVote();
  };

  async function AddVote() {
    const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/submitvote`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
				values:{
					"projectID":addVoteCombosRef.current.projectId,
					"voterID":addVoteCombosRef.current.voterId,
					"voteValue":addVoteValueRef.current.value,
					"comment":addVoteCommentRef.current.value,
					"source":"admin"
				},
				token:localStorage.getItem('adminjwt')
			})
    });

    addVoteCombosRef.current = {voterId:"",voterName:"",projectId:""};
		addVoteValueRef.current.value = 0;
		addVoteCommentRef.current.value = "";

    setModalExistsOpen(false);
    setModalAddOpen(false);
		setAddUserComboSelection(null);
		setAddProjectComboSelection(null);
		setAddVoteInputValue(0);
    setUserList([]);
    setProjectList([]);
    GetVotes();
  }

  async function EditVote() {

    const newVoteValue = parseInt(document.getElementById('editVoteValue').value); //this should be a useRef. This actually won't be needed once converted to a useRef

    if (newVoteValue >= 0 && newVoteValue <= 10) { //in the comparison, reference the useRef value once it's setup as a useRef instead of the variable

      setModalEditOpen(false);

      let requestData = {
        "voteid":voteToEdit.current.voteid,
        "newvalue": newVoteValue,
        "previousvalue":voteToEdit.current.votevalue,
        "comment":document.getElementById('editComment').value //this should be a useRef
      };

      const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/editvote`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({values:requestData,token:localStorage.getItem('adminjwt')})
      })
      document.getElementById("editComment").value = ""; //this should be a useRef
      GetVotes();
    }
  }

  async function DeleteVote() {
    let fetchUrl;
    let reqBody = {};
    
    if (voteToDelete.current.voteID === "all") {
      fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/deleteallvotes`;
      reqBody = {
        method:'DELETE',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token:localStorage.getItem('adminjwt')})
      }
    }
    if (voteToDelete.current.voteID !== "all") {
      fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/deletevote`;
      reqBody = {
        method:'DELETE',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({"voteId":voteToDelete.current.voteID,token:localStorage.getItem('adminjwt')})
      }
    }
    const deleteRequest = await fetch(fetchUrl, reqBody);
    const deleteResponse = await deleteRequest.json()
    if (deleteResponse.code === 200) GetVotes();
    if (deleteResponse.code === 404) {
			setModalErrorOpen(true);
			setErrorInfo({
				heading:`Error Deleting Vote ${voteToDelete.current.voteID}`,
				message:`An error occured while attempting to delete vote ${voteToDelete.current.voteID}. A vote with that ID was not found in the database.`
			});
    }
  }

  async function GetUsers() {
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
    setUserList(users);
  }

  async function GetProjects() {
    const projectsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/projects/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const projectsResponse = await projectsRequest.json();
    let projects = [];
    for (let i=0; i<projectsResponse.rows.length; i++){
      projects.push({
        "projectid":projectsResponse.rows[i].projectid,
        "text":`${projectsResponse.rows[i].projectid}: ${projectsResponse.rows[i].projectdescription}`
      })
    }
    setProjectList(projects);
  }

  async function GetVoteHistory(voteId) {
    setShowLoading('flex');
    setShowHistoryContent('none');

    const historyRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getchangelogbyid/${voteId}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const historyResponse = await historyRequest.json();
    let historyList = [];
    if (historyResponse.length <= 0) historyList.push(<><p>This vote has not been modified.</p></>);
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
  	setShowLoading('none');
    setShowHistoryContent('block');
    setCurrentVoteHistory(voteId);
    setVoteHistory(historyList);
  }

	return (
		<>
			<Modal
				danger
				id='modalExists'
				modalHeading='Vote Already Exists'
				primaryButtonText="Update Vote"
				secondaryButtonText="Cancel"
				onRequestClose={() => setModalExistsOpen(false)}
				onRequestSubmit={() => AddVote()}
				open={modalExistsOpen}>
					<p>A vote cast by {addVoteCombosRef.current.voterName} for idea {addVoteCombosRef.current.projectId} has already been recorded.</p>
					<br/>
					<p>If you choose to continue, the existing vote will be updated with the specified value of {addVoteValueRef.current.value} instead of creating a new vote entry.</p>
			</Modal>
			<Modal
				id='modalAdd'
				primaryButtonText="Add"
				secondaryButtonText="Cancel"
				shouldSubmitOnEnter={true}
				modalHeading='Add Vote'
				onRequestSubmit={() => CheckVoteExists()}
				open={modalAddOpen}
				onRequestClose={() => {
					setModalAddOpen(false);
					setAddUserComboSelection(null);
					setAddProjectComboSelection(null);
					setAddVoteInputValue(0);
					addVoteCombosRef.current = {voterId:"",voterName:"",projectId:""};
					addVoteValueRef.current.value = 0;
					addVoteCommentRef.current.value = "";
				}}
			>
				<ComboBox
					id="addUserCombobox"
					placeholder="Select"
					invalidText="This is a required field."
					invalid={userComboInvalid}
					items={userList}
					itemToString={(user) => (user ? `${user.text}` : '')}
					titleText="User"
					helperText=""
					selectedItem={addUserComboSeletion}
					tabIndex={0}
					onChange={(item) => {
						setAddUserComboSelection(item.selectedItem);
						if (!item.selectedItem) addVoteCombosRef.current.voterId = "";
						if (item.selectedItem) {
							if (userComboInvalid) setUserComboInvalid(false);
							addVoteCombosRef.current.voterId = item.selectedItem.userid
							addVoteCombosRef.current.voterName = item.selectedItem.text
						}
					}}
				/>
				<br/>
				<ComboBox
					id="addProjectCombobox"
					placeholder="Select"
					invalidText="This is a required field."
					invalid={projectComboInvalid}
					items={projectList}
					selectedItem={addProjectComboSelection}
					itemToString={(project) => (project ? project.text: "")}
					titleText="Idea"
					helperText=""
					tabIndex={0}
					onChange={(item) => {
						console.log(item.selectedItem);
						setAddProjectComboSelection(item.selectedItem);
						if (!item.selectedItem) addVoteCombosRef.current.projectId = "";
						if (item.selectedItem) {
							if (projectComboInvalid) setProjectComboInvalid(false);
							addVoteCombosRef.current.projectId = item.selectedItem.projectid
						}
					}}
				/>
				<br/>
				<NumberInput
					id="addVoteValue"
					allowEmpty={false}
					ref={addVoteValueRef}
					disableWheel={true}
					min={0}
					max={10}
					value={addVoteInputValue}
					label="Vote Value"
					invalidText="Number is not valid. Please enter a value of 0 - 10."
					tabIndex={0}
					onChange={() => setAddVoteInputValue(addVoteValueRef.current.value)}
				/>
				<br/>
				<TextArea
					id="addComment"
					labelText="Comment"
					helperText="Enter the reason for manually adding the vote."
					ref={addVoteCommentRef}
					rows={2}
				/>
			</Modal>
			<Modal
				id='modalEdit'
				primaryButtonText="Save"
				secondaryButtonText="Cancel"
				shouldSubmitOnEnter={true}
				modalHeading={`Edit vote for idea ${voteToEdit.current.projectid}`}
				onRequestClose={() => {
					setModalEditOpen(false);
					document.getElementById("editComment").value = ""; //this should be a useRef
				}}
				onRequestSubmit={() => EditVote()}
				open={modalEditOpen}
			>
				<p>Edit vote for idea {voteToEdit.current.projectid} cast by {voteToEdit.current.voter}</p>
				<NumberInput
					id="editVoteValue"
					min={0}
					max={10}
					value={voteToEdit.current.votevalue}
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
				onRequestClose={() => {
					setModalDeleteOpen(false);
					voteToDelete.current = {voteID:""};
				}}
				onRequestSubmit={() => {
					setModalDeleteOpen(false);
					DeleteVote();
				}}
				open={modalDeleteOpen}>
					<p>Are you sure you want to delete {voteToDelete.current.voter}'s vote for project {voteToDelete.current.projectID}?</p>
			</Modal>
			<Modal
				danger
				modalHeading='Confirm Delete All'
				primaryButtonText="Delete"
				primaryButtonDisabled={deleteAllDisabled}
				secondaryButtonText="Cancel"
				open={modalDeleteAllOpen}
				onRequestClose={() => {
					setModalDeleteAllOpen(false);
					setDeleteAllDisabled(true);
					document.getElementById("deleteAllAck").checked = false; //this should be a useRef
				}}
				onRequestSubmit={() => {
					setDeleteAllDisabled(true);
					setModalDeleteAllOpen(false);
					voteToDelete.current = {
						voteID:"all",
						projectID:"",
						voter:""
					}
					document.getElementById("deleteAllAck").checked = false; //this should be a useRef
					DeleteVote();
				}}
			>
				<div style={{display:'flex'}}>
					<WarningHex size={32}/>
					<p style={{paddingLeft:'8px'}}>Warning! This action will delete all votes from the database. Once executed, this action cannot be undone.</p>
				</div>
				<br/>
				<Checkbox
					id="deleteAllAck"
					labelText="I understand this action cannot be undone"
					onChange={() => {
						let isChecked = document.getElementById("deleteAllAck").checked //this should be a useRef
						if (isChecked === true) {
							setDeleteAllDisabled(false);
							voteToDelete.current = {voteID:"all"};
						}
						if (isChecked === false) {
							setDeleteAllDisabled(true);
							voteToDelete.current = {voteID:""};
						}
					}}
				/>
			</Modal>
			<Modal
				id='voteHistory'
				hasScrollingContent={true}
				modalHeading={`History of Vote ID ${currentVoteHistory}`}
				primaryButtonText="Ok"
				onRequestClose={() => setModalHistoryOpen(false)}
				onRequestSubmit={() => setModalHistoryOpen(false)}
				open={modalHistoryOpen}>
					<div
						style={{
							display:showLoading,
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
					<div style={{display:showHistoryContent}}>
						{voteHistory}
					</div>
			</Modal>
			<Modal
				id='modalError'
				modalHeading={errorInfo.heading}
				primaryButtonText="Ok"
				onRequestClose={() => {
					setModalErrorOpen(false);
					setErrorInfo({
						heading:"",
						message:""
					});
				}}
				onRequestSubmit={() => {
					setModalErrorOpen(false);
					setErrorInfo({
						heading:"",
						message:""
					});
				}}
				open={modalErrorOpen}>
					<div>
						{errorInfo.message}
					</div>
			</Modal>
			<Content>
				<div style={{display:displayTable}} className="bx--grid bx--grid--full-width adminPageBody">
					<div className="bx--row bx--offset-lg-1 ManageProjects__r1" >
						<div className="bx--col-lg-15">
							<DataTable
								rows={votesList}
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
													GetUsers();
													GetProjects();
													setModalAddOpen(true);
												}}
											/>
											<Button 
												kind='danger'
												renderIcon={TrashCan}
												size='sm'
												onClick={() => setModalDeleteAllOpen(true)}
											>
												Delete All
											</Button>
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
				<div style={{display: `${displaySkeleton}`}} className="bx--offset-lg-1 bx--col-lg-13">
					<DataTableSkeleton columnCount={5} headers={headers}/>
				</div>
			</Content>
		</>
	);
}