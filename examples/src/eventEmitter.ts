import { EventEmitter } from '@mtgoo/ctool'


// --------- EventEmitter基本使用 -----------
const emiter = new EventEmitter();

// 听事件-》触发事件-》移除事件
const onHover = () => console.log("be hovered!");
emiter.on("hover", onHover);
emiter.emit("hover");
emiter.off("hover", onHover);

// 多个事件监听-》移除
emiter.on("hover", onHover);
emiter.on("hover", onHover);
emiter.removeEventListeners("hover");

// 暂时禁用事件管理器
emiter.beactive = false;

// 移除所有事件的监听器
emiter.removeAllListeners();

// ----------定义事件类型
interface KeyboardEventMap {
    "keydown": KeyboardEvent,
    "keyup": KeyboardEvent
}

const keyboard = new EventEmitter<KeyboardEventMap>();
keyboard.on("keydown", (ev) => {
    console.log(ev.keyCode);
});