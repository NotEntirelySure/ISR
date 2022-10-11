import React, { useState, useEffect, useRef} from 'react'
import { 
    Button, 
    DataTable,
    ComposedModal,
    Content,
    Modal,
    ModalBody,
    ModalHeader,
    ModalFooter,
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
import { Logout, TrashCan, Renew, WarningHexFilled } from '@carbon/react/icons';

const headers = [
  {key: 'voterid', header: 'User ID'},
  {key: 'title', header: 'Title'},
  {key: 'fname', header: 'First Name'},
  {key: 'lname', header: 'Last Name'},
  {key: 'office', header: 'Office'},
  {key: 'loggedin', header:'Logged In?'},
  {key: 'action', header: 'Action'}
];
export default function AdminUsersPage() {

  const [rows, setRows] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const userToDelete = useRef({});

  useEffect(() => {GetAllUsers();},[])
  
  const GetAllUsers = async() => {
    const allVotersRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getvoterinfo/all`, {mode:'cors'})
    const allVotersResponse = await allVotersRequest.json();
    let users = [];
    for (let i=0; i<allVotersResponse.rows.length; i++){
      users.push({
        id:String(allVotersResponse.rows[i].participantid),
        voterid:allVotersResponse.rows[i].participantid,
        title:allVotersResponse.rows[i].participanttitle,
        fname:allVotersResponse.rows[i].participantfname,
        lname:allVotersResponse.rows[i].participantlname,
        office:allVotersResponse.rows[i].officename,
        loggedin:allVotersResponse.rows[i].participantloggedin ? "Yes":"No",
        action:
          <>
            <div style={{marginTop:'-1rem'}}>
              <Button 
                hasIconOnly
                renderIcon={TrashCan}
                iconDescription='Delete User'
                kind="danger"
                onClick={() => {
                  userToDelete.current = {
                    voterid:allVotersResponse.rows[i].participantid,
                    title:allVotersResponse.rows[i].participanttitle,
                    fname:allVotersResponse.rows[i].participantfname,
                    lname:allVotersResponse.rows[i].participantlname
                  }
                  setModalOpen(true);
                }}
              />
              <Button 
                hasIconOnly
                disabled={!allVotersResponse.rows[i].participantloggedin}
                renderIcon={Logout}
                iconDescription='Log user out'
                kind="primary"
                onClick={() => LogUserOut(allVotersResponse.rows[i].participantid)}
              />
            </div>
          </>
        }
      )
    }
    setRows(users);
  }

  const DeleteUser = async() => {
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/deletevoter`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"voterID":"${userToDelete.current.voterid}"}`    
    })
    const deleteResponse = await deleteRequest.json();

    if (deleteResponse.result === "error" && parseInt(deleteResponse.code) === 23503) {
      setErrorTitle("Error: Foreign Key Violation");
      setErrorMessage(`Could not delete ${userToDelete.current.title} ${userToDelete.current.fname} ${userToDelete.current.lname} because they are still referenced in the votes table in the database. To delete this user, ensure there are no votes associated with this user, and try again.`)
      setModalErrorOpen(true);
    }
    if (deleteResponse.code === 200) GetAllUsers();
  }

  const LogUserOut = async(voterId) => {
    const logoutRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/userlogout`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"voterId":"${voterId}"}`    
    })
    const logoutResponse = await logoutRequest.json();
    GetAllUsers();
  }

  return (
    <>  
      <Modal
        danger
        modalHeading='Confirm Delete'
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={() => {
          setModalOpen(false);
          DeleteUser();
        }}
        open={modalOpen}>
          <p>Are you sure you want to delete {userToDelete.current.title} {userToDelete.current.fname} {userToDelete.current.lname}?</p>
      </Modal>
      <ComposedModal
          size='sm'
          preventCloseOnClickOutside={true}
          open={modalErrorOpen}
          onClose={() => setModalErrorOpen(false)}
        >
          <ModalHeader>
            <dir style={{display:'flex',gap:'1rem',color:'#DA1E28'}}>
            <WarningHexFilled size='32'/>
            <h4>{errorTitle}</h4>
            </dir>
          </ModalHeader>
          <ModalBody><p style={{marginLeft:'2rem'}}>{errorMessage}</p></ModalBody>
          <ModalFooter>
            <Button 
              onClick={() => {
                setErrorTitle("");
                setErrorMessage("");
                setModalErrorOpen(false);
              }}
            >
              Ok
            </Button>
          </ModalFooter>
        </ComposedModal>
      <Content>
        <div className="bx--offset-lg-1 bx--grid bx--grid--full-width adminPageBody">
          <DataTable
            id="userTable"
            stickyHeader={true}
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
                title="Users"
                description="Displays list of all registered users"
                
              >
                <TableToolbar>
                  <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                  </TableToolbarContent>
                  <Button renderIcon={Renew} hasIconOnly iconDescription='Refresh Table' onClick={() => GetAllUsers()}/>
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
      </Content>
    </>
  );
}





