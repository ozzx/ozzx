// 页面切换效果

// 获取URL参数
function getQueryString(newUrlParam, name) { 
  var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i")
  var r = newUrlParam.match(reg)
  if (r != null) return unescape(r[2])
  return null; 
}

// 无特效翻页
function dispalyEffect (oldDom, newDom) {
  if (oldDom) {
    // 隐藏掉旧的节点
    oldDom.style.display = 'none'
  }
  // 查找页面跳转后的page
  newDom.style.display = 'block'
}

// 淡入效果
function fadeinEffect (oldDom, newDom) {
  // 查找页面跳转后的page
  newDom.style.position = 'fixed'
  newDom.style.left = 0
  newDom.style.top = 0
  newDom.style.width = '100%'
  newDom.style.height = '100%'
  newDom.style.opacity = 0
  newDom.style.transition = 'opacity 1s'
  newDom.style.display = 'block'
  setTimeout(() => {
    if (oldDom) {
      // 隐藏掉旧的节点
      oldDom.style.display = 'none'
      // 清除临时设置的style
      newDom.style.position = ''
      newDom.style.left = ''
      newDom.style.top = ''
      newDom.style.width = ''
      newDom.style.height = ''
      newDom.style.opacity = ''
      newDom.style.transition = ''
    }
  }, 900)
  setTimeout(() => {
    newDom.style.opacity = 1
  }, 0)
}

// 淡出效果
function fadeoutEffect (oldDom, newDom) {
  // 查找页面跳转后的page
  oldDom.style.zIndex = 999
  oldDom.style.position = 'fixed'
  oldDom.style.left = 0
  oldDom.style.top = 0
  oldDom.style.width = '100%'
  oldDom.style.height = '100%'
  oldDom.style.opacity = 1
  oldDom.style.transition = 'opacity 1s'
  newDom.style.display = 'block'
  setTimeout(() => {
    if (oldDom) {
      // 隐藏掉旧的节点
      oldDom.style.display = 'none'
      // 清除临时设置的style
      oldDom.style.position = ''
      oldDom.style.left = ''
      oldDom.style.top = ''
      oldDom.style.width = ''
      oldDom.style.height = ''
      oldDom.style.opacity = ''
      oldDom.style.transition = ''
    }
  }, 900)
  setTimeout(() => {
    oldDom.style.opacity = 0
  }, 0)
}

function switchPage (oldUrlParam, newUrlParam) {
  var oldPage = oldUrlParam.split('&')[0]
  var newPage = newUrlParam.split('&')[0]
  // 查找页面跳转前的page页(dom节点)
  // console.log(oldUrlParam)
  // 如果源地址获取不到 那么一般是因为源页面为首页
  if (oldPage === undefined) {
    oldPage = globalConfig.entry
  }
  var oldDom = document.getElementById('ox-' + oldPage)
  var newDom = document.getElementById('ox-' + newPage)
  if (!newDom) {
    console.error('页面不存在!')
    return
  }
  // 判断是否有动画效果
  switch (getQueryString(newUrlParam, 'animation')) {
    case null: {
      dispalyEffect(oldDom, newDom)
      break
    }
    case 'fadein': {
      fadeinEffect(oldDom, newDom)
      break
    }
    case 'fadeout': {
      fadeoutEffect(oldDom, newDom)
      break
    }
  }
  
  window.ozzx.activePage = newPage
  runPageFunction(newPage, newDom)
}