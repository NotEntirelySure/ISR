import React, { useState, useEffect } from 'react'
import { 
    Button, 
    Content,
    DataTable,
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
    TextInput
} from '@carbon/react';
import {
  Add,
  RequestQuote,
  TrashCan
} from '@carbon/react/icons';

const headers = [
    {key:'projectdomainid', header:'Domain ID'},
    {key:'projectdomainname', header:'Domain Name'},
    {key:'projectdomaincolor',header: 'Domain Color'},
    {key:'projectdomaincolorhex', header:'Color Hex Value'},
    {key:'action', header:'Action'}
];
  
const AdminDomainsPage = () => {

  const [domainsList, setDomainsList] = useState([]);
  const [domainToEdit, setDomainToEdit] = useState({"domainId":"", "domainName":"","colorHex":""});
  const [domainToDelete, setDomainToDelete] = useState({"domainId":"", "domainName":""});
  
  const [modalAddOpen, setModalAddOpen] = useState();
  const [modalEditOpen, setModalEditOpen] = useState();
  const [modalDeleteOpen, setModalDeleteOpen] = useState();

  const [addNameInvalid, setAddNameInvalid] = useState(false);
  const [addColorInvalid, setAddColorInvalid] = useState(false);
  const [editNameInvalid, setEditNameInvalid] = useState(false);
  const [editColorInvalid, setEditColorInvalid] = useState(false);

  const [colorInvalidMessage, setColorInvalidMessage] = useState('');
  const [previewColor, setPreviewColor] = useState('');

  useEffect(() => {getDomains();}, [])

  const getDomains = async() => {
    const domainsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getdomains`, {mode:'cors'})
    const domainsResponse = await domainsRequest.json();
    
    let domains = [];
    for (let i=0;i<domainsResponse.length;i++) {
      domains.push({
        id:String(domainsResponse[i].projectdomainid),
        "projectdomainid":domainsResponse[i].projectdomainid,
        "projectdomainname":domainsResponse[i].projectdomainname,
        "projectdomaincolor":
          <>
            <div 
              style={{
                backgroundColor:domainsResponse[i].projectdomaincolorhex,
                width:'40%',
                borderRadius:'5px'
              }}
            >
              <p>&nbsp;</p>
            </div>
          </>,
        "projectdomaincolorhex":domainsResponse[i].projectdomaincolorhex,
        "action":
          <>
            <Button
              hasIconOnly
              renderIcon={RequestQuote}
              iconDescription='Edit Domain'
              kind="primary"
              onClick={() => {
                setDomainToEdit({
                  "domainId":domainsResponse[i].projectdomainid,
                  "domainName":domainsResponse[i].projectdomainname,
                  "colorHex":domainsResponse[i].projectdomaincolorhex,
                });
                document.getElementById("editName").value =  domainsResponse[i].projectdomainname;
                document.getElementById("editColor").value = domainsResponse[i].projectdomaincolorhex; 
                setPreviewColor(domainsResponse[i].projectdomaincolorhex);
                setModalEditOpen(true);
              }}
            />
            <Button 
              hasIconOnly
              renderIcon={TrashCan}
              iconDescription='Delete Domain'
              kind="danger"
              onClick={() => {
                setDomainToDelete({
                  "domainId":domainsResponse[i].projectdomainid,
                  "domainName":domainsResponse[i].projectdomainname
                });
                setModalDeleteOpen(true);
              }}
            />
          </>
      })
    }
    setDomainsList(domains);
  }

  const addDomain = async() => {
    let name = document.getElementById("addName");
    let color = document.getElementById("addColor");
    
    if (name.value === "" || name.value === null || name.value === undefined) {
      setAddNameInvalid(true);
      return;
    }
    if (color.value.indexOf("#") <= -1 || color.value.indexOf("#") > 0) {
      setColorInvalidMessage("The hexadecimal color value must start with an octothorpe (#)");
      setAddColorInvalid(true);
      return;
    }
    if (color.value.length < 7 || color.value.length > 7) {
      setColorInvalidMessage("The hexadecimal color value must be exactly 7 characters; including the octothorpe (#)");
      setAddColorInvalid(true);
      return;
    }
    setModalAddOpen(false);
    const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/adddomain`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"domainName":"${name.value}","colorHex":"${color.value}"}`    
    })
    const addResponse = await addRequest.json();
    getDomains();

    setPreviewColor('');
    name.value = '';
    color.value = '';
  }

  const editDomain = async() => {
    let name = document.getElementById("editName");
    let color = document.getElementById("editColor");
    
    if (name.value === "" || name.value === null || name.value === undefined) {
      setEditNameInvalid(true);
      return;
    }
    if (color.value.indexOf("#") <= -1 || color.value.indexOf("#") > 0) {
      setColorInvalidMessage("The hexadecimal color value must start with an octothorpe (#)");
      setEditColorInvalid(true);
      return;
    }
    if (color.value.length < 7 || color.value.length > 7) {
      setColorInvalidMessage("The hexadecimal color value must be exactly 7 characters; including the octothorpe (#)");
      setEditColorInvalid(true);
      return;
    }
    setModalEditOpen(false);
    const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/editdomain`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"domainId":"${domainToEdit.domainId}","domainName":"${name.value}","colorHex":"${color.value}"}`    
    })
    const editResponse = await editRequest.json();
    getDomains();

    setPreviewColor('');
    name.value = '';
    color.value = '';
  }

  const deleteDomain = async() => {
    setModalDeleteOpen(false);
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/deletedomain`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"domainId":"${domainToDelete.domainId}"}`    
    });
    const deleteResponse = await deleteRequest.json();
    getDomains();
  }

  return (
    <Content>
      <Modal
        id='modalAdd' 
        primaryButtonText="Add"
        secondaryButtonText="Cancel"
        modalHeading='Add Domain'
        onRequestClose={() => {
          setModalAddOpen(false);
          setAddNameInvalid(false);
          setAddColorInvalid(false);
          setPreviewColor('');
          document.getElementById("addName").value = "";
          document.getElementById("addColor").value = "";
        }}
        onRequestSubmit={() => addDomain()}
        open={modalAddOpen}>
        <TextInput
          labelText="Domain Name"
          placeholder="Enter domain name"
          helperText=""
          id="addName"
          invalid={addNameInvalid}
          invalidText="This is a required field."
          tabIndex={0}
          onKeyPress={(event) => {
            if (addColorInvalid) setAddColorInvalid(false);
            if (event.key === 'Enter') addDomain()
          }}
        />
        <br/>
        <div style={{display:'flex'}}>
          <div style={{width:'40%', marginRight:'10%'}}>
        <TextInput
          labelText="Domain Color Hex Value"
          placeholder="Enter the color's hex value"
          helperText="Example: #78277E"
          id="addColor"
          invalid={addColorInvalid}
          invalidText={colorInvalidMessage}
          tabIndex={0}
          onPaste={() => {
            if (document.getElementById("addColor").value.indexOf("#") === 0 && document.getElementById("addColor").value.length === 7) {
              setPreviewColor(document.getElementById("addColor").value)
            }
          }}
          onKeyUp={(event) => {
            if (addColorInvalid) setAddColorInvalid(false);
            if (document.getElementById("addColor").value.indexOf("#") === 0 && document.getElementById("addColor").value.length === 7) {
              setPreviewColor(document.getElementById("addColor").value)
            }
            if (document.getElementById("addColor").value.indexOf("#") !== 0 || document.getElementById("addColor").value.length !== 7) {
              setPreviewColor("")
            }
            if (event.key === 'Enter') addDomain();
          }}
        />
        </div>
        <div id='colorPreview' style={{backgroundColor:previewColor}}><p>Color Preview</p></div>
        </div>
      </Modal>
      <Modal
        id='modalEdit' 
        primaryButtonText="Save"
        secondaryButtonText="Cancel"
        modalHeading={`Edit Domain ${domainToEdit.domainName}`}
        onRequestClose={() => {
          setModalEditOpen(false);
          setEditNameInvalid(false);
          setEditColorInvalid(false);
          setPreviewColor('');
          document.getElementById("editName").value = "";
          document.getElementById("editColor").value = "";
        }}
        onRequestSubmit={() => editDomain()}
        open={modalEditOpen}>
        <TextInput
          labelText="Domain Name"
          helperText=""
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
        <br/>
        <div style={{display:'flex'}}>
          <div style={{width:'40%', marginRight:'10%'}}>
        <TextInput
          labelText="Domain Color Hex Value"
          helperText="Example: #78277E"
          id="editColor"
          invalid={editColorInvalid}
          invalidText={colorInvalidMessage}
          placeholder="Enter the color's hex value"
          tabIndex={0}
          onPaste={() => {
            if (document.getElementById("editColor").value.indexOf("#") === 0 && document.getElementById("editColor").value.length === 7) {
              setPreviewColor(document.getElementById("editColor").value)
            }
          }}
          onKeyUp={(event) => {
            if (editColorInvalid) setEditColorInvalid(false);
            if (document.getElementById("editColor").value.indexOf("#") === 0 && document.getElementById("editColor").value.length === 7) {
              setPreviewColor(document.getElementById("editColor").value)
            }
            if (document.getElementById("editColor").value.indexOf("#") !== 0 || document.getElementById("editColor").value.length !== 7) {
              setPreviewColor("")
            }
            if (event.key === 'Enter') addDomain();
          }}
        />
        </div>
        <div id='colorPreview' style={{backgroundColor:previewColor}}><p>Color Preview</p></div>
        </div>
      </Modal>
      <Modal
        danger
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
      <div className="bx--grid bx--grid--full-width adminPageBody">
        <div className="bx--row bx--offset-lg-1 domainsadmin__r1">
      <div  className="bx--col-lg-15">
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
      </div>
        </div>
      </Content>
    )
}

export default AdminDomainsPage;