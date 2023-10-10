import React, { useState, useEffect, useRef } from 'react'
import { 
  Button,
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
  TableToolbarSearch
} from '@carbon/react';
import { Renew, WarningAltFilled } from '@carbon/react/icons';

const headers = [  
  {key:'changeid',header:"Change ID"},
  {key:'changevoteid',header:"Vote ID"},
  {key:'changeaction',header:"Change Action"},
  {key:'changepreviousvalue',header:"Previous Value"},
  {key:'changenewvalue',header:"New Value"},
  {key:'changetime',header:"Time of Change"},
  {key:'changecomment',header:"Comments"},
];
  
export default function AdminLogsPage() {

  const errorInfo = useRef({});

  const [displaySkeleton, setDisplaySkeleton] = useState('block');
  const [displayTable, setDisplayTable] = useState('none');
  const [logList, setLogList] = useState([]);
  const [modalErrorOpen, setModalErrorOpen] = useState(false);
  
  useEffect(() => {GetLogs()}, []);

  async function GetLogs() {
    const logsRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/changelogs/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const logsResponse = await logsRequest.json();
    if (logsResponse.code !== 200) {
      errorInfo.current = {heading:`Error ${logsResponse.code}`, message:logsResponse.message}
      setModalErrorOpen(true);
      return;
    }
    if (logsResponse.code === 200) {
    const logs = logsResponse.data.rows.map(log => (
      {
        id:String(log.changeid),
        "changeid":log.changeid,
        "changevoteid":log.changevoteid,
        "changepreviousvalue":log.changepreviousvalue,
        "changenewvalue":log.changenewvalue,
        "changetime":log.changetime,
        "changeaction":log.changeaction,
        "changecomment":log.changecomment
      }
    ));
      setLogList(logs);
      setDisplaySkeleton('none');
      setDisplayTable('block');
    };
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
        <div style={{display:'flex', gap:'2rem',alignItems:'center'}}>
          <div><WarningAltFilled size={56} fill="red"/></div>
          <div>{errorInfo.current.message}</div>
        </div>
      </Modal>
      
      <div className="adminPageBody">
        <div className="logsAdmin">
          <div className="" style={{display: `${displayTable}`}}>
            <DataTable
              rows={logList}
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
                <TableContainer title="Change Logs" description="Displays the change log recorded in the system.">
                <TableToolbar>
                  <TableToolbarContent>
                      <TableToolbarSearch onChange={onInputChange} />
                      <Button renderIcon={Renew} hasIconOnly iconDescription='Refresh Table' onClick={() => GetLogs()}/>
                  </TableToolbarContent>
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
          <div className="logsAdmin" style={{display:`${displaySkeleton}`}}>
            <DataTableSkeleton columnCount={4} headers={headers}/>
          </div>
        </div>
      </div>
    </>
  );
};