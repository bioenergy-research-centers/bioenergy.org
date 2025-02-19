<script setup>
import {RouterView} from 'vue-router'
</script>

<!-- https://router.vuejs.org/guide/advanced/router-view-slot.html -->

<template>
  <router-view v-slot="{ Component }">
    <keep-alive include="AboutView">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
