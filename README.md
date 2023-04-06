### How to setup project
	1. Instal node js: 
		- brew install node 
		- or check https://nodejs.org/en/download/package-manager#macos
	2. run npm install to fetch required modules

### HOW TO setup Firebase CLI

#### Download firebase cli 

	npm install -g firebase-tools

#### Use firbase CLI with service account
	1. Create Service account if doesn't exists https://cloud.google.com/iam/docs/service-accounts-create
	2. Generate keys that will be used to authenticate your machine with firebase https://cloud.google.com/iam/docs/keys-create-delete
	3. Download JSON file generated in previous step (usually download starts automatically)
	4. Export "export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/credentials/file.json" 
	5. After that you can start using firebase commands



#### Creating user using admin SDK is described https://firebase.google.com/docs/auth/admin/manage-users#create_a_user

#### How to run script
	You can easily run script by
	node <script file> -> node index.js

#### How to run script in browser ?
	
	Current implementation is using express to create inerface in browse.
	Open localhost:3000 to see UI of create users script


