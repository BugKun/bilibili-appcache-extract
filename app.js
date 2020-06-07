const fs = require('fs-extra')
const path = require('path')
const childProcess = require('child_process')
const CONFIG = require('./config.json')

const videos = fs.readdirSync(path.resolve(CONFIG.INPUT))

videos.forEach(video => {
    const videoClips = fs.readdirSync(path.resolve(CONFIG.INPUT, video))
    videoClips.forEach(clip => {
        const entryRaw = fs.readFileSync(path.resolve(CONFIG.INPUT, video, clip, 'entry.json'))
        const entry = JSON.parse(entryRaw)
        fs.ensureDirSync(path.resolve(CONFIG.OUTPUT, entry.title))
        const audioFilePath = path.resolve(CONFIG.INPUT, video, clip, entry.type_tag, 'audio.m4s')
        const videoFilePath = path.resolve(CONFIG.INPUT, video, clip, entry.type_tag, 'video.m4s')
        const result = childProcess.spawnSync(CONFIG.FFMPEG, ['-y', '-i', videoFilePath, '-i', audioFilePath, '-vcodec', 'copy', '-acodec', 'copy', path.resolve(CONFIG.OUTPUT, entry.title, `${entry.page_data.part}.mp4`)])
        if(result.status != 0) {
            throw result.stderr.toString()
        } else {
            console.log(result.stderr.toString())
        }
    })
})