import React, { Component } from 'react'
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
    TextInput,
    Tile,
    Tooltip
} from '@carbon/react';
import {
  Add,
  DocumentImport,
  Information,
  TrashCan,
  RequestQuote,
  WarningHex
} from '@carbon/react/icons';

const headers = [
  {key:'projectsequence', header: 'Sequence Number'},
  {key:'projectid', header:'Project ID'},
  {key:'projectdescription', header:'Project Description'},
  {key:'projectdomainname', header:'Project Domain'},
  {key:'projectdomaincolor', header:'Domain Color'},
  {key:'action', header:'Action'}
];

const items = ['Option 1', 'Option 2', 'Option 3']
class AdminIdeasPage extends Component {
  
  constructor(props) {
    super(props)
    this.state = {
      projectList: [{id:'0', projectid:'-', projectdescription:'-', action:'-'}],
      domainList:[],
      projectToDelete: {projectid:"", projectdescription:""},
      projectToEdit: {projectid:"", projectdescription:""},
      modalDeleteOpen: false,
      modalAddOpen: false,
      modalImportOpen:false,
      modalEditOpen: false,
      addSequenceInvalid:false,
      addIdInvalid:false,
      addDomainInvalid:false,
      addDescriptionInvalid:false,
      addSequenceValue:0,
      addSelectedDomain:{},
      editSelectedDomain:{},
      editSequenceInvalid:false,
      editIdInvalid:false,
      editDescriptionInvalid:false,
      editDomainInvalid:false,
      editSequenceValue:0,
      displayTable: 'none',
      displaySkeleton: 'block',
      fileUpload:'',
      importButtonDisabled:true,
      errorInfo:{heading:"", message:""},
      modalErrorOpen:false
    }
  }

  componentDidMount() {this.GetProjects();}

  GetProjects = async() => {
    const ideasRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'})
    const ideasResponse = await ideasRequest.json();
    if (ideasResponse.code !== 200) return;
    const ideas = ideasResponse.data.rows.map((idea, index) => {
      return {
        id:String(index),
        projectsequence:idea.projectsequence,
        projectid:idea.projectid,
        projectdescription:idea.projectdescription,
        projectdomainid:idea.projectdomainid,
        projectdomainname:idea.projectdomainname,
        projectdomaincolor:
          <>
            <div style={{display:'flex', justifyContent:'space-between'}}>
              <div><p>{idea.projectdomaincolorhex}</p></div>
              <div style={{
                backgroundColor:idea.projectdomaincolorhex,
                width:'40%',
                borderRadius:'5px'
              }}>
                <p>&nbsp;</p>
              </div>
            </div>
          </>,
        projectdomaincolorhex:idea.projectdomaincolorhex,
        action:
          <>
            <div style={{display:'flex', gap:'0.25rem'}}>
              <Button
                hasIconOnly
                size="md"
                renderIcon={RequestQuote}
                iconDescription='Edit Project'
                kind="primary"
                onClick={async() => {
                  this.setState({editSequenceValue:idea.projectsequence});
                  document.getElementById("editID").value = idea.projectid; // this needs to be made into a ref
                  document.getElementById("editDescription").value = idea.projectdescription; // this needs to be made into a ref
                  await this.GetDomains();
                  this.setState({
                    projectToEdit:{
                      "projectsequence":idea.projectsequence,
                      "projectid":idea.projectid,
                      "projectdescription":idea.projectdescription,
                      "projectdomain":idea.projectdomainid
                    },
                    editSelectedDomain:{
                      projectdomainid:idea.projectdomainid,
                      projectdomainname:idea.projectdomainname,
                      projectdomaincolorhex:idea.projectdomaincolorhex
                    },
                    modalEditOpen: true
                  })
                }}
              />
              <Button 
                hasIconOnly
                size="md"
                renderIcon={TrashCan}
                iconDescription='Delete Project'
                kind="danger"
                onClick={() => {
                  this.setState({
                    projectToDelete:{
                      projectid:idea.projectid,
                      projectdescription:idea.projectdescription,
                    },
                    modalDeleteOpen:true
                  })
                }}
              />
            </div>
          </>
        }
    })
    
    this.setState({
      projectList:ideas,
      displayTable:'block',
      displaySkeleton:'none'
    });
  }

