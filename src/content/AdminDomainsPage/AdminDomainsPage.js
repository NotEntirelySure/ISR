import React, { useState, useEffect, useRef } from 'react'
import { 
  Button, 
  Content,
  DataTable,
  DataTableSkeleton,
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
  Tag,
  TextInput,
  Form,
  Stack
} from '@carbon/react';
import {
  Add,
  Edit,
  TrashCan,
  WarningAltFilled
} from '@carbon/react/icons';

const headers = [
  {key:'ideadomainid', header:'Domain ID'},
  {key:'ideadomainname', header:'Domain Name'},
  {key:'ideadomaincolor',header: 'Domain Color'},
  {key:'ideadomaincolorhex', header:'Color Hex Value'},
  {key:'action', header:'Action'}
];
  
export default function AdminDomainsPage() {

  const addNameRef = useRef();
  const addColorRef = useRef();
  const editNameRef = useRef();
  const editColorRef = useRef();
  const errorInfo = useRef({heading:"", message:""});

  const [displaySkeleton, setDisplaySkeleton] = useState('block');
  const [displayTable, setDisplayTable] = useState('none');
  const [domainsList, setDomainsList] = useState([]);
  const [domainToEdit, setDomainToEdit] = useState({"domainId":"", "domainName":"","colorHex":""});
  const [domainToDelete, setDomainToDelete] = useState({"domainId":"", "domainName":""});
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [modalAddOpen, setModalAddOpen] = useState();
  const [modalEditOpen, setModalEditOpen] = useState();
  const [modalDeleteOpen, setModalDeleteOpen] = useState();
  const [addNameInvalid, setAddNameInvalid] = useState(false);
  const [addColorInvalid, setAddColorInvalid] = useState(false);
  const [editNameInvalid, setEditNameInvalid] = useState(false);
  const [editColorInvalid, setEditColorInvalid] = useState(false);
  const [colorInvalidMessage, setColorInvalidMessage] = useState('');
  const [previewColor, setPreviewColor] = useState('');

  useEffect(() => {GetDomains()}, []);

  async function GetDomains() {
    const domainsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const domainsResponse = await domainsRequest.json();
    if (domainsResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${domainsResponse.code}`, message:domainsResponse.message}
      setModalErrorOpen(true);
      return;
    }
    if (domainsResponse.code === 200) {
    const domains = domainsResponse.data.map(domain => {
      return {
        id:String(domain.ideadomainid),
        "ideadomainid":domain.ideadomainid,
        "ideadomainname":domain.ideadomainname,
        "ideadomaincolor":
          <>
            <Tag 
              style={{backgroundColor:domain.ideadomaincolorhex, width:'5rem'}}
            />
          </>,
        "ideadomaincolorhex":domain.ideadomaincolorhex,
        "action":
          <>
            <div style={{display:'flex', gap:'0.25rem'}}>
              <Button
                hasIconOnly
                size="md"
                renderIcon={Edit}
                iconDescription='Edit Domain'
                kind="primary"
                onClick={() => {
                  setDomainToEdit({
                    "domainId":domain.ideadomainid,
                    "domainName":domain.ideadomainname,
                    "colorHex":domain.ideadomaincolorhex,
                  });
                  editNameRef.current.value = domain.ideadomainname;
                  editColorRef.current.value = domain.ideadomaincolorhex; 
                  setPreviewColor(domain.ideadomaincolorhex);
                  setModalEditOpen(true);
                }}
              />
              <Button 
                hasIconOnly
                size="md"
                renderIcon={TrashCan}
                iconDescription='Delete Domain'
                kind="danger"
                onClick={() => {
                  setDomainToDelete({
                    "domainId":domain.ideadomainid,
                    "domainName":domain.ideadomainname
                  });
                  setModalDeleteOpen(true);
                }}
              />
            </div>
          </>
        };
      });
      setDomainsList(domains);
      setDisplaySkeleton('none');
      setDisplayTable('block');
    };
  }

  const addDomain = async() => {
    
    if (addNameRef.current.value === "" || addNameRef.current.value === null || addNameRef.current.value === undefined) {
      setAddNameInvalid(true);
      return;
    }
    if (addColorRef.current.value.indexOf("#") <= -1 || addColorRef.current.value.indexOf("#") > 0) {
      setColorInvalidMessage("The hexadecimal color value must start with an octothorpe (#)");
      setAddColorInvalid(true);
      return;
    }
    if (addColorRef.current.value.length < 7 || addColorRef.current.value.length > 7) {
      setColorInvalidMessage("The hexadecimal color value must be exactly 7 characters; including the octothorpe (#)");
      setAddColorInvalid(true);
      return;
    }
    setModalAddOpen(false);
    const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/add`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "domainName":addNameRef.current.value,
        "colorHex":addColorRef.current.value,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const addResponse = await addRequest.json();
    if (addResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${addResponse.code}`, message:addResponse.message}
      setModalErrorOpen(true);
      return;
    };
    if (addResponse.code === 200) GetDomains();

    setPreviewColor('');
    addNameRef.current.value = '';
    addColorRef.current.value = '';
  }

  const editDomain = async() => {
    
    if (editNameRef.current.value === "" || editNameRef.current.value === null || !editNameRef.current.value) {
      setEditNameInvalid(true);
      return;
    }
    if (editColorRef.current.value.indexOf("#") <= -1 || editColorRef.current.value.indexOf("#") > 0) {
      setColorInvalidMessage("The hexadecimal color value must start with an octothorpe (#)");
      setEditColorInvalid(true);
      return;
    }
    if (editColorRef.current.value.length < 7 || editColorRef.current.value.length > 7) {
      setColorInvalidMessage("The hexadecimal color value must be exactly 7 characters; including the octothorpe (#)");
      setEditColorInvalid(true);
      return;
    }
    setModalEditOpen(false);
    const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/edit`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "domainId":domainToEdit.domainId,
        "domainName":editNameRef.current.value,
        "colorHex":editColorRef.current.value,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const editResponse = await editRequest.json();
    if (editResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${editResponse.code}`, message:editResponse.message}
      setModalErrorOpen(true);
      return;
    };
    if (editResponse.code === 200) GetDomains();

    setPreviewColor('');
    editNameRef.current.value = '';
    editColorRef.current.value = '';
  }

  const deleteDomain = async() => {
    setModalDeleteOpen(false);
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/delete`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "domainId":domainToDelete.domainId,
        "token":localStorage.getItem('adminjwt')
      })    
    });
    const deleteResponse = await deleteRequest.json();
    if (deleteResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${deleteResponse.code}`, message:deleteResponse.message}
      setModalErrorOpen(true);
      return;
    };
    if (deleteResponse.code === 200) GetDomains();
  };

  return (
    <>
      <Modal
        id='modalError'
        modalHeading={errorInfo.current.heading}
        primaryButtonText="Ok"
        open={modalErrorOpen}
        onRequestClose={() => {
          setModalErrorOpen(false);
          errorInfo.current = ({heading:"", message:""});
        }}
        onRequestSubmit={() => {
          setModalErrorOpen(false);
          errorInfo.current = ({heading:"", message:""});
        }}
        >
        <div style={{display:'flex', gap:'2rem',alignItems:'center'}}>
          <div><WarningAltFilled size={56} fill="red"/></div>
          <div>{errorInfo.current.message}</div>
        </div>
      </Modal>
      <Modal
        id='modalAdd'
        size='xs'
        shouldSubmitOnEnter
        primaryButtonText="Add"
        secondaryButtonText="Cancel"
        modalHeading='Add Domain'
        onRequestClose={() => {
          setModalAddOpen(false);
          setAddNameInvalid(false);
          setAddColorInvalid(false);
          setPreviewColor('');
          addNameRef.current.value = "";
          addColorRef.current.value = "";
        }}
        onRequestSubmit={() => addDomain()}
        open={modalAddOpen}
        children={
          <Form>
            <Stack gap={5}>
              <TextInput
                labelText="Domain Name"
                placeholder="Enter domain name"
                ref={addNameRef}
                id="addName"
                invalid={addNameInvalid}
                invalidText="This is a required field."
                tabIndex={0}
                onChange={() => {if (addNameInvalid) setAddNameInvalid(false)}}
                />
              <div className='domainModalForm'>
                <div>
                  <TextInput
                    labelText="Domain Color Hex Value"
                    placeholder="Enter the color's hex value"
                    helperText="Example: #78277E"
                    ref={addColorRef}
                    id="addColor"
                    invalid={addColorInvalid}
                    invalidText={colorInvalidMessage}
                    tabIndex={0}
                    onPaste={() => {
                      if (addColorRef.current.value.indexOf("#") === 0 && addColorRef.current.value.length === 7) setPreviewColor(addColorRef.current.value);
                    }}
                    onKeyUp={(event) => {
                      if (addColorInvalid) setAddColorInvalid(false);
                      if (addColorRef.current.value.indexOf("#") === 0 && addColorRef.current.value.length === 7) setPreviewColor(addColorRef.current.value);
                      if (addColorRef.current.value.indexOf("#") !== 0 || addColorRef.current.value.length !== 7) setPreviewColor("");
                      if (event.key === 'Enter') addDomain();
                    }}
                    />
                </div>
                <div>
                  <input
                    type='color'
                    value={previewColor} 
                    className='colorPalette'
                    onChange={event => {
                      setPreviewColor(event.target.value);
                      addColorRef.current.value = event.target.value;
                    }}
                  />
                </div>
              </div>
            </Stack>
          </Form>
        }
      />
      <Modal
        id='modalEdit'
        size='xs'
        shouldSubmitOnEnter
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        modalHeading={`Edit Domain ${domainToEdit.domainName}`}
        open={modalEditOpen}
        onRequestSubmit={() => editDomain()}
        onRequestClose={() => {
          setModalEditOpen(false);
          setEditNameInvalid(false);
          setEditColorInvalid(false);
          setPreviewColor('');
          addNameRef.current.value = "";
          addColorRef.current.value = "";
        }}
        children={
          <Form>
            <Stack gap={5}>
              <TextInput
                labelText="Domain Name"
                ref={editNameRef}
                id="editName"
                invalid={editNameInvalid}
                invalidText="This is a required field."
                placeholder="Enter the domain"
                tabIndex={0}
                onKeyPress={(event) => {
                  if (editColorInvalid) setEditColorInvalid(false);
                  if (event.key === 'Enter') editDomain()
                }}
              />
              <div className='domainModalForm'>
                <div>
                  <TextInput
                    labelText="Domain Color Hex Value"
                    helperText="Example: #78277E"
                    ref={editColorRef}
                    id="editColor"
                    invalid={editColorInvalid}
                    invalidText={colorInvalidMessage}
                    placeholder="Enter the color's hex value"
                    tabIndex={0}
                    onPaste={() => {
                      if (editColorRef.current.value.indexOf("#") === 0 && editColorRef.current.value.length === 7) {
                        setPreviewColor(editColorRef.current.value)
                      }
                    }}
                    onKeyUp={(event) => {
                      if (editColorInvalid) setEditColorInvalid(false);
                      if (editColorRef.current.value.indexOf("#") === 0 && editColorRef.current.value.length === 7) {
                        setPreviewColor(editColorRef.current.value)
                      }
                      if (editColorRef.current.value.indexOf("#") !== 0 || editColorRef.current.value.length !== 7) {
                        setPreviewColor("")
                      }
                      if (event.key === 'Enter') addDomain();
                    }}
                    />
                </div>
                <div>
                  <input
                    type='color'
                    value={previewColor} 
                    className='colorPalette'
                    onChange={event => {
                      setPreviewColor(event.target.value);
                      editColorRef.current.value = event.target.value;
                    }}
                    />
                </div>
              </div>
            </Stack>
          </Form>
        }
      />
      
      <Modal
        danger
        size='xs'
        modalHeading='Confirm Delete'
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={() => {
          setModalDeleteOpen(false);
          setDomainToDelete({});
        }}
        onRequestSubmit={() => deleteDomain()}
        open={modalDeleteOpen}
        >
        <p>Are you sure you want to delete {domainToDelete.domainName}?</p>
      </Modal>
      <div className="adminPageBody">
        <div className="domainsadmin__r1">
          <div className="" style={{display: `${displayTable}`}}>
            <DataTable
              rows={domainsList}
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
                <TableContainer title="Idea Domains" description="Displays a list of all domains related to ISR ideas">
                <TableToolbar>
                  <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                  </TableToolbarContent>
                  <Button 
                    renderIcon={Add}
                    hasIconOnly
                    iconDescription='Add Vote'
                    onClick={() => setModalAddOpen(true)}
                  />
                </TableToolbar>
                <Table {...getTableProps()}>
                  <TableHead>
                    <TableRow>
                      {headers.map((header) => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {
                      rows.map((row) => (
                        <TableRow key={row.id} {...getRowProps({ row })}>
                          {row.cells.map((cell) => (<TableCell key={cell.id}>{cell.value}</TableCell>))}
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              )}
              />
          </div>
          <div className="bx--col-lg-15" style={{display:`${displaySkeleton}`}}>
            <DataTableSkeleton columnCount={4} headers={headers}/>
          </div>
        </div>
      </div>
    </>
  );
};