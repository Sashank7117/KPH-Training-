let users = JSON.parse(localStorage.getItem('users')) || {};
let accountData = JSON.parse(localStorage.getItem('accountData')) || [];
let enquiryData = JSON.parse(localStorage.getItem('enquiryData')) || [];
let demoData = JSON.parse(localStorage.getItem('demoData')) || [];
let studentData = JSON.parse(localStorage.getItem('studentData')) || [];
let isFirstLogin = JSON.parse(localStorage.getItem('firstLogin')) || {};
const DEFAULT_USERNAME = 'ryepuri';
const DEFAULT_PASSWORD = '123456789';
let currentUserEmail = null;
let forgotPasswordType = null;
let lastEnquiryNumber = 1600;

// Clear previous enquiry data to start fresh
enquiryData = [];
localStorage.setItem('enquiryData', JSON.stringify(enquiryData));
localStorage.setItem('lastEnquiryNumber', lastEnquiryNumber);

// Initialize default user
if (!users[DEFAULT_USERNAME]) {
    users[DEFAULT_USERNAME] = {
        password: DEFAULT_PASSWORD,
        firstName: 'ryepuri',
        lastName: '',
        dob: '1990-05-01',
        email: 'admin@example.com',
        gender: 'Other',
        education: 'Graduation',
        maritalStatus: 'Single',
        access: { enquiry: true, demo: true, student: true }
    };
}

// Initialize workbook
let workbook = null;
function initializeWorkbook() {
    const storedWorkbook = localStorage.getItem('workbook');
    try {
        if (storedWorkbook) {
            const workbookArray = new Uint8Array(atob(storedWorkbook).split('').map(char => char.charCodeAt(0)));
            workbook = XLSX.read(workbookArray, { type: 'array' });
        } else {
            throw new Error('No stored workbook');
        }
    } catch (e) {
        workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'Accounts');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'Enquiry');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'Demo');
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([]), 'Student');
    }
    workbook.Sheets['Enquiry'] = XLSX.utils.json_to_sheet([]);
    saveWorkbookToStorage();
}
initializeWorkbook();

function saveWorkbookToStorage() {
    try {
        const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const base64String = btoa(String.fromCharCode(...new Uint8Array(wbout)));
        localStorage.setItem('workbook', base64String);
    } catch (e) {
        console.error('Failed to save workbook:', e);
    }
}

function saveStoredData() {
    try {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('accountData', JSON.stringify(accountData));
        localStorage.setItem('enquiryData', JSON.stringify(enquiryData));
        localStorage.setItem('demoData', JSON.stringify(demoData));
        localStorage.setItem('studentData', JSON.stringify(studentData));
        localStorage.setItem('firstLogin', JSON.stringify(isFirstLogin));
        localStorage.setItem('lastEnquiryNumber', lastEnquiryNumber);
    } catch (e) {
        console.error('Failed to save data:', e);
    }
}

function validateEmail(emailInput) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailInput);
}

function togglePassword(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const eyeIcon = passwordInput?.nextElementSibling;
    if (!passwordInput || !eyeIcon) return;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '👁️';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️‍🗨️';
    }
}

function toggleCheckbox(checkboxId) {
    const checkboxElement = document.getElementById(checkboxId);
    const checkboxLabel = checkboxElement?.parentElement;
    const checkmarkIcon = checkboxLabel?.querySelector('.checkmark');
    if (!checkboxElement || !checkmarkIcon) return;
    checkmarkIcon.style.display = checkboxElement.checked ? 'inline-block' : 'none';
}

function generateEnquiryId() {
    const enquiryNumber = lastEnquiryNumber;
    localStorage.setItem('lastEnquiryNumber', lastEnquiryNumber);
    return `KPH${enquiryNumber}`;
}

function setEnquiryFormDate() {
    const dateField = document.getElementById('enquiryDate');
    if (dateField) {
        const currentDate = new Date().toISOString().split('T')[0];
        dateField.value = currentDate;
        dateField.setAttribute('min', currentDate);
    }
}

