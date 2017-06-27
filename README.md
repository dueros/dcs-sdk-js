# dcs客户端demo

## 通用的依赖
  * sox，提供录音、格式转换、播放声音的命令行
  * jq，解析json的配置文件
  * curl，为了支持http2
  * mplayer，为了播放音乐


### mac下
```shell
brew install sox jq mplayer
### 以下是安装支持http2的curl
brew install gnutls nghttp2
wget https://curl.haxx.se/download/curl-7.54.0.tar.bz2
tar xvf curl-7.54.0.tar.bz2
cd curl-7.54.0
./configure --prefix=~/local --with-gnutls=/usr/local;make;make install
```

### linux下
```shell
sudo apt-get install sox jq  
sudo apt-get install libsox-fmt-mp3
sudo apt-get install libasound2 libasound2-dev alsa-utils
### curl请自行编译，放到~/local/bin下面

#### build mplayer, raspberrypi的仓库里面没有
sudo apt-get install libmpg123-dev
wget http://www.mplayerhq.hu/MPlayer/releases/MPlayer-1.3.0.tar.xz
tar xvf MPlayer-1.3.0.tar.xz
cd MPlayer-1.3.0
./configure;
make
sudo make install

#### build libiconv, raspberrypi的仓库里没有
wget https://ftp.gnu.org/pub/gnu/libiconv/libiconv-1.15.tar.gz
tar xzvf libiconv-1.15.tar.gz
cd libiconv-1.15
./configure --prefix=/usr
make
sudo make install

```



## shell版
  * avs_test.sh是 avs协议的demo入口
  * dcs_test.sh是 avs协议的demo入口


## node版

 以下假设代码被解压到$CODE_ROOT

### 安装node：

```shell
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash
. ~/.bashrc
nvm install --lts
nvm use --lts
cd $CODE_ROOT
npm install
```

## 修改配置

修改dcs_config.json中的access_token（oauth登录信息）


### 拿到access_token的方法：

用一个度秘开放平台合法的client_id, 比如我的测试client_id 1udLzmTG2KGmKGmPkwZZe1gm

访问地址[https://openapi.baidu.com/oauth/2.0/authorize?client_id=1udLzmTG2KGmKGmPkwZZe1gm&response_type=token&redirect_uri=http%3A%2F%2Fwww.example.com%2Foauth_redirect](https://openapi.baidu.com/oauth/2.0/authorize?client_id=1udLzmTG2KGmKGmPkwZZe1gm&response_type=token&redirect_uri=http%3A%2F%2Fwww.example.com%2Foauth_redirect)

### 入口
  * cd $CODE_ROOT; dcs_test.js

进入后，按回车开始听音

树莓派可以说“小度小度”唤醒


