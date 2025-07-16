<script setup lang="ts">
import { toRefs, ref } from '@vue/reactivity';
import { useAttrs } from '@vue/runtime-core';

const emit = defineEmits(['prefix', 'suffix'])
const props = defineProps({
    withPrefix: {
        type: Boolean,
        default: false
    },
    withSuffix: {
        type: Boolean,
        default: false
    },
    wrapperClass: {
        type: String,
        default: ''
    },
    prefixClass: {
        type: String,
        default: ''
    },
    suffixClass: {
        type: String,
        default: ''
    }
})

const { withPrefix, withSuffix, wrapperClass, prefixClass, suffixClass } = toRefs(props)
const input = ref()
const attr = useAttrs()

defineExpose({
    getElement: () => input.value
});
</script>

<template>
    <div class="h-10 w-full rounded-full bg-neutral-100 flex items-center overflow-hidden" :class="wrapperClass">
        <button v-if="withPrefix" class="h-full px-2.5 grid place-items-center outline-none border-none"
            :class="prefixClass" @click="emit('prefix', input)">
            <slot name="prefix"></slot>
        </button>
        <input class="h-full w-full bg-transparent text-slate-800 outline-none border-none text-sm"
            :class="{ 'pl-4': !withPrefix, 'pr-4': !withSuffix }" ref="input" v-bind="attr">
        <button v-if="withSuffix" class="h-full px-2.5 grid place-items-center outline-none border-none"
            :class="suffixClass" @click="emit('suffix', input)">
            <slot name="suffix"></slot>
        </button>
    </div>
</template>