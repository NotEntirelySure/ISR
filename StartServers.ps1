start-process powershell -ArgumentList '-noexit -command "npm start --prefix C:\Users\TADS_User\Documents\isr_voting_system\web_socket_server"'
start-process powershell -ArgumentList '-noexit -command "node C:\Users\TADS_User\Documents\isr_voting_system\node-postgres\BackendAPI.js"'
start-process powershell -verb runas -ArgumentList '-noexit -command "net start postgresql-x64-14"'