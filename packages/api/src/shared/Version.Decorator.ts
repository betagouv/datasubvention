import { Request } from "express";

export function VersionedController() {
    return constructor => {
        return class extends constructor {
            __versionning__: Record<string, Record<string, string>> = {};
            constructor(...args) {
                super(...args);

                return new Proxy(this, {
                    get(cible, prop: string) {
                        if (cible.__versionning__ && cible.__versionning__[prop]) {
                            return (req: Request, ...methodsArgs) => {
                                // @ts-expect-error api version is available
                                const version = req.apiVersion;
                                if (!version) throw new Error("For versionning api please require req");
                                if (cible.__versionning__[prop][version]) {
                                    const methodName = cible.__versionning__[prop][version];
                                    return cible[methodName](req, ...methodsArgs);
                                }
                                return cible[prop](req, ...methodsArgs);
                            };
                        }

                        return cible[prop];
                    },
                });
            }
        } as any;
    };
}

/**
 * For working please require req with tsoa
 *
 * @param v version format : v1 or v2
 * @param defaultMethod the default method used by tsoa
 */
export function Version(v, defaultMethod) {
    return (target, propertyKey) => {
        console.log(target[propertyKey]);
        if (!target.__versionning__) target.__versionning__ = {};
        if (!target.__versionning__[defaultMethod]) target.__versionning__[defaultMethod] = {};
        target.__versionning__[defaultMethod][v] = propertyKey;
    };
}
