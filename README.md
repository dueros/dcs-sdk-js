# dcs客户端demo

## 1. 通用的依赖
  * sox，提供录音、格式转换、播放声音的命令行
  * mplayer，为了播放音乐


### mac下
```shell
brew install sox mplayer python

```

### 树莓派linux下
```shell
sudo apt-get install sox
sudo apt-get install libsox-fmt-mp3
sudo apt-get install libasound2 libasound2-dev alsa-utils
sudo apt-get install python
sudo apt-get install libatlas-base-dev
sudo apt-get install libatlas-dev


#### build mplayer, raspberrypi的仓库里面没有
sudo apt-get install libmpg123-dev
wget http://www.mplayerhq.hu/MPlayer/releases/MPlayer-1.3.0.tar.xz
tar xvf MPlayer-1.3.0.tar.xz
cd MPlayer-1.3.0
./configure;
make
sudo make install
cd -

#### build libiconv, raspberrypi的仓库里没有
wget https://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.15.tar.gz
tar xzvf libiconv-1.15.tar.gz
cd libiconv-1.15
./configure --prefix=/usr
make
sudo make install
cd -


#### 使用nvm 安装node
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
. ~/.bashrc
nvm install --lts
nvm use --lts

```




## 2.安装应用

### 下载代码

```shell
git clone https://github.com/dueros/dcs-sdk-js.git
export CODE_ROOT=$(pwd)/dcs-sdk-js
```
以下假设代码被解压到$CODE_ROOT

### 安装依赖的node库：

```shell
cd $CODE_ROOT
npm install

#### 安装snowboy唤醒 ####
cd snowboy
npm install
npm install -g node-pre-gyp
node-pre-gyp clean
node-pre-gyp configure
node-pre-gyp build
```

## 3.修改配置

### 几种平台上的默认配置文件

树莓派 + DuerOS个人版录音套件，请执行

```shell
cp dcs_config.json.pi dcs_config.json
```

树莓派 + ReSpeaker 2-Mics，请执行

```shell
cp dcs_config.json.pi.respeaker dcs_config.json
```

macos环境下，请执行
```shell
cp dcs_config.json.mac dcs_config.json
```

### 需要单独修改的配置项
* 修改dcs_config.json中的access_token（oauth登录信息）
* 修改dcs_config.json中的device_id为代表本机id的字符串 （设备id）


### 拿到access_token的方法：

用一个度秘开放平台合法的client_id

```shell
cd $CODE_ROOT
//修改其中的client_id、client_secret为自己的申请的应用
vim get_access_token.js
node get_access_token.js
```



~~访问地址（请修改里面的CLIENT_ID和REDIRECT_URI，REDIRECT_URI在控制台的Oauth config的安全设置里修改）：[https://openapi.baidu.com/oauth/2.0/authorize?client_id={{CLIENT_ID}}&response_type=token&redirect_uri={{REDIRECT_URI}}](https://openapi.baidu.com/oauth/2.0/authorize?client_id={{CLIENT_ID}}&response_type=token&redirect_uri={{REDIRECT_URI}})~~

### 入口

```shell
cd $CODE_ROOT
node index.js
```

进入后，按回车开始听音

可以说“小度小度”唤醒


### 定制唤醒词

请访问[snowboy.kitt.ai](http://snowboy.kitt.ai/) 训练自己的唤醒模型，并且修改snowboy.js中模型相关的配置
