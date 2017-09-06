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
///播放器控制类，解决播放列表的问题
const EventEmitter=require("events");
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
util.inherits(ScreenManager, EventEmitter);
ScreenManager.prototype.getContext=function(){
    var context={
        "header": {
            "namespace": "ai.dueros.device_interface.screen",
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
    var name=directive.header.name;
    if(this.handlers[name]){
        this.handlers[name].call(this,directive);
        this.emit(name,directive);
    }
};

ScreenManager.prototype.buttonClicked=function (buttonName){
    this.dcsController.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.screen","ButtonClicked",controller.getContext(),
        {
            "name": buttonName,
        }));
};

ScreenManager.prototype.elementSelected=function (token,index){
    this.dcsController.emit("event",DcsProtocol.createEvent("ai.dueros.device_interface.screen","ElementSelected",controller.getContext(),
        {
            "token": token,
            "index": index,
        }));
};

ScreenManager.prototype.getLastPlayerInfo=function (){
    //TODO
    return {
      "audioItemId": this.last_player_token,
      "content": {
        "title": "告白气球",
        "titleSubtext1": "周杰伦",
        "titleSubtext2": "周杰伦床边的故事",
        "lyricUrl": "http://bd.kuwo.cn/yinyue/6340467?from=baidu",
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

