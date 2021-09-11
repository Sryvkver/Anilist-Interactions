import Request from "got/dist/source/core";
import { query } from 'express';
import { ReadStream } from "fs";

export interface IModule {
    _id?: string;
    readonly module: string;

    set: (ip: string, query: any) => void;
    get: (ip: string, query: any) => Promise<ReadStream | Request>
}