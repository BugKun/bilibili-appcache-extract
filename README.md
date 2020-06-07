# bilibili-appcache-extract
* Extract videos from offline cache directories of bilibili mobile client app, with names including the videos' title. 
* 从B站的手机APP离线缓存目录中提取视频合并为.mp4文件，并在文件名中标注标题。

## 使用方式
### 复制手机APP的缓存文件到主机上
视频在手机上的位置`（所有文件-Android-data-tv.danmaku.bili(bilibili的APP包名称)-download-av号数字-）`  
把所需要提取视频的`av号数字`的整个文件夹复制到主机上
### 修改配置文件`config.json`
```javascript
{
    "INPUT": "./input", // 文件输入的目录
    "OUTPUT": "./output", // 文件输出的目录
    "FFMPEG": "./ffmpeg/ffmpeg.exe" // ffmpeg所在的路径
}
```
### 安装依赖
* 请确认主机已安装[Node.js](https://nodejs.org)运行环境
* 执行命令
```bash
npm install
```
### 运行程序
* 执行命令
```bash
npm start
```