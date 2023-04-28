const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const streamifier = require('streamifier');

const admin = require("firebase-admin");
const { initializeApp } = require('firebase-admin/app');
initializeApp()

// Set up express app
const app = express();
const port = process.env.PORT || 3000;

// Set up multer storage for CSV file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Set up pug view engine
app.set("view engine", "pug");
app.set("views", "./views");

// Set up routes
app.get("/", (req, res) => {
  res.render("index");
});


// CREATE USERS FROM CSV FILE email,password
app.post("/create-users", upload.single("csv"), (req, res) => {
  const file = req.file;
  
  if (!file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  const users = [];
  const fileBuffer = req.file.buffer; // Get buffer of uploaded file
  const readStream = streamifier.createReadStream(fileBuffer); // Create readable stream from buffer

  readStream.pipe(csv({delimiter: ","}))
    .on("data", (data) => {
      users.push(data);
    })
    .on("end", () => {
      createUsers(users)
        .then(() => {
          res.redirect("/success");
        })
        .catch((error) => {
          console.error(error);
          res.status(500).send("Error creating users.");
        });
    });
});

app.get("/success", (req, res) => {
  res.render("success");
});

app.get("/successDeleted", (req, res) => {
  res.render("successDeleted");
});

// Define function to create users
async function createUsers(users) {
  // const promises = users.map((user) => {
  //     	console.log("User" + user)
  //       console.log("User email: " + user.email)
  //       console.log("User password: " + user.password)
  //   return admin.auth().createUser({
  //     email: user.email,
  //     password: user.password,
  //   });
  // });
  // await Promise.all(promises);
  counter = 0;
  return new Promise(async (resolve, reject) => {
    try {
      for (const user of users) {
        await new Promise(resolve => setTimeout(resolve, 10));
        await admin.auth().createUser({
              email: user.email,
              password: user.password,
            });
        console.log("User " + counter + " created. " + user.email);
        counter++;
      }
      console.log(`${counter} users created.`);
      resolve();
    } catch(error) {
      console.error(`Failed to delete users: ${error}`);
      reject(error);
    }
  });
}

// REMOVE SINGLE USER by email
app.post('/remove-user', express.urlencoded({ extended: true }), (req, res) => {
  const email  = req.body.email;
  console.log("Email to remove: " + email)

  // Find user by email
  admin.auth().getUserByEmail(email)
    .then((user) => {
      // Delete user
      admin.auth().deleteUser(user.uid)
        .then(() => {
          console.log(`Deleted user with email: ${email}`);
          res.status(200).send(`Deleted user with email: ${email}`);
        })
        .catch((error) => {
          console.error(`Error deleting user with email ${email}:`, error);
          res.status(500).send(`Error deleting user with email ${email}`);
        });
    })
    .catch((error) => {
      console.error(`Error finding user with email ${email}:`, error);
      res.status(500).send(`Error finding user with email ${email}`);
    });
});

// REMOVE ALL USERS BUT KEEP specified
// Handle POST request to remove all users except for specified emails
app.post('/remove-users', express.urlencoded({ extended: true }), (req, res) => {
  const emailsToKeep = req.body.emails.split(",");
  console.log("email to keep: " + emailsToKeep)
  // Get list of all users from Firebase
  admin.auth().listUsers()
    .then(async (listUsersResult) => {
      // Filter out the users with the specified emails
      const usersToDelete = listUsersResult.users.filter(user => !emailsToKeep.includes(user.email));

      // Delete all users except for the ones with the specified emails
      //const deletePromises = usersToDelete.map(user => admin.auth().deleteUser(user.uid));

      // Promise.all(deletePromises)
      return deleteUsersSequentially(usersToDelete);        
    }).then((usersToDelete) => {
      console.log(`Deleted ${usersToDelete.length} users`);
      res.status(200).send(`Deleted ${usersToDelete.length} users`);
    })
    .catch((error) => {
      // console.error('Error deleting users:', error);
      // res.status(500).send('Error deleting users');
      res.redirect("/successDeleted");
    }).catch((error) => {
      console.error('Error listing users:', error);
      res.status(500).send('Error listing users');
    });
});

// UPLOAD TEAM MEMBERS
// HAD ISSUES WITH permission, used FireFoo instead to upload team members
app.post('/upload-team-members', upload.single('file'), (req, res) => {
  const file = req.file;

  const db = admin.firestore();
  const teamMembersRef = db.collection('teamMembers');

  if (!file) {
    res.status(400).send("No file uploaded.");
    return;
  }

  // Parse CSV file and upload data to Firestore
  const results = [];
  const fileBuffer = req.file.buffer; // Get buffer of uploaded file
  const readStream = streamifier.createReadStream(fileBuffer); // Create readable stream from buffer

  readStream.pipe(csv({delimiter: ","}))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      // Iterate through each team member and upload to Firestore
      results.forEach((teamMember) => {
        teamMembersRef.add({
          email: teamMember.email,
          team: teamMember.team
        })
          .then(() => console.log(`Uploaded ${teamMember.name} to Firestore`))
          .catch((error) => console.error(`Error uploading ${teamMember.name} to Firestore: ${error}`));
      });

      res.redirect('/');
    });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function deleteUsersSequentially(usersToDelete) {
  return new Promise(async (resolve, reject) => {
    try {
      for (const user of usersToDelete) {
        await new Promise(resolve => setTimeout(resolve, 10)); // Wait for 50 mili second
        await admin.auth().deleteUser(user.uid);
        console.log(`User with uid ${user.uid} has been deleted`);
        // You can add any additional logic here after the user is deleted
      }
      console.log(`All users have been deleted`);
      // You can add any additional logic here after all users are deleted
      resolve(usersToDelete);
    } catch (error) {
      console.error(`Failed to delete users: ${error}`);
      reject(error);
    }
  });
}
