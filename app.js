const fs = require('fs-extra')
const get = require('simple-get')
const path = require('path')
const childProcess = require('child_process')
const retry = require('async/retry')
const CONFIG = require('./config.json')


const unsafeStr = new RegExp(
    /[\u0001-\u001f\u007f-\u009f\u00ad\u0600-\u0605\u061c\u06dd\u070f\u08e2\u180e\u200b-\u200f\u202a-\u202e\u2060-\u2064\u2066-\u206f\ufdd0-\ufdef\ufeff\ufff9-\ufffb\ufffe\uffff]/g
)

const fullWidthDict = [
['\\\\', '＼'],
['/', '／'],
[':', '：'],
['\\?', '？'],
['"', '＂'],
['<', '＜'],
['>', '＞'],
['\\*', '＊'],
['\\|', '｜'],
['~', '～']
]

function replaceUnsafeStr(str) {
    str = str.replace(unsafeStr, '')
    for (let index = 0, len = fullWidthDict.length; index < len; index++) {
        const rule = fullWidthDict[index]
        const reg = new RegExp(rule[0], 'g')
        str = str.replace(reg, rule[1])
    }
    return str
}

function coverDownloader(url, destination) {
    const parsedURL = new URL(url)
    const extname = path.extname(parsedURL.pathname)
    return new Promise((resolve, reject) => {
        get(url, function (err, res) {
            if (err) return reject(err)
            if(res.statusCode === 200) {
                const coverPath = path.join(destination, 'Cover' + extname)
                res.pipe(fs.createWriteStream(coverPath)).on("close", function (err) {
                    if (err) {
                        fs.unlinkSync(coverPath)
                        return reject(err)
                    }
                    resolve()
                });
            } else {
                reject(`statusCode: ${res.statusCode}`)
            }
        })
    })
}

const videos = fs.readdirSync(path.resolve(CONFIG.INPUT))
let imageTasks = {}

videos.forEach(video => {
    const videoClips = fs.readdirSync(path.resolve(CONFIG.INPUT, video))
    videoClips.forEach(clip => {
        let uploader = 'unkown'
        const clipPath = path.resolve(CONFIG.INPUT, video, clip)
        const entryJSONPath = path.resolve(clipPath, 'entry.json')
        const entryRaw = fs.readFileSync(entryJSONPath)
        const entry = JSON.parse(entryRaw)
        if(entry.owner_id) {
            uploader = String(entry.owner_id)
        }
        const folderName = replaceUnsafeStr(`av${entry.avid}-${entry.title}`)
        const outputPath = path.resolve(CONFIG.OUTPUT, uploader, folderName)
        fs.ensureDirSync(outputPath)
        const inputPrefix = path.resolve(CONFIG.INPUT, video, clip, entry.type_tag)
        const audioFilePath = path.resolve(inputPrefix, 'audio.m4s')
        const videoFilePath = path.resolve(inputPrefix, 'video.m4s')
        const filepath = path.resolve(outputPath, `${entry.page_data.part}.mp4`)
        const ffmpegParams = ['-y', '-i', videoFilePath, '-i', audioFilePath, '-vcodec', 'copy', '-acodec', 'copy', filepath]
        const result = childProcess.spawnSync(CONFIG.FFMPEG, ffmpegParams)
        if(result.status != 0) {
            console.log('input params:', ffmpegParams)
            throw result.stderr.toString()
        } else {
            fs.copyFileSync(entryJSONPath, path.join(outputPath, `${entry.page_data.part}-entry.json`))
            fs.copyFileSync(path.join(clipPath, 'danmaku.xml'), path.join(outputPath, `${entry.page_data.part}-danmaku.xml`))
            if(!imageTasks[outputPath]) {
                imageTasks[outputPath] = {cover: entry.cover, outputPath}
            }
            console.log(result.stderr.toString())
        }
    })
})

Promise.all(
    Object.values(imageTasks).map(item => retry(5, async function () { return coverDownloader(item.cover, item.outputPath) }))
)
.then(res => console.log('Covers Download Completed'))
.catch(err => console.log('Covers Download failure: ', err))