function populateEnquiryIds() {
    const demoEnquirySelect = document.getElementById('demoEnquiryId');
    const studentEnquirySelect = document.getElementById('studentEnquiryId');
    const currentEnquiryId = generateEnquiryId();

    const allEnquiryIds = [...new Set([...enquiryData.map(data => data['ENQUIRY ID']), currentEnquiryId])].sort((a, b) => {
        const numA = parseInt(a.replace('KPH', ''));
        const numB = parseInt(b.replace('KPH', ''));
        return numA - numB;
    });

    if (demoEnquirySelect) {
        demoEnquirySelect.innerHTML = '<option value="" disabled selected>Enquiry ID</option>';
        allEnquiryIds.forEach(id => {
            const optionElement = document.createElement('option');
            optionElement.value = id;
            optionElement.textContent = id;
            demoEnquirySelect.appendChild(optionElement);
        });
    }

    if (studentEnquirySelect) {
        studentEnquirySelect.innerHTML = '<option value="" disabled selected>Enquiry ID</option>';
        allEnquiryIds.forEach(id => {
            const optionElement = document.createElement('option');
            optionElement.value = id;
            optionElement.textContent = id;
            studentEnquirySelect.appendChild(optionElement);
        });
    }
}

function setDemoDateConstraints() {
    const demoDateField = document.getElementById('demoDate');
    if (demoDateField) {
        const currentDate = new Date().toISOString().split('T')[0];
        demoDateField.setAttribute('min', currentDate);
    }
}

function autoFillDemoForm() {
    const selectedEnquiryId = document.getElementById('demoEnquiryId')?.value;
    const enquiryRecord = enquiryData.find(data => data['ENQUIRY ID'] === selectedEnquiryId);
    const fullNameField = document.getElementById('demoFullName');
    const countryCodeField = document.getElementById('demoCountryCode');
    const phoneField = document.getElementById('demoPhone');
    const emailField = document.getElementById('demoEmail');

    if (enquiryRecord && fullNameField && countryCodeField && phoneField && emailField) {
        fullNameField.value = enquiryRecord['FULL NAME'] || '';
        countryCodeField.value = enquiryRecord['COUNTRY CODE'] || '+91';
        phoneField.value = enquiryRecord['PHONE NUMBER'] || '';
        emailField.value = enquiryRecord['EMAIL ID'] || '';
    } else {
        if (fullNameField) fullNameField.value = '';
        if (countryCodeField) countryCodeField.value = '+91';
        if (phoneField) phoneField.value = '';
        if (emailField) emailField.value = '';
    }
}

function autoFillStudentForm() {
    const selectedEnquiryId = document.getElementById('studentEnquiryId')?.value;
    const enquiryRecord = enquiryData.find(data => data['ENQUIRY ID'] === selectedEnquiryId);
    const fullNameField = document.getElementById('studentFullName');
    const countryCodeField = document.getElementById('studentCountryCode');
    const phoneField = document.getElementById('studentPhone');
    const emailField = document.getElementById('studentEmail');

    if (enquiryRecord && fullNameField && countryCodeField && phoneField && emailField) {
        fullNameField.value = enquiryRecord['FULL NAME'] || '';
        countryCodeField.value = enquiryRecord['COUNTRY CODE'] || '+91';
        phoneField.value = enquiryRecord['PHONE NUMBER'] || '';
        emailField.value = enquiryRecord['EMAIL ID'] || '';
    } else {
        if (fullNameField) fullNameField.value = '';
        if (countryCodeField) countryCodeField.value = '+91';
        if (phoneField) phoneField.value = '';
        if (emailField) emailField.value = '';
    }
}

function showFirstLogin() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'firstLoginSection' ? 'block' : 'none';
    });
}

function showDefaultLogin() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'defaultLoginSection' ? 'block' : 'none';
    });
}

function showForgotPassword(loginType) {
    forgotPasswordType = loginType;
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'forgotPasswordSection' ? 'block' : 'none';
    });
    const emailField = document.getElementById('forgotEmail');
    if (emailField) emailField.placeholder = loginType === 'first' ? 'Email ID' : 'Username';
}

