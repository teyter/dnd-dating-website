
const express = require('express')
const sqlite3 = require('sqlite3').verbose();
const app = express()
const port = 3000


app.use(express.urlencoded({ extended: true })); // needed to parse requests, replaces body-parser

// Review the db.run, db.get, db.all
//https://github.com/TryGhost/node-sqlite3/wiki/API

app.set('view engine', 'ejs')

// 1 - some prelim 

let db = new sqlite3.Database('users.db', createTable) //set the sqlite file, and callback function

//addUser('bob',"password") //manually create some data

function createTable(){ //create the table
    db.run(`CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, name TEXT NOT NULL, pass TEXT NOT NULL);`)
}

function addUser(name, pass){ //add some data
    db.run(`INSERT INTO users (name, pass) VALUES (?,?)`, 
    [name,pass])
}

// 2 - Templating with data base 

app.get('/viewUsersDB', (req,res) => {
  //db.all - 
    db.all(`SELECT * FROM users;`, [], (error,row) => {
           res.render('viewUsers',{users: row});
    })

})


// 3 - Create an edit users form

// 3.1 - First Create an editUsers.ejs template file containing a form

app.get('/editUsers', (req,res) => { // Get the form data
   db.all(`SELECT * FROM users;`, [], (error,row) => { //retrive the data
           res.render('editUsers',{users: row});    //populate the form
    })
})


app.post('/editUsers', (req,res) => { // Post the form data
   const { name, pass, user_id} = req.body  // Get the posted data
    var sql=`UPDATE users SET name = "${name}"........;` //update a single row
     db.run(sql, (error,row) => { //note the db.run()
    console.log(`Inserted ${sql}`) 
    })
     res.redirect('/editUsers') //redirect to the GET /editUsers
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})






