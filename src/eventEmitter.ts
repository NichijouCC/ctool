export class EventEmitter {
    private _listener: { [event: string]: Function[] } = {};
    beActive = true;
    on(ev: string, callback: Function) {
        if (this._listener[ev] == null) this._listener[ev] = [];
        this._listener[ev].push(callback);
    }

    emit(ev: string, params: any) {
        if (this.beActive) {
            this._listener[ev]?.forEach(func => func(params));
        }
    }

    removeListener(ev: string, callback: Function) {
        if (this._listener[ev]) {
            const index = this._listener[ev].indexOf(callback);
            if (index >= 0) {
                this._listener[ev].splice(index, 1);
            }
        }
    }

    removeAllListeners() {
        this._listener = {};
    }
}
