ps aux|grep WAKEUP_STANDALONE |grep -v grep|awk '{print $2}'|xargs kill -9
ps aux|grep rec |grep -v grep|awk '{print $2}'|xargs kill -9
