/*
 * Copyright (c) 2017 Baidu, Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const BaseManager=require("./base_manager");
const util = require('util');
const child_process = require('child_process');
const system = require('./system');
const DcsProtocol=require("./dcs_protocol");

function ScreenManager(dcsController){
    this.dcsController=dcsController;
    dcsController.on("event",(dcsEvent)=>{
        var ev=dcsEvent.event;
        if(ev.header.namespace=='ai.dueros.device_interface.audio_player'){
            this.last_token=ev.payload.token;
            this.last_player_token=ev.payload.token;
        }
    });
    this.handlers={
        "HtmlView":(directive)=>{
            this.last_token=directive.payload.token;
        },
        "RenderCard":(directive)=>{
            this.last_token=directive.payload.token;
        },
        "RenderPlayerInfo":(directive)=>{
            this.last_player_token=directive.payload.audioItemId;
            this.last_player_info=directive.payload;
        },
        "RenderVoiceInputText":(directive)=>{
        },
        "RenderHint":(directive)=>{
            //TODO
        }
    };
}
util.inherits(ScreenManager, BaseManager);
ScreenManager.prototype.NAMESPACE="ai.dueros.device_interface.screen";
ScreenManager.prototype.getContext=function(){
    var context={
        "header": {
            "namespace": this.NAMESPACE,
            "name": "ViewState"
        },
        "payload": {
        }
    };
    if(this.last_player_token){
        context.payload.player_token=this.last_player_token;
    }
    if(this.last_token){
        context.payload.token=this.last_token;
    }
    return context;
};
ScreenManager.prototype.handleDirective=function (directive,controller){
    if(
        directive.header.namespace!=this.NAMESPACE &&
        directive.header.namespace!="ai.dueros.device_interface.screen_extended_card"
    ){
        return;
    }
    var name=directive.header.name;
    if(this.handlers[name]){
        this.handlers[name].call(this,directive);
        this.emit(name,directive);
    }
};

ScreenManager.prototype.buttonClicked=function (token,buttonName){
    this.dcsController.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.form","ButtonClicked",controller.getContext(),
        {
            "token": token,
            "name": buttonName,
        }));
};

ScreenManager.prototype.radioButtonClicked=function (token,index,selectedValue){
    this.dcsController.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.form","RadioButtonClicked",controller.getContext(),
        {
            "token": token,
            "index": index,
            "selectedValue": selectedValue
        }));
};
ScreenManager.prototype.getLastPlayerList=function (){
    return {
      "directive": {
        "header": {
          "messageId": "YXVkaW9fbXVzaWMrd3AxNTA2NTk0NTUxMTE3",
          "name": "RenderAudioList",
          "namespace": "ai.dueros.device_interface.screen_extended_card"
        },
        "payload": {
          "list": [
            {
              "image": {
                "src": "http://img1.kuwo.cn/star/starheads/240/42/97/3914752958.jpg"
              },
              "isFavorited": false,
              "title": "兰亭序",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=996710999"
            },
            {
              "image": {
                "src": "http://qukufile2.qianqian.com/data2/pic/d863425b4f78ba39b1f043ce1f0c1505/2449485/2449485.jpg@s_1,w_150,h_150"
              },
              "isFavorited": false,
              "title": "夜曲",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=1149223390"
            },
            {
              "image": {
                "src": "http://img1.kuwo.cn/star/starheads/240/42/97/3914752958.jpg"
              },
              "isFavorited": false,
              "title": "回到过去",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=981737049"
            },
            {
              "image": {
                "src": "http://img1.kuwo.cn/star/starheads/240/42/97/3914752958.jpg"
              },
              "isFavorited": false,
              "title": "蒲公英的约定",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=994723015"
            },
            {
              "image": {
                "src": "http://img1.kuwo.cn/star/starheads/240/42/97/3914752958.jpg"
              },
              "isFavorited": false,
              "title": "半岛铁盒",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=1009699825"
            },
            {
              "image": {
                "src": "http://qukufile2.qianqian.com/data2/pic/e22ca5aea6af7c553d9b7a56f8129a59/270514481/270514481.jpg@s_1,w_150,h_150"
              },
              "isFavorited": false,
              "title": "彩虹",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=1112289813"
            },
            {
              "image": {
                "src": "http://qukufile2.qianqian.com/data2/pic/7218b20000d01c78affb18e9e488cf5a/270866866/270866866.jpg@s_0,w_150"
              },
              "isFavorited": false,
              "title": "布拉格广场",
              "titleSubtext1": "周杰伦 蔡依林",
              "url": "http://audio_music/command/play?playtoken=1005223548"
            },
            {
              "image": {
                "src": "http://qukufile2.qianqian.com/data2/pic/74f4fb6d6d5aff140ce31439f0bfed4f/23660766/23660766.jpg@s_1,w_150,h_150"
              },
              "isFavorited": false,
              "title": "安静",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=1150790932"
            },
            {
              "image": {
                "src": "http://img1.kuwo.cn/star/starheads/240/42/97/3914752958.jpg"
              },
              "isFavorited": false,
              "title": "退后",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=1037731709"
            },
            {
              "image": {
                "src": "http://qukufile2.qianqian.com/data2/pic/86de6a0dad614537003e2828717b7397/10735646/10735646.jpg@s_1,w_150,h_150"
              },
              "isFavorited": false,
              "title": "简单爱",
              "titleSubtext1": "周杰伦",
              "url": "http://audio_music/command/play?playtoken=997036570"
            },
            {
              "image": {
                "src": "http://qukufile2.qianqian.com/data2/pic/89788878/89788878.jpg@s_0,w_150"
              },
              "isFavorited": false,
              "title": "屋顶",
              "titleSubtext1": "温岚 周杰伦",
              "url": "http://audio_music/command/play?playtoken=1002759881"
            }
          ],
          "nowPlayingIndex": 3,
          "title": "播放列表",
          "token": "YXVkaW9fbXVzaWMrMTAyMjIzNDA0OA=="
        }
      }
    };

};


ScreenManager.prototype.getLastPlayerInfo=function (){
    //TODO
    return {
      "audioItemId": this.last_player_token,
      "content": {
        "title": "告白气球",
        "titleSubtext1": "周杰伦",
        "titleSubtext2": "周杰伦床边的故事",
        "lyric":{
            "url":"http://bd.kuwo.cn/yinyue/6340467?from=baidu",
            "format":"url"
        },
        "mediaLengthInMilliseconds": 191000,
        "backgroundImage": {
                "sources": [
                       {
                                "url": "http://p3.music.126.net/6OARlbfxOysQJU5iZ8WKSA==/18769762999688243.jpg"
                           }
                    ]
            },
        "art" : {
              "sources" : [
                    {
                          "size" : "medium",
                              "url" : "http://p4.music.126.net/yjVbsgfNeF2h7fIvnxuZDQ==/18894007811887644.jpg?param=130y130"
                        }
                  ]
            },
        "provider": {
              "name": "网易云音乐",
              "logo" : {
                    "sources" : [
                          {
                                "url" : "https://ss2.baidu.com/6ONYsjip0QIZ8tyhnq/it/u=452376239,853081037&fm=58"
                              }
                        ]
                  },
            },
      },
      "controls": [
            {
                  "type": "BUTTON",
                      "name": "PREVIOUS",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "PLAY_PAUSE",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "NEXT",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "LYRIC",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "REPEAT_ONE",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "REPEAT_ALL",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "SHUFFLE",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "FAVORITE",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "SHOW_PLAYLIST",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "RECOMMEND",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "THUMBS_UP",
                      "enabled": true,
                      "selected": false
                },
            {
                  "type": "BUTTON",
                      "name": "THUMBS_DOWN",
                      "enabled": true,
                      "selected": false
                }
          ]
    };
};


module.exports=ScreenManager;

