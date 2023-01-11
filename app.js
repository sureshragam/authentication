const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

let db = null;

const initializeServerAndConnectDatabase = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Connected to server at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeServerAndConnectDatabase();

// post /register/ API

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  //   console.log(request.body);
  try {
    const userDetailQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}';
        `;
    const userExisted = await db.get(userDetailQuery);
    // console.log(userExisted);
    // console.log(password.length);
    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(hashedPassword);
    // console.log(userExisted);

    if (userExisted === undefined) {
      console.log("im entered");
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const addUserQuery = `
                INSERT INTO user (username,name,password,gender,location)
                VALUES(
                    '${username}',
                    '${name}',
                    '${hashedPassword}',
                    '${gender}',
                    '${location}'
                )
                `;
        db.run(addUserQuery);
        response.status = 200;
        response.send("User created successfully");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(e.message);
  }
});

// post /login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  console.log(request.body);
  try {
    const userDetailQuery = `
        SELECT *
        FROM user
        WHERE username = '${username}';
        `;
    const userDetail = await db.get(userDetailQuery);
    console.log(userDetail);

    if (userDetail !== undefined) {
      const passwordMatch = await bcrypt.compare(password, userDetail.password);
      if (passwordMatch === true) {
        response.status(200);
        response.send("Login success!");
      } else {
        response.status(400);
        response.send("Invalid password");
      }
    } else {
      response.status(400);
      response.send("Invalid user");
    }
  } catch (e) {
    response.send(e.message);
  }
});

// put /change-password/

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  try {
    const userDetailQuery = `
        SELECT *
        from user
        WHERE username = '${username}'
        `;
    const userDetail = await db.get(userDetailQuery);
    const oldPasswordCheck = await bcrypt.compare(
      oldPassword,
      userDetail.password
    );
    // console.log(oldPasswordCheck);
    if (oldPasswordCheck) {
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      if (newPassword.length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const updateUserQuary = `
                UPDATE user
                SET
                    password = '${newHashedPassword}'
                    
                `;
        const updateUser = await db.run(updateUserQuary);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  } catch (e) {
    console.log(e.message);
  }
});

// delete api

app.delete("/users/:username", async (request, response) => {
  const { username } = request.params;
  //   console.log(username);
  const deleteUserQuery = `
    DELETE 
    FROM user
    WHERE username = '${username}';
    `;
  await db.run(deleteUserQuery);
  response.send("User deleted Successfully");
});

app.get("/users/", async (request, response) => {
  const userDetailQuery = `
        SELECT *
        from user
        `;
  const userDetail = await db.all(userDetailQuery);
  response.send(userDetail);
});

module.exports = app;