function showCreateAccount() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'createAccountSection' ? 'block' : 'none';
    });
}

function showChangePassword() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'changePasswordSection' ? 'block' : 'none';
    });
}

function showFormsPage() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'formsSection' ? 'block' : 'none';
    });

    const formButtonsContainer = document.getElementById('formButtons');
    if (formButtonsContainer) {
        formButtonsContainer.innerHTML = '';
        const userAccess = users[currentUserEmail]?.access || {};
        if (userAccess.enquiry) {
            formButtonsContainer.innerHTML += '<button class="signup-btn form-btn" onclick="showEnquiryForm()">Enquiry Form</button>';
        }
        if (userAccess.demo) {
            formButtonsContainer.innerHTML += '<button class="signup-btn form-btn" onclick="showDemoForm()">Demo Form</button>';
        }
        if (userAccess.student) {
            formButtonsContainer.innerHTML += '<button class="signup-btn form-btn" onclick="showStudentInfoForm()">Student Information Form</button>';
        }
    }
}

function showEnquiryForm() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'enquiryForm' ? 'block' : 'none';
    });
    const enquiryIdField = document.getElementById('enquiryId');
    if (enquiryIdField) enquiryIdField.value = generateEnquiryId();
    setEnquiryFormDate();
}

function showDemoForm() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'demoForm' ? 'block' : 'none';
    });
    populateEnquiryIds();
    setDemoDateConstraints();
}

function showStudentInfoForm() {
    const sections = [
        'firstLoginSection', 'defaultLoginSection', 'forgotPasswordSection',
        'createAccountSection', 'changePasswordSection', 'formsSection',
        'enquiryForm', 'demoForm', 'studentInfoForm'
    ];
    sections.forEach(id => {
        const sectionElement = document.getElementById(id);
        if (sectionElement) sectionElement.style.display = id === 'studentInfoForm' ? 'block' : 'none';
    });
    populateEnquiryIds();
}

function goBack() {
    showFormsPage();
}

function generateEmail() {
    const firstNameInput = document.getElementById('firstName')?.value?.trim().toLowerCase();
    const lastNameInput = document.getElementById('lastName')?.value?.trim().toLowerCase();
    const emailField = document.getElementById('contact');
    if (firstNameInput && lastNameInput && emailField) {
        emailField.value = `${firstNameInput}.${lastNameInput}@gmail.com`;
    } else if (emailField) {
        emailField.value = '';
    }
}

function firstLogin() {
    const emailInput = document.getElementById('email')?.value?.trim();
    const passwordInput = document.getElementById('password')?.value;

    if (!emailInput || !passwordInput) {
        alert('Please enter both email and password.');
        return;
    }

    if (users[emailInput] && users[emailInput].password === passwordInput) {
        currentUserEmail = emailInput;
        if (isFirstLogin[emailInput]) {
            showChangePassword();
        } else {
            showFormsPage();
        }
    } else {
        alert('Invalid email or password.');
    }
}

function defaultLogin() {
    const usernameInput = document.getElementById('username')?.value?.trim();
    const passwordInput = document.getElementById('defaultPassword')?.value;

    if (!usernameInput || !passwordInput) {
        alert('Please enter both username and password.');
        return;
    }

    if (usernameInput === DEFAULT_USERNAME && users[usernameInput]?.password === passwordInput) {
        showCreateAccount();
    } else {
        alert('Invalid username or password.');
    }
}

