import { IAnalyzer } from "./ianalyzer.ts";

export interface IChatPlugin {
   Commands?: any;
   Analyzer?: IAnalyzer;
}