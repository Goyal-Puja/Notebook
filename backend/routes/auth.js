const express = require("express");
const User = require("../models/User");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require('bcrypt')
var jwt = require('jsonwebtoken');
var fetchuser = require('../middleware/fetchuser')

const JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

// Route 1 : create a user using : POST "/api/auth/createUser" , no login required....
router.post(
  "/createUser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
  ],
  async (req, res) => {
    // if there are errors, return Bad request and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // check whether the user with this email exists already
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "Sorry a user with this email alreay exists" });
      }
      const salt = await bcrypt.genSalt(10);
      const secPass = await bcrypt.hash(req.body.password, salt);
     // create a new user
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
      });

      const data = {
        user:{
            id: user.id
        }
      }
      const authtoken = jwt.sign(data, JWT_SECRET);
     // console.log(jwtData);

      res.json({authtoken});      // user 
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Internal server error");
    }
  }
);

// Route 2 : Authenticate a user using : POST "/api/auth/login".. No login required..

router.post('/login', [
     body('email', 'Enter a valid email').isEmail(),
     body('password', 'Password cannot be blank').exists(),

], async (req, res) => {

    const errors = validationResult(req);
    if(!errors.isEmpty){
        return res.status(400).json({ errors: errors.array() });
    }
    const {email, password} = req.body;         // taking email and password from request body
    try{
       let user = await User.findOne({email});             // checking the email that is exists or not
       if(!user){
        return res.status(400).json({error : "Please try to login with correct credentials"});  
       }
       const passwordCompare = await bcrypt.compare(password, user.password);
       if(!passwordCompare){
        return res.status(400).json({error : "Please try to login with correct credentials"});  
       }
       const data = {
        user:{
            id: user.id
        }
      }
      const authtoken = jwt.sign(data, JWT_SECRET);
      res.json({authtoken}); 

    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
    }
}
);

// Get loggedin User Details using : POST "/api/auth/getUser".. Login Required...

router.get('/getuser', fetchuser, async (req, res) => {
     try {
        userId = req.user.id;
        const user = await User.findById(userId).select("-password")
        res.send(user);
     } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal server error");
     }
})

module.exports = router;
