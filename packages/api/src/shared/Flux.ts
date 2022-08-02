export default class Flux<T> {
    private prevData: T[] = [];
    private isClose = false;
    private onDataCb: (data: T) => unknown = (_data: T) => null;
    private onCloseCb: () => unknown = () => null;

    constructor(defaultValue ?: T) {
        if (defaultValue) {
            this.prevData.push(defaultValue);
        }
    }

    push(data: T) {
        if (this.isClose) throw new Error("Flux is done, you can't push a new data in flux")
        this.prevData.push(data);
        this.onDataCb(data);

        return this;
    }

    onData(cb: (data: T) => unknown) {
        this.onDataCb = cb;
        if (this.prevData.length) {
            this.prevData.forEach((data) => {
                this.onDataCb(data);
            })
        }

        if (this.isClose) this.onCloseCb();
    }

    close(){
        this.onCloseCb();
        this.isClose = true;

        return this;
    }

    onClose(cb: () => unknown) {
        this.onCloseCb = cb;
    }

    toPromise(): Promise<T[]> {
        return new Promise(resolve => {
            if (this.isClose) return resolve(this.prevData);

            const acc: T[]= [];

            this.onData((data: T) => {
                acc.push(data);
            });

            this.onClose(() => {
                resolve(acc)
            });
        });
    }
}