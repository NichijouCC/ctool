import { Timer } from '@mtgoo/ctool'
import { time } from 'console';

const timer = new Timer();
// update监听
timer.tick.addEventListener((deltaTime) => {
    console.log("deltaTime:", deltaTime);
    // 总计时
    const time = timer.recordTime;
});

// 重置计时
timer.resetRecordTime();

// 释放
timer.dispose();