  AddProject = async() => {
    const projectSequence = document.getElementById('addSequence').value;
    const projectID = document.getElementById('addID').value;
    const projectDescription = document.getElementById('addDescription').value;
    const projectDomain = document.getElementById('addDomain').value

    this.setState({
      addSequenceInvalid:false,
      addIdInvalid: false,
      addDescriptionInvalid: false,
      addDomainInvalid:false
    })

    if (isNaN(projectSequence) || projectSequence === ""){
      this.setState({addSequenceInvalid: true});
      return;
    }

    if (projectID === "") {
      this.setState({addIdInvalid: true});
      return;
    }
    
    if (projectDescription === "") {
      this.setState({addDescriptionInvalid: true});
      return;
    }
    
    if (projectDomain === "") {
      this.setState({addDomainInvalid:true});
      return;
    }
    
    this.setState({
      modalAddOpen: false,
      addSequenceValue:0
    })
    document.getElementById('addID').value = "";
    document.getElementById('addDescription').value = "";
    
    const addRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/add`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "ideaId":projectID,
        "ideaDescription":projectDescription,
        "ideaSequence":projectSequence,
        "ideaDomainId":this.state.addSelectedDomain,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const addResponse = await addRequest.json();
    if (addResponse.code === 200) this.GetProjects();
    if (addResponse.code !== 200) {
      this.setState({errorInfo:{heading:`Error ${addResponse.code}`, message:addResponse.message}});
      this.setState({modalErrorOpen:true});
    }
    document.getElementById('addDomain').value = "";
  }

  BatchAddProjects = async() => {
    //process file
    this.setState({modalImportOpen:false});
    const file = this.state.uploadFile;
    const workbook = XLSX.read(file, {type:'binary'});
    const worksheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[worksheetName];
    const fileData = XLSX.utils.sheet_to_row_object_array(worksheet, {header:1});

    const maxSequence = await this.GetSequenceNumber()
    if (this.state.domainList.length === 0) await this.GetDomains();
    let sequenceNumber = parseInt(maxSequence[0].max_sequence);
    if (isNaN(sequenceNumber)) sequenceNumber = 0;

    let objProjectList = [];
    let i=1;
    let domainId;
    if (document.getElementById("skipHeader").checked) i=0;
    for (i; i<fileData.length; i++) {
      let domainFound = false;
      for (let id=0;id<this.state.domainList.length;id++){
        if (String(this.state.domainList[id].projectdomainname).toLowerCase() === String(fileData[i][2]).toLowerCase()) {
          domainId = this.state.domainList[id].projectdomainid
          domainFound = true;
          break;
        }
      }

      //if no direct match can be found between the provided domain name and one recorded in the database, try different iterations of domain names.
      if (!domainFound) {
        console.log("not found val:", String(fileData[i][2]).toLowerCase())
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
        for (let i=0;i<this.state.domainList.length;i++){
          if (refArray.includes(this.state.domainList[i].projectdomainname.toLowerCase())) {
            domainId = this.state.domainList[i].projectdomainid
            break;
          }
        }
      }

      sequenceNumber++;
      objProjectList.push({
        "ideaId":fileData[i][0],
        "ideaDescription":fileData[i][1],
        "ideaSequence":sequenceNumber,
        "ideaDomainId":domainId,
        "token":localStorage.getItem('adminjwt')
      })

      //Reset the domain variable. The domain var will retain the value of the previous item.
      //If the next item doesn't have a specified domain, it will be assigned the value of the previous item unless the var is reset.
      domainId = "";
    }
    //batch add
    for (let i=0; i<objProjectList.length;i++){
      await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/add`, {
        method:'POST',
        mode:'cors',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(objProjectList[i])   
      })
    }
    this.GetProjects();
  }
  
  EditProject = async() => {
    
    const projectSequence = document.getElementById("editSequence").value;
    const projectID = document.getElementById('editID').value;
    const projectDescription = document.getElementById('editDescription').value;

    this.setState({
      editSequenceInvalid:false,
      editIdInvalid: false,
      editDescriptionInvalid: false
    })

    if (isNaN(projectSequence) || projectSequence === "") {
      this.setState({editSequenceInvalid: true})
      return;
    }

    if (projectID === "") {
      this.setState({editIdInvalid: true})
      return;
    }
    
    if (projectDescription === "") {
      this.setState({editDescriptionInvalid: true})
      return;
    }

    this.setState({modalEditOpen: false});

    const editRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/edit`, {
      method:'POST',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "previousProjectId":this.state.projectToEdit.projectid,
        "newProjectSequence":projectSequence,
        "newProjectId": projectID,
        "newProjectDescription": projectDescription,
        "newProjectDomain":this.state.editSelectedDomain.projectdomainid,
        "token":localStorage.getItem('adminjwt')
      })    
    });
    const editResponse = await editRequest.json();
    if (editResponse.code === 200) this.GetProjects();
    if (editResponse.code !== 200) {
      this.setState({errorInfo:{heading:`Error ${editResponse.code}`, message:editResponse.message}});
      this.setState({modalErrorOpen:true});
    }
    this.setState({editSequenceValue:0});
    document.getElementById('editID').value = "";
    document.getElementById('editDescription').value = "";
    
  }

  DeleteProject = async() => {
    const deleteRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/ideas/delete`, {
      method:'DELETE',
      mode:'cors',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        "ideaId":this.state.projectToDelete.projectid,
        "token":localStorage.getItem('adminjwt')
      })
    });
    const deleteResponse = await deleteRequest.json();
    if (deleteResponse.code === 200) this.GetProjects();
    if (deleteResponse.code !== 200) {
      this.setState({errorInfo:{heading:`Error ${deleteResponse.code}`, message:deleteResponse.message}});
      this.setState({modalErrorOpen:true});
    };
  };

  HandleFileChange = (event) => {
    this.setState({fileImportError: "this is an error."});
    let file = event.target.files[0];
    if (
      file.type === "text/csv" ||
      file.type ==="application/vnd.ms-excel" ||  
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      let fileReader = new FileReader();
      fileReader.onloadend = (event) => {this.setState({uploadFile: event.target.result});};
      fileReader.readAsBinaryString(file);
      this.setState({importButtonDisabled:false});
    };
  }

  GetSequenceNumber = async() => {
    const sequenceRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/getsequencenumber`, {mode:'cors'});
    const sequenceResponse = await sequenceRequest.json();
    return sequenceResponse
  }
  
  GetDomains = async() => {
    const domainRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/domains/getall/${localStorage.getItem('adminjwt')}`, {mode:'cors'});
    const domainResponse = await domainRequest.json();
    if (domainResponse.code === 200) this.setState({domainList:domainResponse.data});
    if (domainResponse.code !== 200) {
      this.setState({errorInfo:{heading:`Error ${domainResponse.code}`, message:domainResponse.message.detail}});
      this.setState({modalErrorOpen:true});
    }
  }

  render() {
    return (
      <>
        <Modal
          id='modalError'
          modalHeading={this.state.errorInfo.heading}
          primaryButtonText="Ok"
          open={this.state.modalErrorOpen}
          onRequestClose={() => {
            this.setState({modalErrorOpen:false});
            this.setState({errorInfo:{heading:"", message:""}});
          }}
          onRequestSubmit={() => {
            this.setState({modalErrorOpen:false});
            this.setState({errorInfo:{heading:"", message:""}});
          }}
        >
          <div>{this.state.errorInfo.message}</div>
        </Modal>
        <Modal
          id='modalAdd' 
          aria-label='Add Idea'
          primaryButtonText="Add"
          secondaryButtonText="Cancel"
          modalHeading='Add Project'
          hasScrollingContent={true}
          shouldSubmitOnEnter={true}
          onRequestClose={() => {
            this.setState({modalAddOpen: false})
            document.getElementById("addID").value = ""
            document.getElementById("addDescription").value = ""
          }}
          onRequestSubmit={() => {this.AddProject();}} 
          open={this.state.modalAddOpen}
        >
          <NumberInput
            iconDescription=''
            id="addSequence"
            min={0}
            value={this.state.addSequenceValue}
            label="Project Sequence Number"
            invalidText="Number is not valid"
            tabIndex={0}
          />
          <br/>
          <TextInput
            labelText="Projet Number"
            helperText=""
            id="addID"
            invalid={this.state.addIdInvalid}
            onKeyPress={() => {this.setState({addIdInvalid:false})}}
            invalidText="This is a required field."
            placeholder="Enter the project number"
            tabIndex={0}
          />
          <br/>
          <TextInput
            style={{ marginBottom: '1rem'}}
            labelText="Project Description"
            helperText=""
            id="addDescription"
            invalid={this.state.addDescriptionInvalid}
            onKeyPress={() => {this.setState({addDescriptionInvalid:false})}}
            invalidText="This is a required field."
            placeholder="Enter your the project's description"
            tabIndex={0}
          />
          <ComboBox
            id="addDomain"
            onChange={(item) => {
              if (item.selectedItem !== null) {
                this.setState({
                  addDomainInvalid:false,
                  addSelectedDomain:item.selectedItem.projectdomainid
              })
              if (item.selectedItem === null) {this.setState({addSelectedDomain:{}})}
            }
            }}
            placeholder="Select"
            invalid={this.state.addDomainInvalid}
            invalidText="This is a required field." 
            items={this.state.domainList}
            itemToString={(item) => item ? item.projectdomainname:''}
            itemToElement={(item) => {
              return <>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>{item.projectdomainname}</div>
                <div style={{
                  backgroundColor:item.projectdomaincolorhex,
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
          id='modalImport'
          primaryButtonText="Import"
          primaryButtonDisabled={this.state.importButtonDisabled}
          secondaryButtonText="Cancel"
          modalHeading='Import'
          onRequestClose={() => {
            document.getElementById("skipHeader").checked = false;
            this.setState({
              modalImportOpen: false,
              importButtonDisabled: true,
              uploadFile: ""
            });
          }}
          onRequestSubmit={() => {this.BatchAddProjects()}} 
          open={this.state.modalImportOpen}
        >
          <Tile>
          <p>In order to simplify the data entry process, the import function allows you to specify a file containing a list of ideas with corresponding descriptions</p>  
          </Tile>
          <Tile className='file-import-warining-tile'>
            <div id="warningIcon"><WarningHex size={24}/></div>
            <div><p>Important: the file must be formatted as shown below, or the import will fail.</p></div>
            <br/>
            <div><img id='exampleImport' src={`${process.env.PUBLIC_URL}/import_example.png`} alt='Example Import Format'></img></div>
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
              onChange={(event) => {this.HandleFileChange(event);}}
            />
          </div>
          <div>
            <div style={{float: 'left'}}><Checkbox id="skipHeader" labelText="Do not skip first row header" /></div>
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
          modalHeading={`Edit Project ${this.state.projectToEdit.projectid}`}
          onRequestClose={() => this.setState({modalEditOpen: false})}
          onRequestSubmit={() => {this.EditProject();}}
          open={this.state.modalEditOpen}
        >
          <NumberInput
            id="editSequence"
            iconDescription=''
            min={0}
            value={this.state.editSequenceValue}
            label="Project Sequence Number"
            invalidText="Number is not valid"
            tabIndex={0}
          />
          <br/>
          <TextInput
            labelText="Projet Number"
            helperText=""
            id="editID"
            invalid={this.state.editIdInvalid}
            onKeyPress={() => {this.setState({editIdInvalid:false})}}
            invalidText="This is a required field."
            placeholder="Enter the project number"
            tabIndex={0}
          />
          <br/>
          <TextInput
            labelText="Project Description"
            helperText=""
            id="editDescription"
            invalid={this.state.editDescriptionInvalid}
            onKeyPress={() => {this.setState({editDescriptionInvalid:false})}}
            invalidText="This is a required field."
            placeholder="Enter your the project's description"
            tabIndex={0}
          />
          
          <ComboBox
            id="editDomain"
            selectedItem={this.state.editSelectedDomain}
            onChange={(item) => {
              if (item.selectedItem !== null) {
                this.setState({
                  editDomainInvalid:false,
                  editSelectedDomain:item.selectedItem
              })
              if (item.selectedItem === null) {this.setState({editSelectedDomain:{}})}
            }
            }} 
            placeholder="Select"
            invalid={this.state.editDomainInvalid}
            invalidText="This is a required field." 
            items={this.state.domainList}
            itemToString={(item) => item ? item.projectdomainname:''}
            itemToElement={(item) => {
              return <>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <div>{item.projectdomainname}</div>
                  <div style={{
                    backgroundColor:item.projectdomaincolorhex,
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
          modalHeading='Confirm Delete'
          primaryButtonText="Delete"
          secondaryButtonText="Cancel"
          onRequestClose={() => this.setState({modalDeleteOpen: false, projectToDelete:""})}
          onRequestSubmit={() => {
            this.setState({modalDeleteOpen: false});
            this.DeleteProject(this.state.projectToDelete.projectid);
            }
          }
          open={this.state.modalDeleteOpen}
        >
            <p>Are you sure you want to delete {this.state.projectToDelete.projectid} {this.state.projectToDelete.projectdescription}?</p>
        </Modal>

        <Content>
          <div style={{display: `${this.state.displayTable}`, height:'10px'}} className="bx--grid bx--grid--full-width adminPageBody">
          <div className="bx--row bx--offset-lg-1 ManageProjects__r1" >
            <div id='file'/>
              <div className="bx--col-lg-15">
                <DataTable
                  rows={this.state.projectList}
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
                    <TableContainer title="Ideas" description={`Displays list of all ideas to be considered at the ISR. Total ideas: ${this.state.projectList.length}`}>
                      <TableToolbar>
                        <TableToolbarContent>
                          <TableToolbarSearch onChange={onInputChange} />
                        </TableToolbarContent>
                        <Button
                          renderIcon={Add}
                          hasIconOnly
                          iconDescription='Add Project'
                          onClick={async() => {
                            const maxSequence = await this.GetSequenceNumber();
                            this.GetDomains();
                            let sequenceNumber = parseInt(maxSequence[0].max_sequence);
                            if (isNaN(sequenceNumber)) {sequenceNumber = 1}
                            else {sequenceNumber++}
                            this.setState({
                              addSequenceValue:sequenceNumber,
                              modalAddOpen:true
                            })
                          }}
                          />
                        <Button renderIcon={DocumentImport} hasIconOnly iconDescription='Import Project List' kind='secondary' onClick={() => this.setState({modalImportOpen:true})}></Button>
                        <Button
                          kind='danger'
                          renderIcon={TrashCan}
                          size='sm'
                          onClick={() => {
                            this.setState({projectToDelete:{
                              projectid:"all",
                              projectdescription:"projects",
                            }})
                            this.setState({modalDeleteOpen:true})
                          }}
                        >
                          Delete All
                        </Button>
                      </TableToolbar>
                      <Table {...getTableProps()}>
                    <TableHead>
                      <TableRow>
                        {headers.map((header) => (<TableHeader key={header.key} {...getHeaderProps({ header })}>{header.header}</TableHeader>))}
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
          <div style={{display: `${this.state.displaySkeleton}`}} className="bx--offset-lg-3 bx--col-lg-13">
            <DataTableSkeleton columnCount={3} headers={headers}/>
          </div>
        </Content>
      </>
    );
  }
}

export default AdminIdeasPage;