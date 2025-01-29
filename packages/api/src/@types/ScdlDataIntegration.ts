type BaseScdlParseArgs = { producerSlug: string; exportDate: string };
export type ScdlParseArgs = BaseScdlParseArgs & { delimiter?: string; quote?: string };
export type ScdlParseXlsArgs = BaseScdlParseArgs & { pageName?: string; rowOffset?: number | string };

export interface ScdlFileProcessingConfig {
    name: string;
    parseParams: ScdlParseArgs | ScdlParseXlsArgs;
    addProducer: boolean;
    producerName?: string;
    producerSiret?: string;
}

export interface ScdlFileProcessingConfigList {
    files: ScdlFileProcessingConfig[];
}
