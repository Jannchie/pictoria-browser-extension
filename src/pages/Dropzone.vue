<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import browser from 'webextension-polyfill'

const dropzoneRef = ref<HTMLElement | null>(null)
const show = ref(false)
const succeed = ref(false)
watchEffect(() => {
  if (succeed.value) {
    setTimeout(() => {
      succeed.value = false
      show.value = false
    }, 750)
  }
})
async function getImageFormat(blob: Blob): Promise<string> {
  function readFileAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()

      fileReader.onloadend = function (e) {
        if (e.target?.result instanceof ArrayBuffer) {
          resolve(e.target.result)
        }
        else {
          reject(new Error('Failed to read file as ArrayBuffer'))
        }
      }

      fileReader.onerror = function () {
        reject(new Error('Error reading file'))
      }

      fileReader.readAsArrayBuffer(blob)
    })
  }

  try {
    const arrayBuffer = await readFileAsArrayBuffer(blob)
    const arr = new Uint8Array(arrayBuffer).subarray(0, 8)
    let header = ''
    for (let i = 0; i < arr.length; i++) {
      header += arr[i].toString(16)
    }

    // Check magic numbers for various formats
    if (header.startsWith('ffd8ff')) {
      return 'JPEG'
    }
    else if (header.startsWith('89504e47')) {
      return 'PNG'
    }
    else if (header.startsWith('47494638')) {
      return 'GIF'
    }
    else if (header.startsWith('424d')) {
      return 'BMP'
    }
    else if (header.startsWith('52494646')) {
      return 'WebP'
    }
    else {
      // Check for SVG file
      if (arrayBuffer.byteLength >= 5) {
        const textDecoder = new TextDecoder('utf-8')
        const text = textDecoder.decode(new Uint8Array(arrayBuffer).subarray(0, 5))
        if (text.startsWith('<?xml') || text.startsWith('<svg')) {
          return 'SVG'
        }
      }
      return 'Unknown'
    }
  }
  catch (error) {
    console.error(error)
    return 'Unknown'
  }
}
watchEffect(() => {
  if (!dropzoneRef.value) {
    return
  }
  dropzoneRef.value.addEventListener('dragover', (event) => {
    event.preventDefault()
    event.dataTransfer!.dropEffect = 'copy'
  })
  dropzoneRef.value.addEventListener('drop', async (event) => {
    try {
      const items = event.dataTransfer!.items
      const blobUrls: string[] = []
      const promises = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          const file = item.getAsFile()
          if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file)
            blobUrls.push(url)
          }
        }
        else if (item.kind === 'string') {
          const promise = new Promise<string | null>((resolve) => {
            item.getAsString(async (data) => {
            // 创建一个临时 DOM 元素来解析 HTML
              const parser = new DOMParser()
              const doc = parser.parseFromString(data, 'text/html')
              const imgTags = Array.from(doc.getElementsByTagName('img'))
              for (let i = 0; i < imgTags.length; i++) {
                const img = imgTags[i]
                const src = img.getAttribute('src')
                if (src) {
                  resolve(src)
                }
              }
              resolve(null)
            })
          })
          promises.push(promise)
        }
      }
      const urls = (await Promise.all(promises)).filter(d => d) as string[]
      // 此时 images 数组中包含了所有的图片链接和文件的URL
      blobUrls.push(...urls)
      const formData = new FormData()
      for (const url of blobUrls) {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const filename = pathname.substring(pathname.lastIndexOf('/') + 1)
        try {
          const resp = await fetch(urlObj)
          const blob = await resp.blob()
          const format = await getImageFormat(blob)
          const name = `image.${format.toLowerCase()}`
          const type = getTypeFromFormat(format)
          const file = new File([blob], name, { type })
          const filenameWithExtension = filename.includes('.') ? filename : `${filename}.${format.toLowerCase()}`
          formData.append('file', file)
          formData.append('path', filenameWithExtension)
        }
        catch {}
        formData.append('url', url)
        formData.append('source', window.location.href)
        let { serverURL } = await browser.storage.sync.get(['serverURL'])
        if (!serverURL) {
          serverURL = 'http://localhost:4777'
        }
        await fetch(`${serverURL}/v1/upload`, {
          method: 'POST',
          body: formData,
        })
      }
      if (blobUrls.length === 0) {
        show.value = false
      }
      succeed.value = true
    }
    catch {
      succeed.value = false
      show.value = false
    }
  })

  window.addEventListener('dragstart', () => {
    show.value = true
  })

  window.addEventListener('dragend', (e) => {
    // 如果不是dropzoneRef的子元素，就隐藏
    if (!dropzoneRef.value?.contains(e.target as Node)) {
      show.value = false
    }
  })
})
function getTypeFromFormat(format: string) {
  switch (format) {
    case 'JPEG':
      return 'image/jpeg'
    case 'PNG':
      return 'image/png'
    case 'GIF':
      return 'image/gif'
    case 'BMP':
      return 'image/bmp'
    case 'WebP':
      return 'image/webp'
    case 'SVG':
      return 'image/svg+xml'
    default:
      return 'image/unknown'
  }
}
</script>

<template>
  <div
    ref="dropzoneRef"
    :style="[`display: ${show ? 'flex' : 'none'}`]"
    style="width: 240px; border: 2px dashed #867BCF; font-family: Arial, Helvetica, sans-serif; position: fixed; right: 20px; bottom: 20px; z-index: 99999999; background-color: white; color: black; padding: 16px 32px; border-radius: 16px; box-shadow: 0 0 16px rgba(0, 0, 0, 0.1); flex-direction: column; align-items: center; gap: 4px"
  >
    <svg
      width="48"
      height="48"
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        width="1024"
        height="1024"
        rx="177"
        fill="white"
      />
      <path
        d="M209 346.862C209 291.634 253.772 246.862 309 246.862H332.939C360.553 246.862 382.939 269.248 382.939 296.862V776.658C382.939 804.272 360.553 826.658 332.939 826.658H259C231.386 826.658 209 804.272 209 776.658V346.862Z"
        fill="#867BCF"
      />
      <rect
        x="425.844"
        y="556.473"
        width="173.939"
        height="245.833"
        rx="50"
        fill="#B3B6C0"
      />
      <path
        d="M425.844 272.511C425.844 244.897 448.23 222.511 475.844 222.511H499.782C555.011 222.511 599.782 267.283 599.782 322.511V458.93C599.782 486.544 577.397 508.93 549.782 508.93H475.844C448.23 508.93 425.844 486.544 425.844 458.93V272.511Z"
        fill="#867BCF"
      />
      <path
        d="M641.527 247C641.527 219.386 663.913 197 691.527 197H765.466C793.08 197 815.466 219.386 815.466 247V676.795C815.466 732.024 770.694 776.795 715.466 776.795H691.527C663.913 776.795 641.527 754.409 641.527 726.795V247Z"
        fill="#D9D9D9"
      />
    </svg>

    <div
      style="font-size: 16px; font-weight: normal; text-align: center; width: 100%;"
      :style="[`color: ${succeed ? '#4CAF50' : '#000'}`]"
    >
      {{ succeed ? 'Successfully' : 'Save to Pictoria' }}
    </div>
    <div style="font-size: 12px; opacity: 0.5;">
      {{ succeed ? 'Saved to Pictoria' : 'Drop your image here' }}
    </div>
  </div>
</template>

<style lang="css">

</style>
