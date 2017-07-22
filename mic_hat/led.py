#!/usr/bin/env python

from pixels import pixels
import sys
import time

func=sys.argv[1]
pixels.wakeup()
getattr(pixels,func)()
while True:
    time.sleep(0.1)
    getattr(pixels,func)()
