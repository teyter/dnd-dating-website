const express = require('express')
const app = express()
const port = 3000


app.set('view engine', 'ejs')

// 1 - Simple Response

//app.get('/', (req, res) => {
  //res.send('Hello World!')
//})


// 2 - Manually formatting

app.get('/viewUsers', (req,res)=> { // 
  const user = {name:"Bob",pass:"password123"} // create an object with some data to display
  let htmlOut = `<html><body><h2>Users</h2>

        <table>
        <tr>
            <th>Username</th>
            <th>Password</th>
        </tr>
        <tr>
          <td>${user.name}</td>
          <td>${user.pass}</td>
        </tr>
        </table>
        </body></html>`


  res.send(htmlOut)
})


// 3 - Templating and passing variables using ejs

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  const websiteName = "Bob's Shop" //create a variable
  res.render('index', {websiteName}) //render the template and pass an object
})


// 4 - Templates and control flow

app.get('/viewUsersTemplate', (req,res) =>{
  const users = [{name:'bob',pass:'password123'},{name:'alice',pass:'12345'}] //create an object
  res.render('viewUsers', {users}) //pass the object
  //review /views/viewUsers.ejs
})


app.listen(port, () => { //run me!
  console.log(`Example app listening on port ${port}`)
})





