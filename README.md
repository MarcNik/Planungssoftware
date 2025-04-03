# Planungssoftware

READ ME

start with 
$ source startServer.sh

for testing

install all tools with
$ source testtools.sh

Integration / UI Test:
$ npx cypress run

Unit Test:

$ npm test

Last Test:

artillery run lasttest/apiTest.yml

get Lasttest Report:

artillery run lasttest/apiTest.yml --output report.json
artillery report --output report.html report.json
