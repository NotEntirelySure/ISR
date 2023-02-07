import React, { useState, useEffect, useRef } from 'react'
import { 
    Button, 
    Content,
    DataTable,
    DataTableSkeleton,
    TextInput,
    Modal,
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
} from '@carbon/react';
import { Add, TrashCan } from '@carbon/react/icons';

const headers = [
  {key:'officeID', header:'Office ID'},
  {key:'officeName', header:'Office Name'},
  {key:'action', header:'Action'}
];

export default function AdminOfficesPage() {
  
  
  const officeToDelete = useRef({officeName:""});
  const addName = useRef();

  const [rows, setRows] = useState([{id:'0',officeID:'-',officeName:'-',action: '-'}]);
  const [modalAddOpen, setModalAddOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [errorInfo, setErrorInfo] = useState({heading:'',message:''});
  const [addNameInvalid, setAddNameInvalid] = useState(false);
  const [invalidMessage, setInvalidMessage] = useState("");
  const [displayTable, setDisplayTable] = useState('none');
  const [displaySkeleton, setDisplaySkeleton] = useState('block');

  useEffect(() => GetOffices(),[]);
  useEffect(() => {
    if (errorInfo.heading !== '') {
      setModalErrorOpen(true)
      if (modalAddOpen) setModalAddOpen(false);
      if (modalDeleteOpen) setModalDeleteOpen (false);
      addName.current.value = "";
      officeToDelete.current = "";
    }
  },[errorInfo]);
    
  function GetOffices() {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/offices`, {mode:'cors'})
    .then(response => response.json())
    .then(data => {
      let offices = [];
      for (let i=0; i<data.rows.length; i++){
        offices.push({
          id:String(i),
          officeID:data.rows[i].officeid,
          officeName:data.rows[i].officename,
          action:
            <>
              <Button 
                hasIconOnly
                size="md"
                renderIcon={TrashCan}
                iconDescription='Delete office'
                kind="danger"
                onClick={() => {
                  officeToDelete.current = {
                    officeID:data.rows[i].officeid,
                    officeName:data.rows[i].officename
                  };
                  setModalDeleteOpen(true);
                }}
              />
            </>
        })
      }
      setDisplayTable('block');
      setDisplaySkeleton('none');
      setRows(offices);

    })
  }

  async function AddOffice() {
    
    setAddNameInvalid(false);
    setInvalidMessage("");

    const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/addoffice`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({officeName:addName.current.value,token:localStorage.getItem("adminjwt")})   
    })

    const addResponse = await addRequest.json();
    switch (addResponse.code) {
      case 201:
        setModalAddOpen(false);
        setAddNameInvalid(false);
        setInvalidMessage("");
        addName.current.value = "";
        GetOffices();
        break;
      
      case 401:
      case 403:
      case 500:
        setErrorInfo({
          heading:"Error Adding Office",
          message:`${addResponse.code}: ${addResponse.message}`
        })
        break;

      case 409:
        setModalAddOpen(false);
        setAddNameInvalid(false);
        setInvalidMessage("");
        setErrorInfo({
          heading:"Office Already Exists",
          message:`No office was added. ${addName.current.value} already exists.`
        })
        break;
      case 600:
        setAddNameInvalid(true);
        setInvalidMessage("The office name cannot be null");
        break;
      
      case 601:
        setAddNameInvalid(true);
        setInvalidMessage("The office name cannot contain any spaces");
        break;
    }
  }

  async function DeleteOffice() {
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/deleteoffice`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({"officeId":officeToDelete.current.officeID, token:localStorage.getItem("adminjwt")})    
    })
    const deleteResponse = await deleteRequest.json();
    if (deleteResponse.code === 200) GetOffices();
    if (deleteResponse.code !== 200) {
      setErrorInfo({
        heading:`Error Deleting ${officeToDelete.current.officeName}`,
        message:`Error ${deleteResponse.code}: ${deleteResponse.message}`
    })}
  }

  return (
    <>
      <Modal
        id='modalAdd' 
        primaryButtonText="Add"
        secondaryButtonText="Cancel"
        shouldSubmitOnEnter={true}
        modalHeading='Add Office'
        onRequestClose={() => {
          setModalAddOpen(false);
          setAddNameInvalid(false);
          setInvalidMessage("");
          addName.current.value = "";
        }}
        onRequestSubmit={() => AddOffice()} 
        open={modalAddOpen}>
        
        <TextInput
          style={{ marginBottom: '1rem'}}
          labelText="Office Name"
          helperText=""
          id="addName"
          ref={addName}
          invalid={addNameInvalid}
          onKeyPress={() => {if(addNameInvalid) setAddNameInvalid(false)}}
          invalidText={invalidMessage}
          placeholder="Enter the name of the office"
          tabIndex={0}
        />
      </Modal>
      <Modal
        danger
        modalHeading='Confirm Delete'
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={() => setModalDeleteOpen(false)}
        onRequestSubmit={() => {
          setModalDeleteOpen(false);
          DeleteOffice();
        }}
        open={modalDeleteOpen}>
          <p>Are you sure you want to delete office {officeToDelete.current.officeName}?</p>
      </Modal>
      <Modal
        id="modalError"
        open={modalErrorOpen}
        modalHeading={errorInfo.heading}
        primaryButtonText="Ok"
        onRequestSubmit={() => setModalErrorOpen(false)}
        onRequestClose={() => setModalErrorOpen(false)}
        shouldSubmitOnEnter={true}
      >
        {errorInfo.message}
      </Modal>
      <Content>
        <div style={{display: `${displayTable}`}} className="bx--grid bx--grid--full-width adminPageBody">
          <div className="bx--row bx--offset-lg-1 admin-offices-page__r1" >
            <div className="bx--col-lg-15">
              <DataTable
                rows={rows}
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
                  <TableContainer 
                    title="Offices" 
                    description="Displays list of all office names that participants can choose from when registering."
                    >
                    <TableToolbar>
                        <TableToolbarContent>
                            <TableToolbarSearch onChange={onInputChange} />
                        </TableToolbarContent>
                        <Button renderIcon={Add} hasIconOnly iconDescription='Add Office' onClick={() => setModalAddOpen(true)}/>
                    </TableToolbar>
                    <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>)
                      )}
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
          <DataTableSkeleton columnCount={3} headers={headers}/>
        </div>
      </Content>
    </>
  );
}