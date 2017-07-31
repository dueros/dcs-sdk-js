# dcs客户端demo

## 通用的依赖
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

```




## node版

 以下假设代码被解压到$CODE_ROOT

```shell
PWD=$(dirname $0)
git clone https://github.com/dueros/dcs-sdk-js.git
export CODE_ROOT=$PWD/dcs-sdk-js
```

### 安装node及其依赖的库：

```shell
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
. ~/.bashrc
nvm install --lts
nvm use --lts
cd $CODE_ROOT
npm install
####依赖snowboy唤醒的平台，比如mac####
cd snowboy
npm install
npm install -g node-pre-gyp
node-pre-gyp clean
node-pre-gyp configure
node-pre-gyp build
```

## 修改配置

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

访问地址（请修改里面的CLIENT_ID和REDIRECT_URI，REDIRECT_URI在控制台的Oauth config的安全设置里修改）：[https://openapi.baidu.com/oauth/2.0/authorize?client_id={{CLIENT_ID}}&response_type=token&redirect_uri={{REDIRECT_URI}}](https://openapi.baidu.com/oauth/2.0/authorize?client_id={{CLIENT_ID}}&response_type=token&redirect_uri={{REDIRECT_URI}})

### 入口
  * cd $CODE_ROOT; node index.js

进入后，按回车开始听音

树莓派可以说“小度小度”唤醒


