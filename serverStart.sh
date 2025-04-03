#File to start the npm Server 
# Execute with source serverStart.sh
cd ./frontend
npm install
cd ../backend
npm install && npm install aws-sdk && npm install dotenv
node database.js
node index.js 
