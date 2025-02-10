import { onMounted, onUnmounted, onActivated, ref } from 'vue'

export function useTurnstile(domSelector) {
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITEKEY;
  const turnstileURL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onloadTurnstileCallback';
  let turnstileWidgetID = null;

  onMounted(() => {
    // create the callback to initialize turnstile
    window.onloadTurnstileCallback = () => {
      turnstileWidgetID = turnstile.render(domSelector, {
        sitekey: turnstileSiteKey
      })
    }
    // load external JS package into dom
    if(window && !window.turnstile){
      // add turnstile source and run defined callback when ready
      let turnstileScript = document.createElement('script');
      turnstileScript.setAttribute('src', turnstileURL);
      document.head.appendChild(turnstileScript)
    }else if (window && window.turnstile && !turnstileWidgetID){
      // render turnstile again, after re-mounting this component
      window.onloadTurnstileCallback();
    }
  });
  
  onUnmounted(() => {
    // remove loaded widget before unmounting
    if(window && window.turnstile && turnstileWidgetID){
      window.turnstile.remove(turnstileWidgetID);
    }
  })

  // Using <KeepAlive> avoids re-mounting this component if the user navigates while filling out contact form
  // On activation, the turnstile captcha needs to be reset
  onActivated(() => {
    if(window && window.turnstile && turnstileWidgetID){
      // reset active widget
      window.turnstile.reset(turnstileWidgetID);
    }
  })
}