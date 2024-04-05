
const persistence = require('./persistence')
const crypto = require('crypto')

/*
async function validateCredentials(username, password) {
    return await persistence.validateCredentials(username, password)
}
*/
async function userType(username, password) {
    let data = await persistence.getUser(username);

    if(data.password !== persistence.computeHash(password)){
        return null;
    }
    return data.accountType;
}
async function startSession(data) {
    let sessionKey = crypto.randomUUID()
    let sd = {
        key: sessionKey,
        expiry: new Date(Date.now() + 1000*60*5), // 5 minutes
        data: data
    }
    await persistence.updateSession(sd)
    return sessionKey
}

async function getSession(key) {
    return await persistence.getSession(key)
}

async function terminateSession(key) {
    return await persistence.deleteSession(key)
}

async function registerUser(name, email, description) {
    let reg = {
        name: name,
        email: email,
        description: description,
        approved: false
    }
    return await persistence.createRegistration(reg)
}

async function getApplications() {
    return await persistence.getAllApplications()
}

async function approveRegistration(email) {
    return await persistence.updateApproval(email)
}

async function generateFormToken(sessionID) {
    let token = Math.floor(Math.random() * 100000);
    let sessData = await persistence.getSession(sessionID);
    sessData.csrfToken = token;
    await persistence.updateSession(sessData);
    return token;
}
  
async function deleteFormToken(sessionID) {
    let sessData = await persistence.getSession(sessionID);
    delete sessData.csrfToken;
    await persistence.updateSession(sessData);
}

async function setFlash(sessionID, message) {
    let sessionData = await persistence.getSession(sessionID);
    sessionData.flash = message;
    await persistence.updateSession(sessionData);
  }
  async function getFlash(sessionID) {
    
    let sessionData = await persistence.getSession(sessionID);
    if (!sessionData) {
      return undefined;
    }
    let res = sessionData.flash;
    delete sessionData.flash;
    await persistence.updateSession(sessionData);
    return res;
  }
  

module.exports = {
    registerUser, getApplications, approveRegistration,
    validateCredentials,
    startSession, getSession, terminateSession,
    generateFormToken,deleteFormToken,
    setFlash,getFlash,getUser,userType 
}