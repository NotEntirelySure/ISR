import React, { useState, useEffect, useRef } from 'react'
import * as XLSX from "xlsx";
import { 
  Button, 
  Checkbox,
  ComboBox,
  Content,
  DataTable,
  DataTableSkeleton,
  FileUploader,
  Modal,
  NumberInput,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TableToolbar,
  TableToolbarContent,
  TableToolbarSearch,
  Tag,
  TextInput,
  Tile,
  Tooltip,
  TextArea
} from '@carbon/react';
import {
  Add,
  DocumentImport,
  Information,
  TrashCan,
  RequestQuote,
  WarningHex
} from '@carbon/react/icons';
import ProgressBar from '@carbon/react/lib/components/ProgressBar/ProgressBar';

const headers = [
  {key:'ideasequence', header: 'Sequence Number'},
  {key:'ideaid', header:'Idea ID'},
  {key:'ideadescription', header:'Idea Description'},
  {key:'ideadomainname', header:'Idea Domain'},
  {key:'ideadomaincolor', header:'Domain Color'},
  {key:'action', header:'Action'}
];

export default function AdminIdeasPage() {

  const addSequenceRef = useRef();
  const addIdRef = useRef();
  const addDescriptionRef = useRef();
  const addDomainRef = useRef();
  const editSequenceRef = useRef();
  const editIdRef = useRef();
  const editDescriptionRef = useRef();
  const uploadFile = useRef();
  const skipHeaderRef = useRef();
  const domainList = useRef([]);

  const [ideasList, setIdeasList] = useState([{id:'0', ideaid:'-', ideadescription:'-', action:'-'}]);
  const [ideaToDelete, setIdeaToDelete] = useState({ideaid:"", ideadescription:""});
  const [ideaToEdit, setIdeaToEdit] = useState({ideaid:"", ideadescription:""});
  const [modalProgressOpen, setModalProgressOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalImportOpen, setModalImportOpen] = useState(false);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [addIdInvalid, setAddIdInvalid] = useState(false);
  const [addDescriptionInvalid, setAddDescriptionInvalid] = useState(false);
  const [addSequenceValue, setAddSequenceValue] = useState(0);
  const [addSelectedDomain, setAddSelectedDomain] = useState({});
  const [editSelectedDomain, setEditSelectedDomain] = useState({});
  const [editIdInvalid, setEditIdInvalid] = useState(false);
  const [editDescriptionInvalid, setEditDescriptionInvalid] = useState(false);
  const [editDomainInvalid, setEditDomainInvalid] = useState(false);
  const [editSequenceValue, setEditSequenceValue] = useState(0);
  const [displayTable, setDisplayTable] = useState('none');
  const [displaySkeleton, setDisplaySkeleton] = useState('block');
  const [uploadFileStatus, setFileUploadStatus] = useState('uploading')
  const [importButtonDisabled, setImportButtonDisabled] = useState(true);
  const [errorInfo, setErrorInfo] = useState({heading:"", message:""});
  const [progressButtonDisabled, setProgressButtonDisabled] = useState(true);
  const [progressStatus, setProgressStatus] = useState(null);
  const [progressHelperText, setProgressHelperText] = useState('')
  const [progressCurrentValue, setProgressCurrentValue] = useState(null);
  const [progressMaxValue, setProgressMaxValue] = useState(null);
  const [progressErrorInfo, setProgressErrorInfo] = useState('');
  const [progressErrorDisplay, setProgressErrorDisplay] = useState('none');
  const [progressErrorCount, setProgressErrorCount] = useState(0);

  useEffect(() => GetIdeas(),[]);
  
  async function GetIdeas() {
    const ideasRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const ideasResponse = await ideasRequest.json();
    if (ideasResponse.code !== 200) return;
    const ideas = ideasResponse.data.rows.map((idea, index) => {
      return {
        id:String(index),
        ideasequence:idea.ideasequence,
        ideaid:idea.ideaid,
        ideadescription:idea.ideadescription,
        ideadomainid:idea.ideadomainid,
        ideadomainname:idea.ideadomainname,
        ideadomaincolor:
          <Tag 
            style={{backgroundColor:idea.ideadomaincolorhex}}
            children={idea.ideadomaincolorhex}
          />,
        ideadomaincolorhex:idea.ideadomaincolorhex,
        action:
          <>
            <div style={{display:'flex', gap:'0.25rem'}}>
              <Button
                hasIconOnly
                size="md"
                renderIcon={RequestQuote}
                iconDescription='Edit Idea'
                kind="primary"
                onClick={async() => {
                  setEditSequenceValue(idea.ideasequence);
                  editIdRef.current.value = idea.ideaid;
                  editDescriptionRef.current.value = idea.ideadescription;
                  await GetDomains();
                  setIdeaToEdit({
                    "ideasequence":idea.ideasequence,
                    "ideaid":idea.ideaid,
                    "ideadescription":idea.ideadescription,
                    "ideadomain":idea.ideadomainid
                  });
                  setEditSelectedDomain({
                    ideadomainid:idea.ideadomainid,
                    ideadomainname:idea.ideadomainname,
                    ideadomaincolorhex:idea.ideadomaincolorhex
                  });
                  setModalEditOpen(true);
                }}
              />
              <Button 
                hasIconOnly
                size="md"
                renderIcon={TrashCan}
                iconDescription='Delete Idea'
                kind="danger"
                onClick={() => {
                  setIdeaToDelete({
                    ideaid:idea.ideaid,
                    ideadescription:idea.ideadescription,
                  }); 
                  setModalDeleteOpen(true);
                }}
              />
            </div>
          </>
      };
    });
    setIdeasList(ideas);
    setDisplayTable('block');
    setDisplaySkeleton('none');
  };

  async function AddIdea() {

    setAddIdInvalid(false);
    setAddDescriptionInvalid(false);

    if (isNaN(addSequenceRef.current.value) || addSequenceRef.current.value === "") return;

    if (addIdRef.current.value === "") {
      setAddIdInvalid(true);
      return;
    }
    
    if (addDescriptionRef.current.value === "") {
      setAddDescriptionInvalid(true);
      return;
    }
    
    setModalAddOpen(false);
    setAddSequenceValue(0);
  
    const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/add`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "ideaId":addIdRef.current.value,
        "ideaDescription":addDescriptionRef.current.value,
        "ideaSequence":addSequenceRef.current.value,
        "ideaDomainId":addSelectedDomain,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const addResponse = await addRequest.json();
    if (addResponse.code === 200) GetIdeas();
    if (addResponse.code !== 200) {
      setErrorInfo({heading:`Error ${addResponse.code}`, message:addResponse.message});
      setModalErrorOpen(true);
    }
    addIdRef.current.value = "";
    addDescriptionRef.current.value = "";
    addDomainRef.current.value = "";
  }

  async function BatchAddIdeas() {
    if (!progressButtonDisabled) setProgressButtonDisabled(true);
    if (progressErrorInfo.length > 0) setProgressErrorInfo('');
    if (progressErrorCount > 0) setProgressErrorCount(0);
    setModalImportOpen(false);
    setImportButtonDisabled(true);
    setModalProgressOpen(true);
    setProgressHelperText('Processing file...')
    //process file
    const workbook = XLSX.read(uploadFile.current, {type:'binary'});
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    const fileData = XLSX.utils.sheet_to_row_object_array(worksheet, {header:1});
  
    const maxSequence = await GetSequenceNumber();
    if (domainList.current.length === 0) await GetDomains();
    let sequenceNumber = parseInt(maxSequence[0].max_sequence);
    if (isNaN(sequenceNumber)) sequenceNumber = 0;

    let objIdeaList = [];
    let domainId;
    let i=1;
    if (skipHeaderRef.current.checked) i=0;
    for (i; i<fileData.length; i++) {
      
      let domainFound = false;
      for (let id=0;id<domainList.current.length;id++){
        if (String(domainList.current[id].ideadomainname).toLowerCase() === String(fileData[i][2]).toLowerCase()) {
          domainId = domainList.current[id].ideadomainid
          domainFound = true;
          break;
        }
      }

      //if no direct match can be found between the provided domain name and one recorded in the database, try different iterations of domain names.
      if (!domainFound) {
        let refArray = [];
        const ewIterations = ["ew", "e&w","environment and waterways","environment & waterways"];
        const msIterations = ["ms", "m&s","msa","modeling and simulation","modeling & simulation"];
        const itnetIterations = ["itnet","itnet","it and networks","it & networks"];
        const asIterations = ["aviation/systems","aviation and systems","aviation & systems","systems","aviation"]
        const c5Iterations = ["c5isr","c5i","c5isc"]
        
        if (ewIterations.includes(String(fileData[i][2]).toLowerCase())) refArray = [...ewIterations];
        if (msIterations.includes(String(fileData[i][2]).toLowerCase())) refArray = [...msIterations];
        if (itnetIterations.includes(String(fileData[i][2]).toLowerCase())) refArray = [...itnetIterations];
        if (asIterations.includes(String(fileData[i][2]).toLowerCase())) refArray = [...asIterations];
        if (c5Iterations.includes(String(fileData[i][2]).toLowerCase())) refArray = [...c5Iterations];
        
        //if one of the iterations matches the provided domain name, check if the database also contains that iteration.
        for (let i=0;i<domainList.current.length;i++){
          if (refArray.includes(domainList.current[i].ideadomainname.toLowerCase())) {
            domainId = domainList.current[i].ideadomainid
            break;
          };
        };
      };

      sequenceNumber++;
      objIdeaList.push({
        "ideaId":fileData[i][0],
        "ideaDescription":fileData[i][1],
        "ideaSequence":sequenceNumber,
        "ideaDomainId":domainId
      });

      //Reset the domain variable. The domain var will retain the value of the previous item.
      //If the next item doesn't have a specified domain, it will be assigned the value of the previous item unless the var is reset.
      domainId = "";
    }
    //batch add
    setProgressMaxValue(objIdeaList.length);
    setProgressStatus('active');
    for (let i=0; i<objIdeaList.length;i++) {
      setProgressHelperText(`Adding idea ${i+1} of ${objIdeaList.length}`);
      
      setProgressCurrentValue(i+1);
      const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/add`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...objIdeaList[i], "token":localStorage.getItem('adminjwt')})
      });
      const addResponse = await addRequest.json();
      if (addResponse.code !== 200) {
        setProgressErrorCount(previousState => previousState + 1);
        if (progressErrorDisplay === 'none') setProgressErrorDisplay('block');
        setProgressErrorInfo(previousState => previousState + `Error ${addResponse.code} adding idea ${objIdeaList[i].ideaId}\nDetails: ${addResponse.message}\n\n`);
      }
      
    };
    setProgressStatus('finished');
    setProgressMaxValue(null);
    setProgressButtonDisabled(false);
    uploadFile.current = null;
    GetIdeas();
  }
  
  async function EditIdea() {
    
    setEditIdInvalid(false);
    setEditDescriptionInvalid(false);

    if (isNaN(editSequenceRef.current.value) || editSequenceRef.current.value === "") return;

    if (editIdRef.current.value === "") {
      setEditIdInvalid(true);
      return;
    }
    
    if (editDescriptionRef.current.value === "") {
      setEditDescriptionInvalid(true);
      return;
    }

    setModalEditOpen(false);

    const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/edit`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "previousIdeaId":ideaToEdit.ideaid,
        "newIdeaSequence":editSequenceRef.current.value,
        "newIdeaId": editIdRef.current.value,
        "newIdeaDescription": editDescriptionRef.current.value,
        "newIdeaDomain":editSelectedDomain.ideadomainid,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const editResponse = await editRequest.json();
    if (editResponse.code === 200) GetIdeas();
    if (editResponse.code !== 200) {
      setErrorInfo({heading:`Error ${editResponse.code}`, message:editResponse.message});
      setModalErrorOpen(true);
    }
    setEditSequenceValue(0);
    editIdRef.current.value = "";
    editDescriptionRef.current.value = "";
  };

  async function DeleteIdea() {
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/delete`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "ideaId":ideaToDelete.ideaid,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const deleteResponse = await deleteRequest.json();
    if (deleteResponse.code === 200) GetIdeas();
    if (deleteResponse.code !== 200) {
      setErrorInfo({heading:`Error ${deleteResponse.code}`, message:deleteResponse.message});
      setModalErrorOpen(true);
    };
  };

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

  async function GetSequenceNumber() {
    const sequenceRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/getsequencenumber`, {mode:'cors'});
    const sequenceResponse = await sequenceRequest.json();
    return sequenceResponse;
  }
  
  async function GetDomains() {
    const domainRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const domainResponse = await domainRequest.json();
    if (domainResponse.code === 200) domainList.current = domainResponse.data;
    if (domainResponse.code !== 200) {
      setErrorInfo({heading:`Error ${domainResponse.code}`, message:domainResponse.message.detail});
      setModalErrorOpen(true);
    };
  };

  return (
    <>
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
                label="Importing Ideas..."
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
      <Modal
        id='modalError'
        alert={true}
        modalHeading={errorInfo.heading}
        primaryButtonText="Ok"
        open={modalErrorOpen}
        onRequestClose={() => {
          setModalErrorOpen(false);
          setErrorInfo({heading:"", message:""});
        }}
        onRequestSubmit={() => {
          setModalErrorOpen(false);
          setErrorInfo({heading:"", message:""});
        }}
      >
        <div>{errorInfo.message}</div>
      </Modal>
      <Modal
        id='modalAdd'
        size='sm' 
        aria-label='Add Idea'
        primaryButtonText="Add"
        secondaryButtonText="Cancel"
        modalHeading='Add Idea'
        hasScrollingContent={true}
        shouldSubmitOnEnter={true}
        onRequestClose={() => {
          setModalAddOpen(false);
          addIdRef.current.value = "";
          addDescriptionRef.current.value = "";
        }}
        onRequestSubmit={() => AddIdea()} 
        open={modalAddOpen}
      >
        <NumberInput
          iconDescription=''
          id="addSequence"
          min={0}
          ref={addSequenceRef}
          value={addSequenceValue}
          label="Idea Sequence Number"
          invalidText="Number is not valid"
          tabIndex={0}
          onChange={event => {if (event.target.value) addSequenceRef.current.value = event.target.value;}}
        />
        <br/>
        <TextInput
          labelText="Projet Number"
          helperText=""
          id="addID"
          ref={addIdRef}
          invalid={addIdInvalid}
          onKeyPress={() => setAddIdInvalid(false)}
          invalidText="This is a required field."
          placeholder="Enter the idea number"
          tabIndex={0}
        />
        <br/>
        <TextInput
          style={{ marginBottom: '1rem'}}
          labelText="Idea Description"
          helperText=""
          id="addDescription"
          ref={addDescriptionRef}
          invalid={addDescriptionInvalid}
          onKeyPress={() => setAddDescriptionInvalid(false)}
          invalidText="This is a required field."
          placeholder="Enter your the idea's description"
          tabIndex={0}
        />
        <ComboBox
          id="addDomain"
          placeholder="Select"
          titleText="Idea Domain"
          ref={addDomainRef}
          items={domainList.current}
          itemToString={item => item ? item.ideadomainname:''}
          itemToElement={item => {
            return <>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>{item.ideadomainname}</div>
                <div style={{
                  backgroundColor:item.ideadomaincolorhex,
                  width:'15%',
                  borderRadius:'5px'
                }}>
                  <p>&nbsp;</p>
                </div>
              </div>
            </>
          }}
          onChange={item => {
            if (item.selectedItem !== null) setAddSelectedDomain(item.selectedItem.ideadomainid);
            if (item.selectedItem === null) setAddSelectedDomain({});
          }}
          
        />
      </Modal>
      <Modal
        id='modalImport'
        hasScrollingContent
        aria-label="Import Modal"
        primaryButtonText="Import"
        primaryButtonDisabled={importButtonDisabled}
        secondaryButtonText="Cancel"
        modalHeading='Import'
        onRequestClose={() => {
          skipHeaderRef.current.checked = false;
          setModalImportOpen(false);
          setImportButtonDisabled(true);
          HandleFileChange("removeFile")
        }}
        onRequestSubmit={() => BatchAddIdeas()} 
        open={modalImportOpen}
      >
        <Tile>
          <p>In order to simplify the data entry process, the import function allows you to specify a file containing a list of ideas with corresponding descriptions</p>  
        </Tile>
        <Tile className='file-import-warining-tile'>
          <div style={{display:'flex',gap:'1rem',alignItems:'center'}}>
            <div id="warningIcon"><WarningHex size={32} fill="orange"/></div>
            <div><p>Important: the contents of the file must be formatted as shown below, or else the import will fail.</p></div>
          </div>
          <br/>
          <div style={{paddingLeft:'2rem'}}><img id='exampleImport' src={`${process.env.PUBLIC_URL}/import_example.png`} alt='Example Import Format'></img></div>
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
            status={uploadFileStatus}
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
        id='modalEdit' 
        aria-label='Edit Idea'
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        hasScrollingContent={true}
        shouldSubmitOnEnter={true}
        modalHeading={`Edit Idea ${ideaToEdit.ideaid}`}
        onRequestClose={() => setModalEditOpen(false)}
        onRequestSubmit={() => EditIdea()}
        open={modalEditOpen}
      >
        <NumberInput
          id="editSequence"
          iconDescription=''
          min={0}
          ref={editSequenceRef}
          value={editSequenceValue}
          label="Idea Sequence Number"
          invalidText="Number is not valid"
          tabIndex={0}
          onChange={event => {if (event.target.value) editSequenceRef.current.value = event.target.value;}}
        />
        <br/>
        <TextInput
          labelText="Projet Number"
          helperText=""
          id="editID"
          invalid={editIdInvalid}
          ref={editIdRef}
          onKeyPress={() => setEditIdInvalid(false)}
          invalidText="This is a required field."
          placeholder="Enter the idea number"
          tabIndex={0}
        />
        <br/>
        <TextInput
          labelText="Idea Description"
          helperText=""
          id="editDescription"
          ref={editDescriptionRef}
          invalid={editDescriptionInvalid}
          onKeyPress={() => setEditDescriptionInvalid(false)}
          invalidText="This is a required field."
          placeholder="Enter your the idea's description"
          tabIndex={0}
        />
        <ComboBox
          id="editDomain"
          selectedItem={editSelectedDomain}
          onChange={item => {
            if (item.selectedItem !== null) {
              setEditDomainInvalid(false);
              setEditSelectedDomain(item.selectedItem);
            };
            if (item.selectedItem === null) setEditSelectedDomain({});
          }}
          placeholder="Select"
          invalid={editDomainInvalid}
          invalidText="This is a required field." 
          items={domainList.current}
          itemToString={item => item ? item.ideadomainname:''}
          itemToElement={item => {
            return <>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <div>{item.ideadomainname}</div>
                <div style={{
                  backgroundColor:item.ideadomaincolorhex,
                  width:'15%',
                  borderRadius:'5px'
                }}>
                    <p>&nbsp;</p>
                </div>
              </div>
            </>
          }}
          
          titleText="Idea Domain"
          helperText=""
        />
      </Modal>
      <Modal
        danger
        size='sm'
        modalHeading='Confirm Delete'
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={() => {
          setModalDeleteOpen(false);
          setIdeaToDelete({ideaid:"", ideadescription:""});
        }}
        onRequestSubmit={() => {
          setModalDeleteOpen(false);
          DeleteIdea(ideaToDelete.ideaid);
        }}
        open={modalDeleteOpen}
      >
        <p>Are you sure you want to delete {ideaToDelete.ideaid} {ideaToDelete.ideadescription}?</p>
      </Modal>

      <Content>
        <div style={{display:displayTable, height:'10px'}} className="bx--grid bx--grid--full-width adminPageBody">
        <div className="bx--row bx--offset-lg-1 ManageIdeas__r1" >
          <div id='file'/>
            <div className="bx--col-lg-15">
              <DataTable
                rows={ideasList}
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
                  <TableContainer title="Ideas" description={`Displays list of all ideas to be considered at the ISR. Total ideas: ${ideasList.length}`}>
                    <TableToolbar>
                      <TableToolbarContent>
                        <TableToolbarSearch onChange={onInputChange} />
                      </TableToolbarContent>
                      <Button
                        renderIcon={Add}
                        hasIconOnly
                        iconDescription='Add Idea'
                        onClick={async() => {
                          const maxSequence = await GetSequenceNumber();
                          GetDomains();
                          let sequenceNumber = parseInt(maxSequence[0].max_sequence);
                          if (isNaN(sequenceNumber)) sequenceNumber = 1
                          else {sequenceNumber++};
                          setAddSequenceValue(sequenceNumber);
                          setModalAddOpen(true);
                        }}
                      />
                      <Button 
                        renderIcon={DocumentImport} 
                        hasIconOnly 
                        iconDescription='Import Ideas List'
                        kind='secondary'
                        onClick={() => setModalImportOpen(true)}
                      />
                      <Button
                        kind='danger'
                        onClick={() => {
                          setIdeaToDelete({ideaid:"all", ideadescription:"ideas"});
                          setModalDeleteOpen(true);
                        }}
                        children={<><TrashCan/> Delete All</>}
                      />
                    </TableToolbar>
                    <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map(header => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
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
        </div>
        <div style={{display:displaySkeleton}} className="bx--offset-lg-3 bx--col-lg-13">
          <DataTableSkeleton columnCount={3} headers={headers}/>
        </div>
      </Content>
    </>
  );
};