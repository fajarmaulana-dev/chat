<script setup lang="ts">
import { getImage } from '@/utils/image';

</script>

<template>
    <div
        className="min-h-screen flex flex-col items-center justify-center gap-6 sm:gap-5 lg:gap-7 py-5 sm:py-7 lg:py-9">
        <div className="w-3/4 grid place-items-center">
            <img alt="not-found" height="475" :src="getImage('not-found.svg')" width="704" />
        </div>
        <router-link aria-label="Daftar Sekarang" className="group bg-sky-200 active:bg-sky-300 transition-colors duration-300 min-h-12 rounded-3xl px-5 flex
          items-center gap-2 border border-sky-200 whitespace-nowrap font-semibold text-slate-800" to="/chat">
            Kembali ke Beranda
            <img alt="arrow" className="w-0 h-auto group-hover:w-7 transition-all duration-500" height="28"
                src="https://storage.googleapis.com/komerce/rajaongkir/Arrow-sec-right.svg" width="28"
                style="filter: brightness(0) invert(14%) sepia(7%) saturate(3144%) hue-rotate(179deg) contrast(95%);" />
        </router-link>
    </div>
</template>