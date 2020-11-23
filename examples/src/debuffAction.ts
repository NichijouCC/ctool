import { DebuffAction } from '@mtgoo/ctool';


const ins = DebuffAction.create(() => {
    const delay = setInterval(() => console.log("do something!"), 1000);
    return () => clearInterval(delay);
});

// when need dispose
setTimeout(() => ins.dispose(), 3000)