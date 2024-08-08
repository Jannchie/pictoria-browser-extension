// 创建右下角的可拖入区域
const dropZone = document.createElement('div')
dropZone.id = 'dropZone'
dropZone.textContent = 'Drop here!'
document.body.appendChild(dropZone)
// 添加拖入的样式
dropZone.style.position = 'fixed'
dropZone.style.bottom = '20px'
dropZone.style.right = '20px'
dropZone.style.width = '100px'
dropZone.style.height = '100px'
dropZone.style.backgroundColor = 'rgba(0,0,0,0.5)'
dropZone.style.color = 'white'
dropZone.style.display = 'none'
dropZone.style.justifyContent = 'center'
dropZone.style.alignItems = 'center'

// 绑定拖入、拖出和放置事件
dropZone.addEventListener('dragover', (event) => {
  event.preventDefault()
})

dropZone.addEventListener('drop', (event) => {
  dropZone.style.backgroundColor = 'rgba(0,0,0,0.5)'
  // 获取拖动的数据
  if (!event.dataTransfer) {
    return
  }
  const data = event.dataTransfer.items

  printDataTransferItems(data)
  function printDataTransferItems(items: string | any[] | DataTransferItemList) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      console.log('Type:', item.type)

      if (item.kind === 'string') {
        item.getAsString((data) => {
          console.log('Content:', data)
        })
      }
      else if (item.kind === 'file') {
        const file = item.getAsFile()
        console.log('File name:', file.name)
        console.log('File size:', file.size)
        console.log('File type:', file.type)
      }
    }
  }
  // 获取拖入的预览图片
})

document.addEventListener('dragover', (event) => {
  dropZone.style.display = 'flex' // 显示拖入区域
})

document.addEventListener('dragend', (event) => {
  dropZone.style.display = 'none' // 隐藏拖入区域
})
