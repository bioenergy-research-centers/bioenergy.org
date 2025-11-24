<script setup>
  const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";
</script>

<template>
  <div class="container my-5">
    <div class="small text-center">
      
      InterBRC Data Products Portal 
      <i class="bi bi-c-circle small text-muted"></i>
      2025

      <span class="fw-light text-muted mx-2">|</span>
      <a href="https://www.jbei.org/wp-content/uploads/2024/08/BRCFlyer_2024-1.pdf" target="_blank" rel="noopener noreferrer" class="text-muted text-decoration-none ms-1">
        Bioenergy Research Center Brochure 
      </a>

      <span class="fw-light text-muted mx-2">|</span>
      <i class="bi bi-chat text-muted"></i>
      <router-link :to="{ name: 'contact'}" class="text-muted text-decoration-none ms-1">
        Contact Us
      </router-link>
  
      <span class="fw-light text-muted mx-2">|</span>
      <i class="bi bi-code text-muted"></i>
      <a :href="docs_link" class="text-muted text-decoration-none ms-1" target="_blank" rel="noopener noreferrer">Developer API Docs</a>

      <span class="fw-light text-muted mx-2">|</span>
      <i class="bi bi-github text-muted"></i>
      <a href="https://github.com/bioenergy-research-centers/" class="text-muted text-decoration-none ms-1" target="_blank" rel="noopener noreferrer">
        Code
      </a>

    </div>
  </div>
</template>