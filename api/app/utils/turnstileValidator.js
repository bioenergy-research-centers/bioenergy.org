const SECRET_KEY = process.env.TURNSTILE_SECRETKEY
// Expects a request object with json formatted body
// Returns boolean result of form validation
// See: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
async function validateTurnstileForm(request) {
    // Turnstile injects a token in "cf-turnstile-response".
    const token = request.body?.cf?.turnstile?.response;
    // Todo: send IP header from client for additional verification
    //const ip = request.header('CF-Connecting-IP');
  
    // Validate the token by calling the "/siteverify" API endpoint.
    const url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const result = await fetch(url, {
      body: JSON.stringify({
        secret: SECRET_KEY,
        response: token,
        //remoteip: ip
      }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const outcome = await result.json();
    if (outcome.success) {
      return true;
    } else {
      console.error("Turnstile error:", outcome)
      return false;
    }

}
module.exports = {validateTurnstileForm};