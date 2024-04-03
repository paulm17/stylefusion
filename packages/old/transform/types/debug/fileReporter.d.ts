import { EventEmitter } from '../utils/EventEmitter';
export interface IFileReporterOptions {
    dir?: string;
    print?: boolean;
}
export interface IProcessedEvent {
    file: string;
    fileIdx: string;
    imports: {
        from: string;
        what: string[];
    }[];
    only: string[];
    type: 'dependency';
}
export interface IQueueActionEvent {
    action: string;
    args?: string[];
    datetime: Date;
    file: string;
    queueIdx: string;
    type: 'queue-action';
}
export declare const createFileReporter: (options?: IFileReporterOptions | false) => {
    emitter: EventEmitter;
    onDone: (sourceRoot: string) => void;
};
