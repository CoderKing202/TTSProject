const cors = require('cors')
const express = require('express')
const mongoose = require('mongoose')
const app = express()
const session = require('express-session')
const PORT = 5000
const path = require( 'path' )

app.use(cors({origin: 'http://localhost:5173',credentials: true}))
app.use(express.json())
app.use(session({
    secret: 'fgegvcscqf',
    resave: false,
    saveUninitialized: false,
    cookie:{
        secure:false,
    }
}))

async function connectToMongoDB(){
try{
await mongoose.connect('mongodb+srv://coderking420:pggMgSaMdGxW9ZH6@aiclusters.d43d1fv.mongodb.net/TTSProject?retryWrites=true&w=majority&appName=AIClusters')

console.log("Connected to MongoDB Atlas")
}
catch(err)
{
console.log("Connection error:", err)
}
}
connectToMongoDB()
const userSchema = new mongoose.Schema(
    {
        email:String,
        password:String,
        role:String,
        name:String,
        version:String,
        membershipendsAt:Date
    }
)
const User = mongoose.model('users',userSchema)

app.use( express.static( path.join(__dirname,'public') ) )

app.get('/',(req,res)=>{
    
res.sendFile(path.join(__dirname,'index.html'))

})

app.post('/adminLogin',async (req,res)=>{
    const {email,password} = req.body
    const role = 'admin'
    console.log(email)
    let user
    try
    {
    user = await User.findOne({role})
    }
    catch(err){
        console.log(err)
    }
    console.log(user)
    if ( (  email == user.email) && (password  == user.password) )
    {
    req.session.email = email
    req.session.password = password
    console.log('Session set:', req.session); // Add this
    response = {result : true}
    }
    else{
        response = {result : false}
    }
    res.json(response)
})

app.post('/login',async (req,res)=>{
    const {email,password} = req.body
    let response ={}
    let user
    try{
    user = await User.findOne({email})
   
    if ( (  email == user.email ) && (password  == user.password) )
    {
    req.session.email = email
    req.session.password = password
    response = {result : true}
    }
    else{
        response = { result : false }
    }
}
catch(err){
    response = { result : false }
}
    res.json(response)
})

app.get('/isloggedin',async (req,res)=>{
    if(req.session.email){
        const user = await User.findOne( { email:req.session.email } )
        response = { result:true, user:user }
        
    }
    else{
        response = { result:false }
    }
res.json( response )
})
app.get('/signUp',(req, res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
})
app.get('/login',(req, res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
})
app.get('/pricing',(req, res)=>{
    res.sendFile(path.join(__dirname,'index.html'))
})
app.post('/register',async (req,res)=>{
    
    const {email, name, password,confirmPassword}=req.body
    let response = {
        uniqueEmail:true,
        passwordMatch:true,
        result:true
    }
    let existingUser = await User.findOne( {email} )
    if(existingUser)
    {
        response.uniqueEmail = false 
        response.result = false
    }
    if(password !== confirmPassword){
        response.passwordMatch = false
        response.result = false
    }
  
    
    if( response.uniqueEmail && response.passwordMatch )
    {
        const user = new User({
        email:email,
        name:name,
        password:password,
        role:'user',
        version:'free'
    })
    try{
        await user.save()
    }
    catch(err)
    {
        console.log(err)
    }
}
res.json(response)
})

app.post('/pay',async (req,res)=>{
        const { version } = req.body
        const membershipendsAt = new Date()
        // membershipendsAt.setMonth(membershipendsAt.getMonth()+1)
        // membershipendsAt.setDate(membershipendsAt.getDate()+1)  
        // membershipendsAt.setHours(0,0,0,0)
        membershipendsAt.setMinutes(membershipendsAt.getMinutes() + 1)
        await User.updateOne(
            { email:req.session.email },{ $set:{version : version, membershipendsAt : membershipendsAt} }
        )
        res.json({result:true})
    }
)

app.get('/membershipexpired',async(req,res)=>{
    if(req.session.email){
        const email = req.session.email
       const user = await User.findOne( { email } )
       const currentDate = new Date()
       
       if ( (user.membershipendsAt < currentDate) && ( user.version === 'premium' || user.version === 'basic' ) )
       {
            await User.updateOne(
                {email},
                {$set:
                    {
                        version:'free'
                    },
                },
                {$unset :{
                    membershipendsAt:''
                }}
            )
            res.json( { success:true } )
       }
       else{
        res.json( { success:false } )
       }
    }
    else{
    res.json( { success:false } )
    }
})

app.get('/isAdminLogin',async (req,res)=>{
    let email = req.session.email
    let user = await User.findOne( {email} )
    let response = { admin:false }
    if(user.role == 'admin')
    {
        response.admin = true
    }
    else{
        response.admin = false
    }
    res.json( response )
})

app.get('/logout',(req,res)=>{
req.session.destroy(
    (err)=>{
        if(err){
            console.log(err)
            return res.status.send({result:false})
        }
    }
)
res.clearCookie('connect.sid')
res.send({result:true})
})
app.listen(PORT,()=>console.log(`port started at ${PORT}`))