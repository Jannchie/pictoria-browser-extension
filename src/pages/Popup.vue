<script lang="ts" setup>
import { ref, watchEffect } from 'vue'
import browser from 'webextension-polyfill'

const serverURL = ref('http://localhost:4777')
browser.storage.sync.get(['serverURL']).then(({ serverURL: storedServerURL }) => {
  if (storedServerURL) {
    serverURL.value = storedServerURL
  }
})

watchEffect(async () => {
  await browser.storage.sync.set({ serverURL: serverURL.value })
})
</script>

<template>
  <div>
    <img
      style="width: 40px; height: 40px"
      src="/icon-with-shadow.svg"
    >
    <h1>Pictoria</h1>
    <div>
      <input
        v-model="serverURL"
        placeholder="Server URL"
      >
    </div>
  </div>
</template>

<style>
html,
body {
  width: 300px;
  height: 400px;
  padding: 0;
  margin: 0;
}

body {
  background-color: rgb(36, 36, 36);
}

body > div {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  justify-content: center;
}

img {
  width: 200px;
  height: 200px;
}

h1 {
  font-size: 18px;
  color: white;
  font-weight: bold;
  margin: 0;
}

p {
  color: white;
  opacity: 0.7;
  margin: 0;
}

code {
  font-size: 12px;
  padding: 2px 4px;
  background-color: #ffffff24;
  border-radius: 2px;
}
</style>
