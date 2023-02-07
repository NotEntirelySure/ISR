import React, { useState, useEffect, useRef } from 'react'
import { 
    Button, 
    DataTable,
    DataTableSkeleton,
    Content,
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
import { Logout, TrashCan, Renew } from '@carbon/react/icons';

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
  
  const [displaySkeleton, setDisplaySkeleton] = useState('block');
  const [displayTable, setDisplayTable] = useState('none');

  const userToDelete = useRef({voterid:"",title:"",fname:"",lname:""})
  
  const [rows, setRows] = useState([{id:'0', voterid:'-', title:'-', fname:'-', lname:'-', office: '-', action:"-"}])
  const [modalOpen, setModalOpen] = useState(false);
  
  useEffect(() => {GetAllUsers();},[])
  
  function GetAllUsers() {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/getallvoters`, {mode:'cors'})
    .then(response => response.json())
    .then(data => {
  
      let users = [];
      for (let i=0; i<data.rows.length; i++){
        users.push({
          id:String(data.rows[i].participantid),
          voterid:data.rows[i].participantid,
          title:data.rows[i].participanttitle,
          fname:data.rows[i].participantfname,
          lname:data.rows[i].participantlname,
          office:data.rows[i].officename,
          loggedin:data.rows[i].participantloggedin ? "Yes":"No",
          action:
            <>
              <div style={{display:'flex', gap:'0.25rem'}}>
                <Button 
                  hasIconOnly
                  size="md"
                  renderIcon={TrashCan}
                  iconDescription='Delete User'
                  kind="danger"
                  onClick={() => {
                    userToDelete.current = {
                      voterid:data.rows[i].participantid,
                      title:data.rows[i].participanttitle,
                      fname:data.rows[i].participantfname,
                      lname:data.rows[i].participantlname
                    }
                    setModalOpen(true);
                  }}
                />
                <Button 
                  hasIconOnly
                  size="md"
                  disabled={!data.rows[i].participantloggedin}
                  renderIcon={Logout}
                  iconDescription='Log user out'
                  kind="primary"
                  onClick={() => LogUserOut(data.rows[i].participantid)}
                />
              </div>
            </>
          }
        )
      }
      setRows(users);
      setDisplaySkeleton('none');
      setDisplayTable('block');
    })
  }

  function DeleteUser() {
    fetch(`${process.env.REACT_APP_API_BASE_URL}/deletevoter`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:`{"voterID":"${userToDelete.current.voterid}"}`    
    })
      .then(response => response.json())
      .then(data => {
        if (data.severity === 'ERROR') {alert(data.severity + ": " + data.detail)}
        else {GetAllUsers();}
      })
  }

  async function LogUserOut(voterId) {
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
      <Content>
        <div 
          className="bx--offset-lg-1 bx--grid bx--grid--full-width adminPageBody"
          style={{display: `${displayTable}`}}
        >
          <DataTable
            id="userTable"
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
        <div
          className="bx--offset-lg-1 bx--grid bx--grid--full-width adminPageBody"
          style={{display: `${displaySkeleton}`}}
        >
          <DataTableSkeleton columnCount={4} headers={headers}/>
        </div>
      </Content>
    </>
  );
}