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
	{key:'voteId', header:'Vote ID'},
	{key:'ideaId', header:'Idea Number'},
	{key:'voter', header:'Voter'},
	{key:'office', header:'Office'},
	{key:'voteValue', header:'Vote Value'},
	{key:'voteTime', header:'Time of Vote'},
	{key:'modified', header:'Modified?'},
	{key:'action', header:'Action'}
];

export default function AdminVotesPage() {
	
	const errorInfo = useRef({heading:'', message:''});
	const addVoteCombosRef = useRef({voterId:"",voterName:"",ideaId:""});
	const addVoteValueRef = useRef(0);
	const addVoteCommentRef = useRef();
	const editVoteValueRef = useRef();
	const voteToEditRef = useRef({});
	const editVoteCommentRef = useRef();
	const voteToDelete = useRef({
		voteId:"",
		ideaId:"",
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
	const [ideaComboInvalid, setIdeaComboInvalid] = useState(false);
	const [displayTable, setDisplayTable] = useState('none');
	const [displaySkeleton, setDisplaySkeleton] = useState('block');
	const [userList, setUserList] = useState([]);
	const [ideaList, setIdeaList] = useState([]);
	const [voteHistory, setVoteHistory] = useState([]);
	const [showHistoryContent, setShowHistoryContent] = useState('none');
	const [showLoading, setShowLoading] = useState('flex');
	const [currentVoteHistory, setCurrentVoteHistory] = useState(0);
	const [addIdeaComboSelection, setAddIdeaComboSelection] = useState({ideaid:""});
	const [addVoteInputValue, setAddVoteInputValue] = useState(0);
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
		voteId:'-',
		ideaId:'-',
		voter:'-',
		office: '-',
		voteValue:'-',
		action:'-'
	}]);

  useEffect(() => GetVotes(),[])
	
  async function GetVotes() {
    const votesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const votesResponse = await votesRequest.json();
		if (votesResponse.code !== 200) {
			errorInfo.current = {heading:`Error ${votesResponse.code}`, message:votesResponse.message};
			setModalErrorOpen(true);
			return;
		};
		if (votesResponse.code === 200) {
			const votes = votesResponse.data.map((item, index) => {
				return {
					"id":String(index),
					"voteId":item.voteid,
					"ideaId":item.voteideaid,
					"voter":`${item.participanttitle} ${item.participantfname} ${item.participantlname}`,
					"office":item.officename,
					"voteValue":item.votevalue,
					"voteTime":item.votetime ? `${new Date(item.votetime).toUTCString()}`:"",
					"modified":item.votemodified ? "yes":"no",
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
									editVoteValueRef.current.value = item.votevalue;
                  voteToEditRef.current = {
										"voteid":item.voteid,
										"voter":`${item.participanttitle} ${item.participantfname} ${item.participantlname}`,
										"votevalue":item.votevalue,
										"ideaid":item.voteideaid
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
                  GetVoteHistory(item.voteid)
                }}
								/>
              <Button
                hasIconOnly
                size='md'
                renderIcon={TrashCan}
                iconDescription='Delete Vote'
                kind='danger'
                onClick={() => {
					voteToDelete.current = {
						voteId:item.voteid,
                    	ideaId:item.voteideaid,
                    	voter:`${item.participanttitle} ${item.participantfname} ${item.participantlname}`
                  	};
                  	setModalDeleteOpen(true);
                }}
								/>
            </div>
          </>
				};
			});
			setVotesList(votes);
			setDisplayTable('block');
			setDisplaySkeleton('none');
    };
  };

  async function CheckVoteExists() {
    if (!addVoteCombosRef.current.voterId || addVoteCombosRef.current.voterId === "") {
      setUserComboInvalid(true);
      return;
    }
    if (!addVoteCombosRef.current.ideaId || addVoteCombosRef.current.ideaId === "") {
      setIdeaComboInvalid(true);
      return;
    }

    if (!addVoteValueRef.current.value || addVoteValueRef.current.value < 0 || addVoteValueRef.current.value > 10) return;
    
		const checkVoteReqest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/check/${addVoteCombosRef.current.voterId}&${addVoteCombosRef.current.ideaId}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
		const checkVoteResponse = await checkVoteReqest.json();
		if (checkVoteResponse.code !== 200) {
			errorInfo.current = {heading:`Error ${checkVoteResponse.code}`, message:checkVoteResponse.message}
			setModalErrorOpen(true);
		};
		if (checkVoteResponse.code === 200) {
			if (checkVoteResponse.data[0].exists) setModalExistsOpen(true);
			if (!checkVoteResponse.data[0].exists) AddVote();
		};
  };

  async function AddVote() {
    const voteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/add`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
				values:{
					"ideaId":addVoteCombosRef.current.ideaId,
					"participantId":addVoteCombosRef.current.voterId,
					"voteValue":addVoteValueRef.current.value,
					"comment":addVoteCommentRef.current.value,
					"source":"admin"
				},
				token:localStorage.getItem('adminjwt')
			})
    });
    const voteResponse = await voteRequest.json();
		if (voteResponse.code !== 200) {
			errorInfo.current = {heading:`Error: ${voteResponse.code}`, message:voteResponse.message};
			setModalErrorOpen(true);
		}
		if (voteResponse.code === 200) GetVotes();

    addVoteCombosRef.current = {voterId:"",voterName:"",ideaId:""};
		addVoteValueRef.current.value = 0;
		addVoteCommentRef.current.value = "";

    if(modalExistsOpen) setModalExistsOpen(false);
    setModalAddOpen(false);
		setAddUserComboSelection(null);
		setAddIdeaComboSelection(null);
		setAddVoteInputValue(0);
    setUserList([]);
    setIdeaList([]);
  }

  async function EditVote() {
    
		if (parseInt(editVoteValueRef.current.value)>= 0 && parseInt(editVoteValueRef.current.value) <= 10) {
      setModalEditOpen(false);
      const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/edit`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
					"voteid":voteToEditRef.current.voteid,
					"newvalue": editVoteValueRef.current.value,
					"previousvalue":voteToEditRef.current.votevalue,
					"comment":editVoteCommentRef.current.value,
					"token":localStorage.getItem('adminjwt')
				})
      });
			const editResponse = await editRequest.json();
			editVoteCommentRef.current.value = "";
			if (editResponse.code !== 200) {
				errorInfo.current = {heading:`Error ${editResponse.code}`, message:editResponse.message}
				setModalErrorOpen(true);
				return;
			}
			if (editResponse.code === 200) GetVotes();
    }
  }

  async function DeleteVote() {
    let fetchUrl;
    let reqBody = {};
    
    if (voteToDelete.current.voteId === "all") {
      fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/votes/deleteall`;
      reqBody = {
        method:'DELETE',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({"token":localStorage.getItem('adminjwt')})
      }
    }
    if (voteToDelete.current.voteId !== "all") {
      fetchUrl = `${process.env.REACT_APP_API_BASE_URL}/votes/delete`;
      reqBody = {
        method:'DELETE',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
					"voteId":voteToDelete.current.voteId,
					"token":localStorage.getItem('adminjwt')
				})
      };
    };

    const deleteRequest = await fetch(fetchUrl, reqBody);
    const deleteResponse = await deleteRequest.json()
    if (deleteResponse.code === 200) GetVotes();
    if (deleteResponse.code !== 200) {
			errorInfo.current = {
				heading:`Error Deleting Vote ${voteToDelete.current.voteId}`,
				message:deleteResponse.message
			};
			setModalErrorOpen(true);
    };
  };

  async function GetUsers() {
    const participantsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const participantsResponse = await participantsRequest.json();
		if (participantsResponse.code !== 200) {
			errorInfo.current = {heading:`Error: ${participantsResponse.code}`, message:participantsResponse.message};
			setModalErrorOpen(true);
		}
		if (participantsResponse.code === 200) {
			const participants = participantsResponse.data.rows.map(participant => {
				return {
					"userid":participant.participantid,
					"title":participant.participanttitle,
					"fname":participant.participantfname,
					"lname":participant.participantlname,
					"office":participant.participantoffice,
					"text":`${participant.participanttitle} ${participant.participantfname} ${participant.participantlname} (${participant.officename})`
				};
			});
			setUserList(participants);
		}
  }

  async function GetIdeas() {
    const ideasRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const ideasResponse = await ideasRequest.json();
		if (ideasResponse.code !== 200) {
			errorInfo.current = {heading:`Error: ${ideasResponse.code}`, message:ideasResponse.message};
			setModalErrorOpen(true);
			return;
		}
		if (ideasResponse.code === 200) {
			const ideas = ideasResponse.data.rows.map(idea => {
				return {
					"ideaid":idea.ideaid,
					"text":`${idea.ideaid}: ${idea.ideadescription}`
				};
			});
			setIdeaList(ideas);
		}
  }

  async function GetVoteHistory(voteId) {
    setShowLoading('flex');
    setShowHistoryContent('none');

    const historyRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/changelog/getbyid/${voteId}&${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const historyResponse = await historyRequest.json();
    if (historyResponse.code !== 200){
			errorInfo.current = {heading:`Error: ${historyResponse.code}`, message:historyResponse.message};
			setModalErrorOpen(true);
			return;
		}
		if (historyResponse.code === 200) {
    	if (historyResponse.data.length <= 0) setVoteHistory([<><p>This vote has not been modified.</p></>]);
    	if (historyResponse.data.length > 0) {
				const history = historyResponse.data.map(item => {
					return ( 
						<>
							<div 
								style={{
									margin:'0.5rem',
									padding:'0.5rem',
									backgroundColor:'#dedede',
									borderRadius:'10px'
								}}>
								<h6>Modification type: {item.changeaction}</h6>
								<h6>Time of modification: {item.changetime}</h6>
								{
									item.changeaction==="add" ? 
										<>
											<h6>Initial Value: {item.changenewvalue}</h6>
										</>
										:null
								}
								{
									item.changeaction==="edit" ? 
										<>
											<h6>Previous Value: {item.changepreviousvalue}</h6>
										<h6>New Value: {item.changenewvalue}</h6>
										</>
										:null
								}
								<TextArea
									rows={2}
									labelText="Comment"
									value={item.changecomment}
								/>
							</div>
						</>
					);
				});
				setVoteHistory(history);
			};
			setCurrentVoteHistory(voteId);
    };
  	setShowLoading('none');
    setShowHistoryContent('block');
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
					<p>A vote cast by {addVoteCombosRef.current.voterName} for idea {addVoteCombosRef.current.ideaId} has already been recorded.</p>
					<br/>
					<p>If you choose to continue, the existing vote will be updated with the specified value of {addVoteValueRef.current.value} instead of creating a new vote entry.</p>
			</Modal>
			<Modal
				id='modalAdd'
				size='sm'
				primaryButtonText="Add"
				secondaryButtonText="Cancel"
				shouldSubmitOnEnter={true}
				modalHeading='Add Vote'
				onRequestSubmit={() => CheckVoteExists()}
				open={modalAddOpen}
				onRequestClose={() => {
					setModalAddOpen(false);
					setAddUserComboSelection(null);
					setAddIdeaComboSelection(null);
					setAddVoteInputValue(0);
					addVoteCombosRef.current = {voterId:"",voterName:"",ideaId:""};
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
					id="addIdeaCombobox"
					placeholder="Select"
					invalidText="This is a required field."
					invalid={ideaComboInvalid}
					items={ideaList}
					selectedItem={addIdeaComboSelection}
					itemToString={idea => (idea ? idea.text: "")}
					titleText="Idea"
					helperText=""
					tabIndex={0}
					onChange={(item) => {
						setAddIdeaComboSelection(item.selectedItem);
						if (!item.selectedItem) addVoteCombosRef.current.ideaId = "";
						if (item.selectedItem) {
							if (ideaComboInvalid) setIdeaComboInvalid(false);
							addVoteCombosRef.current.ideaId = item.selectedItem.ideaid;
						}
					}}
				/>
				<br/>
				<NumberInput
					id="addVoteValue"
					allowEmpty={false}
					iconDescription="Add Vote Value"
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
				modalHeading={`Edit vote for idea ${voteToEditRef.current.ideaid}`}
				onRequestClose={() => {
					setModalEditOpen(false);
					document.getElementById("editComment").value = ""; //this should be a useRef
				}}
				onRequestSubmit={() => EditVote()}
				open={modalEditOpen}
			>
				<p>Edit vote for idea {voteToEditRef.current.ideaid} cast by {voteToEditRef.current.voter}</p>
				<NumberInput
					id="editVoteValue"
					ref={editVoteValueRef}
					min={0}
					max={10}
					value={voteToEditRef.current.votevalue}
					label="Vote Value"
					invalidText="Number is not valid. Please enter a value of 0 - 10."
					tabIndex={0}
				/>
				<br/>
				<br/>
				<TextArea
					id="editComment"
					ref={editVoteCommentRef}
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
					voteToDelete.current = {voteId:""};
				}}
				onRequestSubmit={() => {
					setModalDeleteOpen(false);
					DeleteVote();
				}}
				open={modalDeleteOpen}>
					<p>Are you sure you want to delete {voteToDelete.current.voter}'s vote for idea {voteToDelete.current.ideaId}?</p>
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
						voteId:"all",
						ideaId:"",
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
							voteToDelete.current = {voteId:"all"};
						}
						if (isChecked === false) {
							setDeleteAllDisabled(true);
							voteToDelete.current = {voteId:""};
						}
					}}
				/>
			</Modal>
			<Modal
				id='voteHistory'
				aria-label='Vote History'
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
				modalHeading={errorInfo.current.heading}
				primaryButtonText="Ok"
				onRequestClose={() => {
					setModalErrorOpen(false);
					errorInfo.current = {
						heading:"",
						message:""
					};
				}}
				onRequestSubmit={() => {
					setModalErrorOpen(false);
					errorInfo.current = {
						heading:"",
						message:""
					};
				}}
				open={modalErrorOpen}>
					<div>
						{errorInfo.current.message}
					</div>
			</Modal>
			<Content>
				<div style={{display:displayTable}} className="bx--grid bx--grid--full-width adminPageBody">
					<div className="bx--row bx--offset-lg-1 ManageIdeas__r1" >
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
													GetIdeas();
													setModalAddOpen(true);
												}}
											/>
											<Button 
												kind='danger'
												onClick={() => setModalDeleteAllOpen(true)}
												children={<><TrashCan/> Delete All</>}
											/>
										</TableToolbar>
										<Table {...getTableProps()}>
											<TableHead>
												<TableRow>
													{headers.map((header, index) => (<TableHeader key={index} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
												</TableRow>
											</TableHead>
											<TableBody>
												{rows.map(row => (
													<TableRow key={row.id} {...getRowProps({ row })}>
														{row.cells.map(cell => (
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
				<div style={{display: `${displaySkeleton}`}} className="bx--grid bx--grid--full-width adminPageBody">
					<DataTableSkeleton columnCount={8} rowCount={10} headers={headers}/>
				</div>
			</Content>
		</>
	);
}