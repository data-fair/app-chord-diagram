<template>
    <div>
      <span
        @mouseover="hover = true"
        @mouseleave="hover = false"
        :class="{ active: hover }"
      >
        Hover me to change the background!
      </span>
    </div>
  </template>
  
  <script setup>
  // Essayer Class avec variable "? :"
  import { ref } from 'vue'
  const hover = ref(false);
  </script>

<style scoped>
.active {
  background: green;
}
</style>