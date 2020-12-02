import { EventTarget } from "@mtgoo/ctool";


const clickEvent = new EventTarget();

let handler = () => {
    console.log("干点啥！");
}
// ---监听事件
clickEvent.addEventListener(handler);

// ---触发事件
clickEvent.raiseEvent();

//-------移除单个监听
clickEvent.removeEventListener(handler);

//-------移除所有监听
clickEvent.removeAllListeners();