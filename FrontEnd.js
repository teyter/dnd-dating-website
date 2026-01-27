const express = require("express");
const app = express();
const port = 3000;

const db = require("./Database");

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// 2 - Manually formatting (demo)
app.get("/viewUsers", (req, res) => {
  const user = { name: "Bob", pass: "password123" };
  const htmlOut = `<html><body><h2>Users</h2>
    <table>
      <tr><th>Username</th><th>Password</th></tr>
      <tr><td>${user.name}</td><td>${user.pass}</td></tr>
    </table>
  </body></html>`;
  res.send(htmlOut);
});

// 3 - Templating and passing variables using ejs (demo)
app.get("/", (req, res) => {
  const websiteName = "Bob's Shop";
  res.render("index", { websiteName });
});

// 4 - Templates and control flow (demo)
app.get("/viewUsersTemplate", (req, res) => {
  const users = [
    { name: "bob", pass: "password123" },
    { name: "alice", pass: "12345" },
  ];
  res.render("viewUsers", { users });
});

// ✅ Step 2: View users from SQLite
app.get("/users", (req, res) => {
  db.getAllUsers((err, users) => {
    if (err) return res.status(500).send(err.message);
    res.render("users", { users });
  });
});

app.listen(port, () => {
  console.log(`Example app listening on http://localhost:${port}`);
});
