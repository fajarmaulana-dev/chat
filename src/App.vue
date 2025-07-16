<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

if (router.currentRoute.value.path === '/') {
  router.replace('/chat')
}
</script>

<template>
  <div class="bg-slate-100 min-h-screen sm:px-mobile md:px-desktop 2xl:px-0 sm:pt-4 md:pt-6">
    <router-view class="max-w-screen-xl mx-auto"></router-view>
  </div>
</template>