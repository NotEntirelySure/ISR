import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from "xlsx";
import {
  Button,
  ComboBox,
  Checkbox,
  DataTable,
  DataTableSkeleton,
	FileUploader,
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
	Tile,
	Tooltip,
  Loading
} from '@carbon/react';
import {
  Add,
	DocumentImport,
  Edit,
	Information,
  RecentlyViewed,
  TrashCan,
  WarningHex
} from '@carbon/react/icons';
import ProgressBar from '@carbon/react/lib/components/ProgressBar/ProgressBar';

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
	const deleteAllAck = useRef();
	const skipHeaderRef = useRef();
	const uploadFile = useRef();
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
	const [modalProgressOpen, setModalProgressOpen] = useState(false);
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
	const [importButtonDisabled, setImportButtonDisabled] = useState(true);
	const [modalImportOpen, setModalImportOpen] = useState(false);
	const [fileUploadStatus, setFileUploadStatus] = useState('uploading')
	const [progressButtonDisabled, setProgressButtonDisabled] = useState(true);
	const [progressLabel, setProgressLabel] = useState('');
  const [progressStatus, setProgressStatus] = useState(null);
  const [progressHelperText, setProgressHelperText] = useState('')
  const [progressCurrentValue, setProgressCurrentValue] = useState(null);
  const [progressMaxValue, setProgressMaxValue] = useState(null);
  const [progressErrorInfo, setProgressErrorInfo] = useState('');
  const [progressErrorDisplay, setProgressErrorDisplay] = useState('none');
  const [progressErrorCount, setProgressErrorCount] = useState(0);
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

  useEffect(() => {GetVotes()},[])
	
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
                renderIcon={Edit}
                iconDescription='Edit Vote'
								style={{color:'#0F62FE'}}
                kind="primary--ghost"
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
                kind="secondary--ghost"
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
								style={{color:'red'}}
                kind='primary--ghost'
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

	function HandleFileChange(event) {
    
    if (event === "removeFile") {
      uploadFile.current = null;
      setImportButtonDisabled(true);
      return;
    };
    setFileUploadStatus('uploading');
    const file = event.target.files[0];
    if (
      file.type === "text/csv" ||
      file.type === "application/vnd.ms-excel" ||  
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ) {
      let fileReader = new FileReader();
      fileReader.onloadend = event => uploadFile.current = event.target.result;
      fileReader.readAsBinaryString(file);
      setFileUploadStatus('complete');
      setImportButtonDisabled(false);
    };
  };

	async function BatchAddVotes() {
    if (!progressButtonDisabled) setProgressButtonDisabled(true);
    if (progressErrorInfo.length > 0) setProgressErrorInfo('');
    if (progressErrorCount > 0) setProgressErrorCount(0);
    setModalImportOpen(false);
    setImportButtonDisabled(true);
    setModalProgressOpen(true);
    setProgressLabel("Importing Votes...");
    setProgressHelperText('Processing file...');
    //process file
    const workbook = XLSX.read(uploadFile.current, {type:'binary'});
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    const fileData = XLSX.utils.sheet_to_row_object_array(worksheet, {header:1});
  
    const objVoteList = [];
    for (let i = skipHeaderRef.current.checked ? 0:1; i<fileData.length; i++) {
      
      objVoteList.push({
				ideaId:fileData[i][0],
				title:fileData[i][1],
				fName:fileData[i][2],
				lName:fileData[i][3],
				office:fileData[i][4],
				vote:fileData[i][5]
      });
		}
    //batch add
    setProgressMaxValue(objVoteList.length);
    setProgressStatus('active');
    for (let i=0; i<objVoteList.length;i++) {
      setProgressHelperText(`Adding vote ${i+1} of ${objVoteList.length}`);
      
      setProgressCurrentValue(i+1);
      const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/votes/batchadd`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({values:objVoteList[i], "token":localStorage.getItem('adminjwt')})
      });
      const addResponse = await addRequest.json();
      if (addResponse.code !== 200) {
        setProgressErrorCount(previousState => previousState + 1);
        if (progressErrorDisplay === 'none') setProgressErrorDisplay('block');
        setProgressErrorInfo(previousState => previousState + `Error ${addResponse.code} encountered when adding vote for idea "${objVoteList[i].ideaId}"\n\tImport file line number: ${skipHeaderRef.current.checked ? i+1:i+2} \n\tDetails: ${addResponse.message}\n\n`);
      }
      
    };
    setProgressLabel("Done.");
    setProgressStatus('finished');
    setProgressMaxValue(null);
    setProgressButtonDisabled(false);
		skipHeaderRef.current.checked = false;
    uploadFile.current = null;
    GetVotes();
  }

	return (
		<>
			<Modal
				danger
				id='modalExists'
				size='sm'
				modalHeading='Vote Already Exists'
				primaryButtonText="Update Vote"
				secondaryButtonText="Cancel"
				onRequestClose={() => setModalExistsOpen(false)}
				onRequestSubmit={() => AddVote()}
				open={modalExistsOpen}
				children={
					<>
						<p>A vote cast by {addVoteCombosRef.current.voterName} for idea {addVoteCombosRef.current.ideaId} has already been recorded.</p>
						<br/>
						<p>If you choose to continue, the existing vote will be updated with the specified value of {addVoteValueRef.current.value} instead of creating a new vote entry.</p>
					</>
				}
			/>
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
				children={
					<>
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
					</>
				}
			/>
			<Modal
				id='modalEdit'
				size='sm'
				primaryButtonText="Save"
				secondaryButtonText="Cancel"
				shouldSubmitOnEnter={true}
				modalHeading={`Edit vote for idea ${voteToEditRef.current.ideaid}`}
				onRequestClose={() => {
					setModalEditOpen(false);
					editVoteCommentRef.current.value = "";
				}}
				onRequestSubmit={() => EditVote()}
				open={modalEditOpen}
				children={
					<>
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
					</>
				}
			/>
			<Modal
				danger
				size='sm'
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
				open={modalDeleteOpen}
				children={<p>Are you sure you want to delete {voteToDelete.current.voter}'s vote for idea {voteToDelete.current.ideaId}?</p>}
			/>
			<Modal
				danger
				size='sm'
				modalHeading='Confirm Delete All'
				primaryButtonText="Delete"
				primaryButtonDisabled={deleteAllDisabled}
				secondaryButtonText="Cancel"
				open={modalDeleteAllOpen}
				onRequestClose={() => {
					setModalDeleteAllOpen(false);
					setDeleteAllDisabled(true);
					deleteAllAck.current.checked = false;
				}}
				onRequestSubmit={() => {
					setDeleteAllDisabled(true);
					setModalDeleteAllOpen(false);
					voteToDelete.current = {
						voteId:"all",
						ideaId:"",
						voter:""
					}
					deleteAllAck.current.checked = false;
					DeleteVote();
				}}
				children={
					<>
						<div style={{display:'flex'}}>
							<WarningHex style={{color:'orange'}} size={48}/>
							<p style={{paddingLeft:'1rem'}}>Warning! This action will delete all votes from the database. Once executed, this action cannot be undone.</p>
						</div>
						<br/>
						<Checkbox
							id="deleteAllAck"
							ref={deleteAllAck}
							labelText="I understand this action cannot be undone"
							onChange={event => {
								if (event.target.checked) {
									setDeleteAllDisabled(false);
									voteToDelete.current = {voteId:"all"};
								}; 
								if (!event.target.checked) {
									setDeleteAllDisabled(true);
									voteToDelete.current = {voteId:""};
								};
							}}
						/>
					</>
				}
			/>
			<Modal
				id='voteHistory'
				aria-label='Vote History'
				hasScrollingContent={true}
				modalHeading={`History of Vote ID ${currentVoteHistory}`}
				primaryButtonText="Ok"
				onRequestClose={() => setModalHistoryOpen(false)}
				onRequestSubmit={() => setModalHistoryOpen(false)}
				open={modalHistoryOpen}
				children={
					<>
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
						<div style={{display:showHistoryContent}}>{voteHistory}</div>
					</>
				}
			/>
			<Modal
				id='modalError'
				modalHeading={errorInfo.current.heading}
				primaryButtonText="Ok"
				open={modalErrorOpen}
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
				children={<div>{errorInfo.current.message}</div>}
			/>
			<Modal
        id='modalImport'
        size='sm'
        hasScrollingContent
        aria-label="Import Modal"
        primaryButtonText="Import"
        primaryButtonDisabled={importButtonDisabled}
        secondaryButtonText="Cancel"
        modalHeading='Import Votes'
        onRequestClose={() => {
          skipHeaderRef.current.checked = false;
          setModalImportOpen(false);
          setImportButtonDisabled(true);
          HandleFileChange("removeFile")
        }}
        onRequestSubmit={() => BatchAddVotes()} 
        open={modalImportOpen}
      >
        <Tile>
          <p>This import function allows you to specify a file containing a list of votes, and add the list of votes to the database.</p>  
        </Tile>
        <Tile className='file-import-warining-tile'>
          <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
            <div id="warningIcon"><WarningHex size={32} fill="orange"/></div>
            <div><p>Important: the contents of the file must be formatted as shown below, or else the import will fail.</p></div>
          </div>
          <br/>
          <div style={{paddingLeft:'2rem'}}>
						<img id='exampleImport' src={`${process.env.PUBLIC_URL}/vote_import_example.png`} alt='Example Import Format'></img>
					</div>
        </Tile>
        <hr/>
        <div className="cds--file__container">
          <FileUploader
            accept={['.csv', '.xls', '.xlsx']}
            size="lg"
            buttonKind="primary"
            buttonLabel="Add file"
            filenameStatus="edit"
            iconDescription="Clear file"
            labelDescription="This import function accepts three file types: .csv, .xls, and .xlsx."
            labelTitle="Upload"
            status={fileUploadStatus}
            onChange={event => HandleFileChange(event)}
            onDelete={() => HandleFileChange("removeFile")}
          />
        </div>
        <div>
          <div style={{float: 'left'}}>
            <Checkbox 
              id="skipHeader"
              ref={skipHeaderRef}
              labelText="Do not skip first row header"
            />
          </div>
          <div>
          <Tooltip 
            align="top"
            label="By default the import function skips the first row because it's assumed to be the header row. Select this option if the input file does not utilize a header on the first row."
          >
            <Information/>
          </Tooltip>
          </div>
        </div>
      </Modal>
			<Modal
        id="modalProgress"
        preventCloseOnClickOutside={true}
        primaryButtonDisabled={progressButtonDisabled}
        primaryButtonText="Done"
        modalHeading="Idea Import"
        open={modalProgressOpen}
        onRequestClose={() => {
          setProgressErrorInfo('');
          setModalProgressOpen(false);
        }}
        onRequestSubmit={() => {
          setProgressErrorInfo('');
          setModalProgressOpen(false);
        }}
        children={
          <>
            <div>
              <ProgressBar
                label={progressLabel}
                helperText={progressHelperText}
                status={progressStatus}
                max={progressMaxValue}
                value={progressCurrentValue}
              />
            </div>
            <div style={{marginTop:'2rem'}}>
              <TextArea
                labelText="Upload Errors"
                helperText={`Error count: ${progressErrorCount}`}
                readOnly={true}
                rows={4}
                value={progressErrorInfo}
              />
            </div>
          </>
        }
      />
			<div style={{display:displayTable}} className="adminPageBody">
				<div className="dataTable">
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
										<TableToolbarSearch onChange={onInputChange}/>
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
                      renderIcon={DocumentImport} 
                      hasIconOnly 
                      iconDescription='Import Votes'
                      kind='secondary'
                      onClick={() => setModalImportOpen(true)}
                    />
									<Button 
										kind='danger'
										renderIcon={TrashCan}
										onClick={() => setModalDeleteAllOpen(true)}
										children={"Delete All"}
								/>
								</TableToolbar>
								<Table {...getTableProps()}>
									<TableHead>
										<TableRow>
											{headers.map((header, index) => (<TableHeader key={index} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
										</TableRow>
									</TableHead>
									<TableBody>
										{
											rows.map(row => (
												<TableRow key={row.id} {...getRowProps({ row })}>
													{row.cells.map(cell => (<TableCell key={cell.id}>{cell.value}</TableCell>))}
												</TableRow>
											))
										}
									</TableBody>
								</Table>
							</TableContainer>
						)}
					/>
				</div>
			</div>
			<div style={{display:displaySkeleton}} className="adminPageBody">
				<DataTableSkeleton columnCount={8} rowCount={8} headers={headers}/>
			</div>
		</>
	);
};