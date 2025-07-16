<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

if (router.currentRoute.value.path === '/') {
  router.replace('/chat')
}
</script>

<template>
  <router-view></router-view>
</template>