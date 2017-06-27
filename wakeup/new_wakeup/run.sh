#!/bin/sh
cd $(dirname $0)
AUDIODEV=hw:1,0 rec -t s16 -c1 -r16000 -b16 - 2>/dev/null|./WAKEUP_STANDALONE 2>/dev/null
