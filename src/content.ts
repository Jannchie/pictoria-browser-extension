// 创建右下角的可拖入区域
import { createApp } from 'vue'
import Dropzone from './pages/Dropzone.vue'

const pictoria = document.createElement('div')
pictoria.id = 'pictoria'
document.body.appendChild(pictoria)

createApp(Dropzone).mount('#pictoria')
