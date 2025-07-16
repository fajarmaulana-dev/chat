import { createApp, h } from '@vue/runtime-dom'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { IconoirProvider } from '@iconoir/vue'
import './style.css'
import 'vue3-emoji-picker/css'
import '@fontsource-variable/plus-jakarta-sans'

const app = createApp({
  render() {
    return h(IconoirProvider, null, {
      default: () => h(App),
    })
  },
})

app.use(createPinia())
app.use(router)

app.mount('#app')
