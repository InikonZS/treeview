interface SPathTag{
  tag:string;
  args:Array<number>;
}

type SPath = Array<SPathTag>;

function readNumber(path:Array<string>):[number, Array<string>]{
  let num = '';
  let readed = path.findIndex(sym=>{
    if (/^[-\d]$/.test(sym)){
      num+=sym;
      return false;
    } else {
      return true;
    }
  });
  return [Number(num), path.slice(readed)];
}

function trimToNumber(path:Array<string>):Array<string>{
  let trimmed = path.findIndex(sym=>{
    return /^[-\da-zA-Z]$/.test(sym);
  });
  return path.slice(trimmed);
}

/*function trimToTag(path:Array<string>):Array<string>{
  let trimmed = path.findIndex(sym=>{
    return /^[a-zA-Z]$/.test(sym);
  });
  return path.slice(trimmed);
}*/

function readArgs(_path:Array<string>, length:number = 1):[Array<number>, Array<string>]{
  let result:Array<number> = [];
  let path = [..._path];
  for (let i=0; i < length; i++){
    let [num, nextPath] = readNumber(path);
    result.push(num);
    path = trimToNumber(nextPath);
  }
  return [result, path];
}

function readTagName(path:Array<string>):[string, Array<string>]{
  let tag = path[0];
  if (/^[a-zA-Z]$/.test(tag)){
    return [tag, path.slice(1)];
  } else {
    return ['', path.slice(0)];
  }
}

const tags = new Map<string, number>([
  ['M', 2],
  ['V', 1],
  ['H', 1],
  ['q', 4],
  ['c', 6],
  ['C', 6],
  ['Q', 4],
  ['z', 0],
  ['l', 2],
  ['L', 2]
])

function parseTagRecord(path:Array<string>, lastTag:string):[SPathTag, Array<string>]{
  let [tag, nextPath] = readTagName(path);
  if (!tag){
    tag = lastTag;
  }
  let [args, nextPath1] = readArgs(nextPath, tags.get(tag)); 
  console.log(tag, args);
  return [{tag, args}, nextPath1];
}

export function parsePath(_path:string):SPath{
  let path = _path.split('');
  let res: SPath = [];
  let lastTag = '';
  for(let i=0; i< 100; i++){
    let [r, nextPath] = parseTagRecord(path, lastTag); 
    lastTag = r.tag;
    if (!nextPath.length) break;
    res.push(r);
    path = nextPath;
  }
  return res;
}

export function toAbsolute(data:SPath):SPath{
  let lx = 0;
  let ly = 0;
  let res1: Array<{tag:string, args:Array<number>}> = [];
  data.forEach(it=>{
    let rec:SPathTag = {
      tag:it.tag.toUpperCase(),
      args: []
    }
    res1.push(rec);
    if (it.tag=='c'){
      console.log(rec);
      for (let i = 0; i< 3; i++){
        rec.args.push(it.args[0 + i*2]+lx);
        rec.args.push(it.args[1+ i*2]+ly);
        if (i==2){
        lx = it.args[0+ i*2]+lx;
        ly = it.args[1+ i*2]+ly;
      }
        //
      }
    } else {
      rec.args.push(it.args[0]);
      rec.args.push(it.args[1]);
      lx = it.args[0]+lx;
      ly = it.args[1]+ly;
    }
  });
  return res1;
}

export function unParse(data:SPath):string{
  let res = '';
  data.forEach(it=>{
    res+=it.tag+it.args.join(' ');  
  }); 
  return res; 
}