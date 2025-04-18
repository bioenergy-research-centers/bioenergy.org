const {validateTurnstileForm} = require('../utils/turnstileValidator');
const {formatContactForm} = require('../utils/markdownFormatter');
const {syncIssueComment} = require("../services/githubService");
const sanitizeHtml = require('sanitize-html');

// Create new Message
async function create(req, res) {
  const data = req.body;
  try {
    // Validate CF turnstile key
    const cfValid = await validateTurnstileForm(req);
    if(!cfValid){
      res.json({error: "Invalid form data. Please verify you are human."});
      return;
    }
    if(!data.contact_name || !data.contact_email || !data.contact_reason || !data.contact_comment){
      res.json({error: "Invalid form data. Please provide all required fields."});
      return;
    }
    // Create or update new message
    // Title and label are used to find existing comments
    const title = `${sanitizeHtml(data.contact_name)} (${sanitizeHtml(data.contact_email)}) - ${data.contact_reason}`;
    const formattedMessage = formatContactForm(data);
    const saveStatus = await syncIssueComment(title, formattedMessage, {labels: 'contact-form'}); 
    
    if(saveStatus){
      res.json({success: true, message: 'Message saved.'});
    }else{
      res.json({error: "There was an error saving this message."});
    }
    
  } catch (error) {
    console.error("Error saving message: ", error.message);
    res.status(500).json({error: "There was an error saving this message."});
  }
  
};
module.exports = {create};