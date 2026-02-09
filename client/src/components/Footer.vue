<script setup>
  const docs_link = import.meta.env.VITE_BIOENERGY_ORG_API_URI + "/api-docs";
  
  import doeLogo from "@/assets/doe-logo.webp"
</script>

<template>
  <footer>
    <div class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-12 col-lg-6">

          <div class="row align-items-center">
            <div class="col-12 col-md-5 mb-3 mb-md-0">
              <img :src="doeLogo" class="img-fluid" alt="U.S. Department of Energy logo" />
            </div>

            <div class="col-12 col-md-7">
              <p class="mb-0" style="font-size:0.7em">
                The Bionergy Research Centers are supported by the Office of Science of the U.S. Department of Energy. The Office of Science is the single largest supporter of basic research in the physical sciences in the United States, and is working to address some of the most pressing challenges of our time. For more information, please visit <a href="https://science.energy.gov">science.energy.gov</a>.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
    <div class="container my-5">
      <div class="small text-center mt-4">
        
        InterBRC Data Products Portal 
        <i class="bi bi-c-circle small text-muted"></i>
        2025

        <span class="fw-light text-muted mx-2">|</span>
        <a href="https://www.jbei.org/wp-content/uploads/2024/08/BRCFlyer_2024-1.pdf" target="_blank" rel="noopener noreferrer" class="text-muted text-decoration-none ms-1">
          Bioenergy Research Center Brochure 
        </a>

        <span class="fw-light text-muted mx-2">|</span>
        <i class="bi bi-chat text-muted"></i>
        <router-link :to="{ name: 'contact'}" class="text-muted text-decoration-none ms-1 py-3">
          Contact Us
        </router-link>
    
        <span class="fw-light text-muted mx-2">|</span>
        <i class="bi bi-code text-muted"></i>
        <a :href="docs_link" class="text-muted text-decoration-none ms-1 py-3" target="_blank" rel="noopener noreferrer">Developer API Docs</a>

        <span class="fw-light text-muted mx-2">|</span>
        <i class="bi bi-github text-muted"></i>
        <a href="https://github.com/bioenergy-research-centers/" class="text-muted text-decoration-none ms-1 py-3" target="_blank" rel="noopener noreferrer">
          Code
        </a>

      </div>
    </div>
  </footer>
</template>