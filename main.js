#!/usr/bin/env node

'use strict'
const fs = require('fs')
const path = require('path')
// 文件变动检测
const chokidar = require('chokidar')

const Script = require('./lib/script')
// 日志输出
const { getLogger } = require('log4js')
const logger = getLogger()

// js预处理
const postcss      = require('postcss')
const precss = require('precss')
// css压缩
const cssnano = require('cssnano')
const autoprefixer = require('autoprefixer')

const heardHandle = require('./lib/heard')
const bodyHandle = require('./lib/page')
const Cut = require('./lib/cut')

// 配置日志输出等级
// logger.level = 'debug'
logger.level = 'info'

// 命令行运行目录
const runPath = process.cwd()

// 判断运行目录下是否包含配置文件
if (!fs.readFileSync(path.join(runPath, 'ozzx.json'))) {
  logger.error('ozzx.json file does not exist!')
  close()
}

// 读取配置文件
const config = JSON.parse(fs.readFileSync(path.join(runPath, 'ozzx.json'), 'utf8'))
// 代码目录
const demoPath = runPath + config.root
// 输出目录
const outPutPath = path.join(runPath, config.outFolder)
const corePath = path.join(__dirname, 'core')

// 读取指定目录文件
function loadFile(path) {
  if (fs.existsSync(path)) {
    return fs.readFileSync(path, 'utf8')
  } else {
    logger.error(`file does not exist: ${path}`)
    return ''
  }
}

// 执行默认打包任务
function pack () {
  // 开始打包时间
  const startTime = new Date().getTime()
  // 读取入口模板文件(一次性读取到内存中)
  let templet = fs.readFileSync(path.join(demoPath, 'index.html'), 'utf8')
  // 使用heard处理文件
  templet = heardHandle(path.join(demoPath, config.headFolder), templet)

  // 处理body
  const dom = bodyHandle(templet, config)

  // 读取出全局样式
  const mainStyle = fs.readFileSync(`${demoPath}/main.css`, 'utf8') + '\r\n'

  // 判断是否需要压缩css
  let outPutCss = mainStyle + dom.style
  logger.debug(dom.useAnimationList)
  
  // --------------------------------- 动画效果 ---------------------------------------------
  // 判断是自动判断使用的动画效果还是用户指定
  if (config.choiceAnimation) {
    logger.debug('用户设置加载全部动画效果!')
    // 加载全部特效
    const animationFilePath = path.join(corePath, 'animation', `animations.css`)
    outPutCss += loadFile(animationFilePath)
  } else {
    dom.useAnimationList.forEach(animationName => {
      const animationFilePath = path.join(corePath, 'animation', `${animationName}.css`)
      outPutCss += loadFile(animationFilePath)
    })
  }

  // 根据不同情况使用不同的core
  // 读取出核心代码
  let coreScript = loadFile(path.join(corePath, 'main.js'))
  if (dom.isOnePage) {
    // 单页面
    coreScript += loadFile(path.join(corePath, 'SinglePage.js'))
  } else {
    // 多页面
    coreScript += loadFile(path.join(corePath, 'MultiPage.js'))
  }
  // 页面切换特效
  // 判断是否存在页面切换特效
  if (dom.useAnimationList.length > 0 || config.choiceAnimation) {
    coreScript += loadFile(path.join(corePath, 'animation.js'))
  }
  // 整合页面代码
  coreScript += dom.script
  // 处理使用到的方法
  let toolList = Cut.stringArray(coreScript, 'ozzx.tool.', '(')
  // 数组去重
  toolList = new Set(toolList)
  toolList.forEach(element => {
    // console.log(element)
    coreScript += loadFile(path.join(corePath, 'tool', `${element}.js`))
  })
  
  // 使用bable处理代码
  coreScript = Script(coreScript, config.minifyJs).code

  // 使用
  // 判断输出目录是否存在,如果不存在则创建目录
  if (!fs.existsSync(outPutPath)) {
    fs.mkdirSync(outPutPath)
  }

  // 自动加浏览器前缀
  // console.log(autoprefixer.process)
  let plugList = [precss, autoprefixer]
  // 判断是否压缩优化css
  if (config.minifyCss) {
    plugList.push(cssnano)
  }
  postcss(plugList).process(outPutCss, { from: undefined, cascade: true }).then( (result) => {
    result.warnings().forEach((warn) => {
      console.warn(warn.toString());
    })
    // 写出文件
    fs.writeFileSync(path.join(outPutPath, 'main.css'), result.css)
    fs.writeFileSync(path.join(outPutPath, 'main.js'), coreScript)
    fs.writeFileSync(path.join(outPutPath, 'index.html'), dom.html)
    // 处理引用的script
    if (config.scriptList) {
      config.scriptList.forEach(element => {
        if (element.src && element.babel) {
          const fileData = fs.readFileSync(path.join(runPath, element.src))
          if (fileData) {
            const outPutFile = path.join(outPutPath, `${element.name}.js`)
            fs.writeFileSync(outPutFile, Script(fileData, config.minifyJs).code)
            logger.info(`bable and out put file: ${outPutFile}`)
          }
        } else {
          console.error('script path unset!', element)
        }
      })
    }
    logger.info(`Package success! use time ${new Date().getTime() - startTime}`)
  })
}

// 开始打包
pack()

// 判断是否开启文件变动自动重新打包
if (config.autoPack) {
  // 文件变动检测
  const watcher = chokidar.watch(demoPath, {
    ignored: './' + config.outFolder + '/*',
    persistent: true,
    usePolling: true
  })

  watcher.on('change', changePath => {
    console.log(`file change: ${changePath}`)
    // 重新打包
    pack()
  })
}