function createAccount() {
    const firstNameInput = document.getElementById('firstName')?.value?.trim();
    const lastNameInput = document.getElementById('lastName')?.value?.trim();
    const dobInput = document.getElementById('dob')?.value;
    const genderInput = document.getElementById('gender')?.value;
    const emailInput = document.getElementById('contact')?.value?.trim();
    const educationInput = document.getElementById('education')?.value;
    const maritalStatusInput = document.getElementById('maritalStatus')?.value;
    const newPasswordInput = document.getElementById('newPassword')?.value;
    const enquiryAccessCheckbox = document.getElementById('enquiryAccess')?.checked;
    const demoAccessCheckbox = document.getElementById('demoAccess')?.checked;
    const studentAccessCheckbox = document.getElementById('studentAccess')?.checked;

    if (!firstNameInput || !lastNameInput || !dobInput || !genderInput || !emailInput || !educationInput || !maritalStatusInput || !newPasswordInput) {
        alert('Please fill out all fields.');
        return;
    }

    if (!validateEmail(emailInput)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (newPasswordInput.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
    }

    if (!enquiryAccessCheckbox && !demoAccessCheckbox && !studentAccessCheckbox) {
        alert('Please select at least one access permission.');
        return;
    }

    const isExistingUser = users[emailInput];
    users[emailInput] = {
        password: newPasswordInput,
        firstName: firstNameInput,
        lastName: lastNameInput,
        dob: dobInput,
        gender: genderInput,
        email: emailInput,
        education: educationInput,
        maritalStatus: maritalStatusInput,
        access: { enquiry: enquiryAccessCheckbox, demo: demoAccessCheckbox, student: studentAccessCheckbox }
    };

    if (!isExistingUser) {
        isFirstLogin[emailInput] = true;
    }

    const accessPermissions = `${enquiryAccessCheckbox ? 'Enquiry, ' : ''}${demoAccessCheckbox ? 'Demo, ' : ''}${studentAccessCheckbox ? 'Student' : ''}`.replace(/, $/, '');
    const accountRecord = {
        'FIRST NAME': firstNameInput,
        'LAST NAME': lastNameInput,
        'DATE OF BIRTH': dobInput,
        'GENDER': genderInput,
        'EMAIL ID': emailInput,
        'EDUCATION': educationInput,
        'MARITAL STATUS': maritalStatusInput,
        'PASSWORD': '********',
        'ACCESS': accessPermissions
    };

    const existingAccountIndex = accountData.findIndex(record => record['EMAIL ID'] === emailInput);
    if (existingAccountIndex !== -1) {
        accountData[existingAccountIndex] = accountRecord;
    } else {
        accountData.push(accountRecord);
    }

    const accountHeadersList = [
        'FIRST NAME', 'LAST NAME', 'DATE OF BIRTH', 'GENDER', 'EMAIL ID',
        'EDUCATION', 'MARITAL STATUS', 'PASSWORD', 'ACCESS'
    ];
    const accountWorksheet = XLSX.utils.json_to_sheet(accountData, { header: accountHeadersList });
    workbook.Sheets['Accounts'] = accountWorksheet;

    saveStoredData();
    saveWorkbookToStorage();

    alert('Account created successfully!');
    showFirstLogin();
    const accountForm = document.getElementById('createAccountForm');
    if (accountForm) {
        accountForm.reset();
        ['gender', 'education', 'maritalStatus'].forEach(id => {
            const selectElement = document.getElementById(id);
            if (selectElement) selectElement.value = '';
        });
        const checkboxes = ['enquiryAccess', 'demoAccess', 'studentAccess'];
        checkboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = false;
                toggleCheckbox(id);
            }
        });
    }
}

function resetPassword() {
    const inputValue = document.getElementById('forgotEmail')?.value?.trim();
    const dobValue = document.getElementById('forgotDob')?.value;
    const newPasswordValue = document.getElementById('forgotNewPassword')?.value;
    const retypePasswordValue = document.getElementById('forgotRetypePassword')?.value;

    if (!inputValue || !dobValue || !newPasswordValue || !retypePasswordValue) {
        alert('Please fill out all fields.');
        return;
    }

    if (newPasswordValue !== retypePasswordValue) {
        alert('New password and retype password do not match.');
        return;
    }

    if (newPasswordValue.length < 8) {
        alert('New password must be at least 8 characters long.');
        return;
    }

    if (forgotPasswordType === 'first') {
        if (!validateEmail(inputValue) || !users[inputValue]) {
            alert('Email not found.');
            return;
        }
        if (users[inputValue].dob !== dobValue) {
            alert('Date of birth does not match.');
            return;
        }
        users[inputValue].password = newPasswordValue;
        saveStoredData();
        alert('Password reset successfully!');
        showFirstLogin();
    } else if (forgotPasswordType === 'default') {
        if (inputValue !== DEFAULT_USERNAME || users[inputValue]?.dob !== dobValue) {
            alert('Username or date of birth does not match.');
            return;
        }
        users[inputValue].password = newPasswordValue;
        saveStoredData();
        alert('Password reset successfully!');
        showDefaultLogin();
    }
}

