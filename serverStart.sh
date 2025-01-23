#File to start the npm Server 
# Execute with source serverStart.sh
cd ./frontend
npm install
cd ../backend
npm install
npm install jsonwebtoken
node database.js
node index.js 
