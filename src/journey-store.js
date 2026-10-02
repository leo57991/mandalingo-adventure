export class JourneyStore {
  constructor(read,write,{replay=false}={}) { this.read=read;this.write=write;this.replay=replay; }
  load(){if(this.replay)return {};try{return JSON.parse(this.read()||'{}')??{};}catch{return {};}}
  save(value){if(this.replay)return true;try{this.write(JSON.stringify(value));return true;}catch{return false;}}
  beginReplay(){this.replay=true;return {};}
  endReplay(){this.replay=false;return this.load();}
}
