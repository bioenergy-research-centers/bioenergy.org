<script setup>
  import HeaderView from "@/views/HeaderView.vue";
  import { onMounted, onUnmounted, onActivated, ref } from 'vue'
  import { useTurnstile } from '@/composables/useTurnstile'
  import MessageDataService from "../services/MessageDataService";

  useTurnstile("#cf-turnstile-container");

  const contactReasons = [
    "Adding data to the site",
    "Site feature/bug/update",
    "Other"
  ]
  const form = ref(null);
  const contactAgree = ref(false);
  const message = ref('')
  const messageClass = ref('')

  const handleSubmit = async () => {
    if (!form.value) return;
    // collect form data, including field added by turnstile
    const formData = new FormData(form.value);

    try {
        const response = await MessageDataService.create(formData);

        const result = await response.data;

        if (result.success) {
            message.value = "Thank you for your feedback!";
            if(result.message){
              message.value = result.message + " " + message.value 
            }
            messageClass.value = "alert alert-success";
        } else {
            message.value = result.error || "Something went wrong.";
            messageClass.value = "alert alert-danger";
        }
    } catch (err) {
        console.error('error', err)
        message.value = "Network error. Please try again.";
        messageClass.value = "alert alert-danger";
    }
  }
</script>

<template>
  <HeaderView />
  <div class="container">

    <div class="row">
      <h2 class="page-heading">Contact Us</h2>
      <hr/>
      <p class="lead">
        This site is dedicated to creating FAIR datasets to share across Bioenergy Research Centers (BRCs) and to the global research community.
      </p>
      <p class="lead">
        Please contact us with any questions or suggestions for additional data using the form below.
      </p>
    </div>
    
    <div v-if="message" :class="messageClass">
      {{ message }}
    </div>

    <form ref="form" @submit.prevent="handleSubmit" class="col-md-8 mt-3" action="/contact" method="POST">
      
      <div class="mb-3">
        <label for="contact_email" class="form-label">Email</label>
        <input type="email" class="form-control" placeholder="" name="contact_email" required/>
      </div>

      <div class="mb-3">
        <label for="contact_name" class="form-label">Name</label>
        <input type="text" class="form-control" placeholder="" name="contact_name" required/>
      </div>

      <div class="mb-3">
        <label for="contact_email" class="form-label">Company, Institution, or other Affiliation</label>
        <input type="text" class="form-control" placeholder="" name="contact_affiliation"/>
      </div>

      <div class="mb-3">
        <label for="contact_reason" class="form-label">Why are you contacting us?</label>
        <select class="form-select" name="contact_reason" required>
            <option disabled selected defaultValue="" value=""> -- select an option --</option>
            <option v-for="reason in contactReasons">
              {{ reason }}
            </option>
        </select>
      </div>

      <div class="mb-3">
        <label for="contact_feedback" class="form-label">Description</label>
        <textarea rows="5" cols="50" class="form-control" placeholder="" name="contact_comment" maxlength="10000" required/>
      </div>

      <br/>
      <div class="cf-turnstile" id='cf-turnstile-container'></div>
      <br/>

      <div id="userSubmitAcknowledgementHelpBlock" class="form-text">
        <b>By submitting this form, you agree to share your information with all bioenergy.org project members and permit bioenergy.org to communicate with you.</b>
      </div>
      <br/>
      <div class="form-check">
        <input class="form-check-input" type="checkbox" value="" v-model="contactAgree" id="contactAgreeCheck">
        <label class="form-check-label" for="contactAgreeCheck">
          <b>I Agree</b>
        </label>
      </div>
      <br/>
      <button type="submit" class="btn btn-primary btn-sm" :disabled="!contactAgree">Send Feedback</button>
      <br/>
      <br/>
    </form>

  </div>

</template>
