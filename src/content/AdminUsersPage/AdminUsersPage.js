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
  
  const userToDelete = useRef({voterid:"",title:"",fname:"",lname:""})
  const errorInfo = useRef({heading:"", message:""});

  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  const [displaySkeleton, setDisplaySkeleton] = useState('block');
  const [displayTable, setDisplayTable] = useState('none');
  const [rows, setRows] = useState([{id:'0', voterid:'-', title:'-', fname:'-', lname:'-', office: '-', action:"-"}])
  const [modalOpen, setModalOpen] = useState(false);
  
  useEffect(() => GetAllParticipants(),[])
  
  async function GetAllParticipants() {
    const participantsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const participantsResponse = await participantsRequest.json()
    if (participantsResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${participantsResponse.code}`, message:participantsResponse.type}
      setModalErrorOpen(true);
      return;
    }
    const participants = participantsResponse.data.rows.map((participant) => {
      return {
        id:String(participant.participantid),
        voterid:participant.participantid,
        title:participant.participanttitle,
        fname:participant.participantfname,
        lname:participant.participantlname,
        office:participant.officename,
        loggedin:participant.participantloggedin ? "Yes":"No",
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
                  voterid:participant.participantid,
                  title:participant.participanttitle,
                  fname:participant.participantfname,
                  lname:participant.participantlname
                }
                setModalOpen(true);
              }}
            />
            <Button 
              hasIconOnly
              size="md"
              disabled={!participant.participantloggedin}
              renderIcon={Logout}
              iconDescription='Log user out'
              kind="primary"
              onClick={() => ParticipantLogout(participant.participantid)}
            />
          </div>
        </>
      };
    });
      
    setRows(participants);
    setDisplaySkeleton('none');
    setDisplayTable('block');
  }

  async function DeleteParticipant() {
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/delete`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "participantId":userToDelete.current.voterid,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const deleteResponse = await deleteRequest.json();
    if (deleteResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${deleteResponse.code}`, message:deleteResponse.message.detail}
      setModalErrorOpen(true);
      return;
    }
    if (deleteResponse.code === 200) GetAllParticipants();
  }

  async function ParticipantLogout(participantId) {
    const logoutRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/logout`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "participantId":participantId,
        "source":"admin",
        "token":localStorage.getItem('adminjwt')
      })    
    });
    const logoutResponse = await logoutRequest.json();
    GetAllParticipants();
  }

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
        <div>{errorInfo.current.message}</div>
      </Modal>
      <Modal
        danger
        modalHeading='Confirm Delete'
        primaryButtonText="Delete"
        secondaryButtonText="Cancel"
        onRequestClose={() => setModalOpen(false)}
        onRequestSubmit={() => {
          setModalOpen(false);
          DeleteParticipant();
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
                  <Button renderIcon={Renew} hasIconOnly iconDescription='Refresh Table' onClick={() => GetAllParticipants()}/>
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