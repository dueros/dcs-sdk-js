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
function BinParser(buf) {
    this.buffer = buf;
    this.pos = 0;

}
BinParser.prototype.parse = function() {
    var key_len = this.buffer.readInt32LE(this.pos);
    this.pos += 4;
    //console.log("key_len:"+key_len);
    var key = this.buffer.toString("utf-8", this.pos, this.pos + key_len);
    this.pos += key_len;
    //console.log("key:"+key);

    var value_len = this.buffer.readInt32LE(this.pos);
    this.pos += 4;

    var value = Buffer.alloc(value_len);
    this.buffer.copy(value, 0, this.pos, this.pos + value_len);
    //console.log("value:"+value);
    this.pos += value_len;
    return {
        key: key,
        value: value
    };
};
BinParser.prototype.isEnd = function() {
    return this.pos >= this.buffer.length;
};
module.exports = BinParser;