
export interface IAnalyzer {

   type: string;
   getAnalyzedRooms(): string[];
   parse(room: string, userstr: string, message?: string) : void;

}