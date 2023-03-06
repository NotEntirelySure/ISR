import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom';
import UserGlobalHeader from '../../components/UserGlobalHeader';
import {
	Button,
	ComboBox,
	Form,
	Modal,
	Select,
	SelectItem,
	TextInput
} from '@carbon/react';

export default function RegistrationPage () {

	const regex = /^[0-9a-zA-Z(\-)]+$/;

	const officeRef = useRef();
	const titleRef = useRef();
	const fNameRef = useRef();
	const lNameRef = useRef();

	const navigate = useNavigate();

	const [officeComboInvalid, setOfficeComboInvalid] = useState(false);
	const [titleDropdownInvalid, setTitleDropdownInvalid] = useState(false);
	const [fNameInvalid, setFNameInvalid] = useState(false);
	const [lNameInvalid, setLNameInvalid] = useState(false);
	const [offices, setOffices] = useState([]);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => GetOffices(),[])

	async function GetOffices() {
		const officesRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/offices/getall`, {mode:'cors'});
		const officesResponse = await officesRequest.json();
		const offices = officesResponse.data.rows.map((office) => {
			return {id:office.officeid, text:office.officename};
		});
		setOffices(offices);
	}

	async function register() {

		setOfficeComboInvalid(false);
		setTitleDropdownInvalid(false);
		setFNameInvalid(false);
		setLNameInvalid(false);

		if (!officeRef.current) {
			setOfficeComboInvalid(true);
			return;
		}

		if (!titleRef.current.value || titleRef.current.value === "0") {
			setTitleDropdownInvalid(true);
			return;
		}
		if (!fNameRef.current.value) {
			setFNameInvalid(true);
			return;
		}
		
		if (!lNameRef.current.value) {
			setLNameInvalid(true);
			return;
		};

		if (!fNameRef.current.value.match(regex)) {
			setFNameInvalid(true);
			return;
		}

		if (!lNameRef.current.value.match(regex)) {
			setLNameInvalid(true);
			return;
		}
		
		const registrationRequest = await fetch(`${process.env.REACT_APP_API_BASE_URL}/participants/register`, {
			method:'POST',
			mode:'cors',
			headers:{'Content-Type':'application/json'},
			body:JSON.stringify({
				"office":officeRef.current,
				"title":titleRef.current.value,
				"fname":fNameRef.current.value.trim(),
				"lname":lNameRef.current.value.trim()
			})
		});
		const registrationResponse = await registrationRequest.json();
		if (registrationResponse.code === 200) {
			localStorage.setItem("jwt", registrationResponse.token);
			navigate('/vote');
		}
		if (registrationResponse.code === 500) setModalOpen(true);
	}

	return (
		<>
			<UserGlobalHeader notificationActive={false} isAuth={false}/>
			
			<Modal open={modalOpen}
				modalHeading="Registration Error"
				modalLabel=""
				primaryButtonText="Ok"
				onRequestSubmit={() => setModalOpen(false)}
				onRequestClose={() => setModalOpen(false)}
			>
				An error occured when attempting to register you in the system. Please try again. If the problem persists contact your system administrator.
			</Modal>
		
			<div className='registration-page__banner'>
				<h1 className="registration-page__heading">Participant Registration</h1>
			</div>
			<div className='registrationFormContainer' style={{display:'flex', justifyContent:'center'}}>
				<Form>
					<div className='registrationFormItem'>
						<ComboBox
							id="officeCombo"
							titleText="Office"
							placeholder="Select"
							invalidText="This is a required field." 
							helperText=""
							invalid={officeComboInvalid}
							items={offices}
							onChange={(selection) => {
								if (officeComboInvalid) setOfficeComboInvalid(false);
								officeRef.current = selection.selectedItem.id;
							}}
							itemToString={(office) => (office ? office.text : '')}
						/>
					</div>
					<div className='registrationFormItem'>
						<Select
							defaultValue="Select"
							id="dropdown"
							labelText="Title"
							invalidText="This is a required field."
							invalid={titleDropdownInvalid}
							ref={titleRef}
							tabIndex={0}
							onChange={() => {if (titleDropdownInvalid) setTitleDropdownInvalid(false)}}
						>
							<SelectItem text="Select" value="0"></SelectItem>
							<SelectItem text="Mr." value="Mr."></SelectItem>
							<SelectItem text="Ms." value="Ms."></SelectItem>
							<SelectItem text="Dr." value="Dr."></SelectItem>
							<SelectItem text="CMC" value="CMC"></SelectItem>
							<SelectItem text="ENS" value="ENS"></SelectItem>
							<SelectItem text="LTJG" value="LTJG"></SelectItem>
							<SelectItem text="LT" value="LT"></SelectItem>
							<SelectItem text="LCDR" value="LCDR"></SelectItem>
							<SelectItem text="CDR" value="CDR"></SelectItem>
							<SelectItem text="CAPT" value="CAPT"></SelectItem>
						</Select>
					</div>
					<div className='registrationFormItem'>
						<TextInput
							labelText="First Name"
							helperText=""
							id="fname"
							invalidText="Invalid character in First Name field. Acceptable characters are: A-Z, a-z, 0-9, and -"
							placeholder="Enter your first name"
							ref={fNameRef}
							invalid={fNameInvalid}
							tabIndex={0}
							onChange={() => {if(fNameRef.current.value && fNameInvalid) setFNameInvalid(false)}}
						/>
					</div>
					<div className='registrationFormItem'>
						<TextInput
							labelText="Last Name"
							helperText=""
							id="lname"
							invalidText="Invalid character in Last Name field. Acceptable characters are: A-Z, a-z, 0-9, and -"
							placeholder="Enter your last name"
							ref={lNameRef}
							invalid={lNameInvalid}
							tabIndex={0}
							onChange={() => {if(lNameRef.current.value && lNameInvalid) setLNameInvalid(false)}}
						/>
					</div>
					<div className='registrationFormItem'>
						<Button
							kind='primary'
							tabIndex={0}
							onClick={() => register()}
							>
								Register    
						</Button>
					</div>
				</Form>
			</div>
		
		</>
	);

}