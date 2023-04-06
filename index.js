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
    	console.log(data)
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

// Define function to create users
async function createUsers(users) {
  const promises = users.map((user) => {
      	console.log("User" + user)
        console.log("User email: " + user.email)
        console.log("User password: " + user.password)
    return admin.auth().createUser({
      email: user.email,
      password: user.password,
    });
  });
  await Promise.all(promises);
  console.log(`${promises.length} users created.`);
}

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
