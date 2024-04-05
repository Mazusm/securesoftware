const fs = require('fs')
const mongodb = require('mongodb')
let client = undefined 
let db = undefined
let courseCollection = undefined

async function connectDatabase() {
    if (!client) {
        client = new mongodb.MongoClient('mongodb+srv://mazen:Qa1234560@cluster0.vyqal3g.mongodb.net/')
        db = client.db('university')
        courseCollection = db.collection('course')
        await client.connect()
    }
}

  /*async function validateCredentials(username, password) {
    await connectDatabase();
    let data = db.collection('userAccount')

    
  let raw = fs.readFileSync('userAccount01.json')
    let data = JSON.parse(raw)
    for (let user of data) {
        if (user.username === username && user.password === password) {
            return true
        }
    }
    return false
}*/
async function updateSession(sd) {
    let raw = fs.readFileSync('session.json')
    let data = JSON.parse(raw)
    let result = []
    for (let s of data) {
        if (s.expiry > Date.now()) {
            result.push(s)
        }
    }
    // try to find
    for (let s of result) {
        if (s.key == sd.key) {
            s.data = sd.data
            fs.writeFileSync('session.json', JSON.stringify(result))
            return
        }
    }
    result.push(sd)
    fs.writeFileSync('session.json', JSON.stringify(result))
}

async function getSession(key) {
    let raw = fs.readFileSync('session.json')
    let data = JSON.parse(raw)
    let temp = []
    let result = undefined
    let modified = false
    // first, remove any expired data
    for (let s of data) {
        let current = new Date(Date.now())
        let exp = new Date(s.expiry)
        console.log(typeof current)
        console.log(typeof s.expiry)
        if (exp > Date.now()) {
            temp.push(s)
        }
        else {
            modified = true
        }
    }
    for (let s of temp) {
        if (s.key === key) {
            result = s
            break
        }
    }
    if (modified) {
        fs.writeFileSync('session.json', JSON.stringify(temp))
    }
    return result
}

async function deleteSession(key) {
    let raw = fs.readFileSync('session.json')
    let data = await JSON.parse(raw)
    let temp = []
    for (let s of data) {
        if (s.key != key) {
            temp.push(s)
        }
    }
    await fs.writeFileSync('session.json', JSON.stringify(temp))
}

async function createRegistration(details) {
    let raw = fs.readFileSync('registrations.json')
    let data = JSON.parse(raw)
    data.push(details)
    fs.writeFileSync('registrations.json', JSON.stringify(data))
}

async function getAllApplications() {
    let raw = fs.readFileSync('registrations.json')
    let data = JSON.parse(raw)
    return data    
}

async function updateApproval(email) {
    let raw = fs.readFileSync('registrations.json')
    let data = JSON.parse(raw)
    for (let app of data) {
        if (app.email == email) {
            app.approved = true
        }
    }
    fs.writeFileSync('registrations.json', JSON.stringify(data))
}
async function getUser(username){
    await connectDatabase()
    let info = db.collection("userAccount");
    return info.findOne({'username': username})
}

module.exports = {
    validateCredentials,
    updateSession, getSession, deleteSession,
    createRegistration, getAllApplications, updateApproval,getUser
}