function changePassword() {
    const oldPasswordInput = document.getElementById('oldPassword')?.value;
    const newPasswordInput = document.getElementById('newPasswordChange')?.value;
    const retypePasswordInput = document.getElementById('retypeNewPassword')?.value;

    if (!oldPasswordInput || !newPasswordInput || !retypePasswordInput) {
        alert('Please fill out all fields.');
        return;
    }

    if (!users[currentUserEmail] || users[currentUserEmail].password !== oldPasswordInput) {
        alert('Old password is incorrect.');
        return;
    }

    if (newPasswordInput !== retypePasswordInput) {
        alert('New password and retype password do not match.');
        return;
    }

    if (newPasswordInput.length < 8) {
        alert('New password must be at least 8 characters long.');
        return;
    }

    users[currentUserEmail].password = newPasswordInput;
    isFirstLogin[currentUserEmail] = false;
    saveStoredData();
    alert('Password changed successfully!');
    showFormsPage();
}

function submitForm(formType) {
    if (formType === 'enquiryForm') {
        const enquiryIdValue = document.getElementById('enquiryId')?.value;
        const dateValue = document.getElementById('enquiryDate')?.value;
        const fullNameValue = document.getElementById('enquiryFullName')?.value?.trim();
        const countryCodeValue = document.getElementById('countryCode')?.value;
        const phoneValue = document.getElementById('enquiryPhone')?.value?.trim();
        const emailValue = document.getElementById('enquiryEmail')?.value?.trim();
        const dobValue = document.getElementById('enquiryDob')?.value;
        const courseValue = document.getElementById('course')?.value?.trim();
        const sourceValue = document.getElementById('source')?.value;
        const educationValue = document.getElementById('enquiryEducation')?.value;
        const passedOutYearValue = document.getElementById('passedOutYear')?.value;
        const aboutValue = document.getElementById('about')?.value;
        const modeValue = document.getElementById('mode')?.value;
        const batchTimingValue = document.getElementById('batchTiming')?.value;
        const languageValue = document.getElementById('language')?.value;
        const demoStatusValue = document.getElementById('demoStatus')?.value;
        const commentValue = document.getElementById('comment')?.value?.trim();

        if (!enquiryIdValue || !dateValue || !fullNameValue || !phoneValue || !emailValue || !dobValue || !courseValue || !sourceValue || !educationValue || !passedOutYearValue || !aboutValue || !modeValue || !batchTimingValue || !languageValue || !demoStatusValue) {
            alert('Please fill out all required fields.');
            return;
        }

        if (!validateEmail(emailValue)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (phoneValue.length !== 10) {
            alert('Phone number must be exactly 10 digits.');
            return;
        }

        const enquiryRecord = {
            'ENQUIRY ID': enquiryIdValue,
            'DATE': dateValue,
            'FULL NAME': fullNameValue,
            'COUNTRY CODE': countryCodeValue,
            'PHONE NUMBER': phoneValue,
            'EMAIL ID': emailValue,
            'STUDENT DATE OF BIRTH': dobValue,
            'COURSE OF ENQUIRY': courseValue,
            'SOURCE OF ENQUIRY': sourceValue,
            'EDUCATION QUALIFICATION': educationValue,
            'PASSED OUT YEAR': passedOutYearValue,
            'ABOUT': aboutValue,
            'MODE OF CLASSES': modeValue,
            'BATCH TIMINGS': batchTimingValue,
            'LANGUAGE': languageValue,
            'DEMO STATUS': demoStatusValue,
            'COMMENT': commentValue
        };
        enquiryData.push(enquiryRecord);
        lastEnquiryNumber++;
        localStorage.setItem('lastEnquiryNumber', lastEnquiryNumber);

        const enquiryHeadersList = [
            'ENQUIRY ID', 'DATE', 'FULL NAME', 'COUNTRY CODE', 'PHONE NUMBER', 'EMAIL ID',
            'STUDENT DATE OF BIRTH', 'COURSE OF ENQUIRY', 'SOURCE OF ENQUIRY', 'EDUCATION QUALIFICATION',
            'PASSED OUT YEAR', 'ABOUT', 'MODE OF CLASSES', 'BATCH TIMINGS', 'LANGUAGE', 'DEMO STATUS', 'COMMENT'
        ];
        const enquiryWorksheet = XLSX.utils.json_to_sheet(enquiryData, { header: enquiryHeadersList });
        workbook.Sheets['Enquiry'] = enquiryWorksheet;

        saveStoredData();
        saveWorkbookToStorage();
        alert('Enquiry Form submitted successfully!');
        const enquiryFormElement = document.getElementById('enquiryFormElement');
        if (enquiryFormElement) {
            enquiryFormElement.reset();
            ['countryCode', 'source', 'enquiryEducation', 'about', 'mode', 'batchTiming', 'language', 'demoStatus'].forEach(id => {
                const selectElement = document.getElementById(id);
                if (selectElement) selectElement.value = '';
            });
        }
        const enquiryIdField = document.getElementById('enquiryId');
        if (enquiryIdField) enquiryIdField.value = generateEnquiryId();
        setEnquiryFormDate();
        goBack();
    } else if (formType === 'demoForm') {
        const enquiryIdValue = document.getElementById('demoEnquiryId')?.value;
        const fullNameValue = document.getElementById('demoFullName')?.value?.trim();
        const countryCodeValue = document.getElementById('demoCountryCode')?.value;
        const phoneValue = document.getElementById('demoPhone')?.value?.trim();
        const emailValue = document.getElementById('demoEmail')?.value?.trim();
        const subjectValue = document.getElementById('subject')?.value?.trim();
        const demoDateValue = document.getElementById('demoDate')?.value;
        const tutorNameValue = document.getElementById('tutorName')?.value?.trim();
        const demoTimeValue = document.getElementById('demoTime')?.value;
        const demoFeedbackValue = document.getElementById('demoFeedback')?.value;
        const enrollStatusValue = document.getElementById('enrollStatus')?.value;

        if (!enquiryIdValue || !fullNameValue || !phoneValue || !emailValue || !subjectValue || !demoDateValue || !tutorNameValue || !demoTimeValue || !demoFeedbackValue || !enrollStatusValue) {
            alert('Please fill out all required fields.');
            return;
        }

        if (!validateEmail(emailValue)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (phoneValue.length !== 10) {
            alert('Phone number must be exactly 10 digits.');
            return;
        }

        const demoRecord = {
            'ENQUIRY ID': enquiryIdValue,
            'FULL NAME': fullNameValue,
            'COUNTRY CODE': countryCodeValue,
            'PHONE NUMBER': phoneValue,
            'EMAIL ID': emailValue,
            'SUBJECT': subjectValue,
            'DEMO DATE': demoDateValue,
            'TUTOR NAME': tutorNameValue,
            'DEMO TIME': demoTimeValue,
            'DEMO FEEDBACK': demoFeedbackValue,
            'ENROLL STATUS': enrollStatusValue
        };
        demoData.push(demoRecord);

        const demoHeadersList = [
            'ENQUIRY ID', 'FULL NAME', 'COUNTRY CODE', 'PHONE NUMBER', 'EMAIL ID',
            'SUBJECT', 'DEMO DATE', 'TUTOR NAME', 'DEMO TIME', 'DEMO FEEDBACK', 'ENROLL STATUS'
        ];
        const demoWorksheet = XLSX.utils.json_to_sheet(demoData, { header: demoHeadersList });
        workbook.Sheets['Demo'] = demoWorksheet;

        saveStoredData();
        saveWorkbookToStorage();
        alert('Demo Form submitted successfully!');
        const demoFormElement = document.getElementById('demoFormElement');
        if (demoFormElement) {
            demoFormElement.reset();
            ['demoEnquiryId', 'demoCountryCode', 'demoFeedback', 'enrollStatus'].forEach(id => {
                const selectElement = document.getElementById(id);
                if (selectElement) selectElement.value = '';
            });
        }
        goBack();
    } else if (formType === 'studentInfoForm') {
        const enquiryIdValue = document.getElementById('studentEnquiryId')?.value;
        const fullNameValue = document.getElementById('studentFullName')?.value?.trim();
        const countryCodeValue = document.getElementById('studentCountryCode')?.value;
        const phoneValue = document.getElementById('studentPhone')?.value?.trim();
        const emailValue = document.getElementById('studentEmail')?.value?.trim();
        const subjectValue = document.getElementById('studentSubject')?.value?.trim();
        const totalFeeValue = document.getElementById('totalFee')?.value;
        const paidAmountValue = document.getElementById('paidAmount')?.value;
        const pendingAmountValue = document.getElementById('pendingAmount')?.value;
        const paymentModeValue = document.getElementById('paymentMode')?.value;
        const trainerNameValue = document.getElementById('trainerName')?.value?.trim();
        const commentValue = document.getElementById('studentComment')?.value?.trim();

        if (!enquiryIdValue || !fullNameValue || !phoneValue || !emailValue || !subjectValue || !totalFeeValue || !paidAmountValue || !pendingAmountValue || !paymentModeValue || !trainerNameValue) {
            alert('Please fill out all required fields.');
            return;
        }

        if (!validateEmail(emailValue)) {
            alert('Please enter a valid email address.');
            return;
        }

        if (phoneValue.length !== 10) {
            alert('Phone number must be exactly 10 digits.');
            return;
        }

        const totalAmount = parseFloat(totalFeeValue) || 0;
        const paidAmount = parseFloat(paidAmountValue) || 0;
        const pendingAmount = parseFloat(pendingAmountValue) || 0;
        if (Math.abs(totalAmount - paidAmount - pendingAmount) > 0.01) {
            alert('Pending amount does not match total fee minus paid amount.');
            return;
        }

        const studentRecord = {
            'ENQUIRY ID': enquiryIdValue,
            'FULL NAME': fullNameValue,
            'COUNTRY CODE': countryCodeValue,
            'PHONE NUMBER': phoneValue,
            'EMAIL ID': emailValue,
            'SUBJECT': subjectValue,
            'TOTAL FEE': totalFeeValue,
            'PAID AMOUNT': paidAmountValue,
            'PENDING AMOUNT': pendingAmountValue,
            'MODE OF PAYMENT': paymentModeValue,
            'TRAINER NAME': trainerNameValue,
            'COMMENT': commentValue
        };
        studentData.push(studentRecord);

        const studentHeadersList = [
            'ENQUIRY ID', 'FULL NAME', 'COUNTRY CODE', 'PHONE NUMBER', 'EMAIL ID',
            'SUBJECT', 'TOTAL FEE', 'PAID AMOUNT', 'PENDING AMOUNT', 'MODE OF PAYMENT',
            'TRAINER NAME', 'COMMENT'
        ];
        const studentWorksheet = XLSX.utils.json_to_sheet(studentData, { header: studentHeadersList });
        workbook.Sheets['Student'] = studentWorksheet;

        saveStoredData();
        saveWorkbookToStorage();
        alert('Student Information Form submitted successfully!');
        const studentFormElement = document.getElementById('studentInfoFormElement');
        if (studentFormElement) {
            studentFormElement.reset();
            ['studentEnquiryId', 'studentCountryCode', 'paymentMode'].forEach(id => {
                const selectElement = document.getElementById(id);
                if (selectElement) selectElement.value = '';
            });
        }
        goBack();
    }
}

// Initialize form events
document.addEventListener('DOMContentLoaded', () => {
    const checkboxElements = document.querySelectorAll('.checkbox-label input');
    if (checkboxElements.length > 0) {
        checkboxElements.forEach(checkbox => {
            checkbox.addEventListener('change', () => toggleCheckbox(checkbox.id));
            toggleCheckbox(checkbox.id);
        });
    }
});