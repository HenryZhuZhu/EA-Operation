import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { vCount } from './directives/count'
import './styles/operations.css'

createApp(App).use(router).directive('count', vCount).mount('#app')
