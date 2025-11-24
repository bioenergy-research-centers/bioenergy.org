<script setup>
import {RouterView} from 'vue-router'
import Footer from '@/components/Footer.vue'; 
</script>

<!-- https://router.vuejs.org/guide/advanced/router-view-slot.html -->

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="ContactView">
      <component :is="Component" />
    </keep-alive>
  </router-view>
  <Footer/>
</template>
