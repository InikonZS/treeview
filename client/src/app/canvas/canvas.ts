import Control from '../../common/control';

export class Canvas extends Control<HTMLCanvasElement>{
  renderer: Renderer;
  
  constructor(parentNode: HTMLElement) {
    super(parentNode, 'canvas');
    this.node.width = 800;
    this.node.height = 600;

    this.renderer = new Renderer(this.node);

    let figuresRemain = 10;
    let figures:Array<GameObject> = [];
    let failed = 0;

    const showFigure = (onShow:()=>void, onFinishGame: ()=>void)=>{
      setTimeout(()=>{
        figuresRemain--;
        let figure = new GameObject(
          this.renderer, 
          new Vector(Math.random()*this.node.width, Math.random()*this.node.height),
          {
            onClick:()=>{
              console.log(failed);
              figure.destroy();
              figures = figures.filter(it=>it!=figure);
              if (figuresRemain == 0 && figures.length == 0){
                onFinishGame();
              }
            },
            onDelete:()=>{
              failed++;
              console.log(failed);
              figure.destroy();
              figures = figures.filter(it=>it!=figure);
              if (figuresRemain == 0 && figures.length == 0){
                onFinishGame();
              }  
            }
          }
        );
        figures.push(figure);
        onShow();
      }, 1000);
    }

    const showFigures = (onFinishGame:()=>void)=>{
      console.log('sdfsfsf')
      if (figuresRemain>0){
        showFigure(()=>showFigures(onFinishGame), onFinishGame);
      }
    }

    showFigures(()=>{
      console.log('finish ' + failed);
    });

    this.renderer.render();
  }
}

class Renderer{
  private shapes: Array<BaseShape> = [];
  context: CanvasRenderingContext2D;

  constructor(canvas:HTMLCanvasElement){
    this.context = canvas.getContext('2d');
    canvas.onmousemove = (e)=>{
      this.shapes.forEach(shape=> shape.handleMove(e));
    }

    canvas.onclick = (e)=>{
      this.shapes.forEach(shape=> shape.handleClick(e));
    }

    canvas.onmousedown = (e)=>{
      this.shapes.forEach(shape=> shape.handleMouseDown(e));
    }

    canvas.onmouseup = (e)=>{
      this.shapes.forEach(shape=> shape.handleMouseUp(e));
    }

    this.render();
  }

  add(shape:BaseShape){
    this.shapes.push(shape);
    this.render();
  }

  remove(shape:BaseShape){
    this.shapes = this.shapes.filter(it=> it!=shape);
    this.render();  
  }

  render(){
    this.context.fillStyle = '#000';
    this.context.fillRect(0,0, this.context.canvas.width, this.context.canvas.height);
    this.shapes.forEach(shape=> shape.render(this.context));
  }
}

class GameObject{
  private shape:BaseShape;
  private renderer: Renderer;
  timer: number;

  constructor(renderer:Renderer, position:Vector, handlers: {onClick:()=>void, onDelete:()=>void}){
    const shape = new (Math.random()<0.5?RoundShape:TriangleShape)(position);
    this.renderer = renderer;
    this.shape = shape;
    shape.onMouseEnter = ()=>{
      shape.fillStyle = '#00f';
    }

    shape.onMouseLeave = ()=>{
      shape.fillStyle = '#f90';
    }

    shape.onClick = ()=>{
      handlers.onClick();
    }

    shape.onNeedRender = ()=>{
      renderer.render();
    }

    this.timer = window.setTimeout(()=>{
      handlers.onDelete();
    }, 3000);

    renderer.add(shape); 
  }  

  animateDestroy(){
    return new Promise((res)=>{
      let interval = window.setInterval(()=>{
        let scale = this.shape.scale-0.1;
        if (scale<0){
          window.clearInterval(interval);
          res(null);
        } else {
          this.shape.scale = scale;
        }
      }, 100);
    });
  }

  destroy(){
    clearTimeout(this.timer);
    this.animateDestroy().then(()=>{
      this.renderer.remove(this.shape)
    });
  }
}


class BaseShape {
  onNeedRender: () => void;

  private _scale: number = 1;
  get scale (){
    return this._scale;
  }

  set scale (value){
    this._scale = value;
    this.onNeedRender();
  }

  private _position: Vector;
  get position (){
    return this._position;
  }

  set position (value){
    this._position = value;
    this.onNeedRender();
  }

  private _fillStyle:string = '#f90';
  get fillStyle (){
    return this._fillStyle;
  }

  set fillStyle (value){
    this._fillStyle = value;
    this.onNeedRender();
  }

  onMouseMove: (e:MouseEvent)=>void;
  onMouseLeave: (e:MouseEvent)=>void;
  onMouseEnter: (e:MouseEvent)=>void;
  onMouseDown: (e:MouseEvent)=>void;
  onMouseUp: (e:MouseEvent)=>void;
  onClick: (e:MouseEvent)=>void;
  private isHovered = false;

  constructor(position:Vector = new Vector(0, 0)) {
    this._position = position;
  }

  render(context: CanvasRenderingContext2D) {
  }

  protected inShape(cursorPosition:Vector){
    return false;
  }

  handleMove(e:MouseEvent){
    if (this.inShape(new Vector(e.offsetX, e.offsetY))){
      this.onMouseMove?.(e);
      if (!this.isHovered) {
        this.isHovered = true;
        this.onMouseEnter?.(e);
      }
    } else {
      if (this.isHovered) {
        this.isHovered = false;
        this.onMouseLeave?.(e);
      }
    }  
  }

  handleClick(e:MouseEvent){
    if (this.inShape(new Vector(e.offsetX, e.offsetY))){
      this.onClick?.(e);
    }
  }

  handleMouseDown(e:MouseEvent){
    if (this.inShape(new Vector(e.offsetX, e.offsetY))){
      this.onMouseDown?.(e);
    }
  }

  handleMouseUp(e:MouseEvent){
    if (this.inShape(new Vector(e.offsetX, e.offsetY))){
      this.onMouseUp?.(e);
    }
  }
}

class Vector{
  x:number;
  y:number;

  constructor(x:number, y:number){
    this.x = x;
    this.y = y;
  }
}

class RoundShape extends BaseShape {
  radius: number = 10;

  render(context: CanvasRenderingContext2D) {
    context.beginPath();
    context.ellipse(this.position.x, + this.position.y, this.radius * this.scale, this.radius *this.scale, 0, 0, Math.PI * 2);
    context.fillStyle = this.fillStyle;
    context.strokeStyle = '#000';
    context.stroke();
    context.fill();
    context.closePath();
  }

  protected inShape(cursorPosition: Vector){
    
    return Math.hypot(cursorPosition.x - this.position.x, cursorPosition.y - this.position.y) < this.radius;
  }
}

class RectShape extends BaseShape {
  width:number = 15;

  render(context: CanvasRenderingContext2D) {
    context.beginPath();
    const width = this.width;
    context.rect(0 - width / 2 + this.position.x, 0 - width / 2 + this.position.y, width, width);
    context.fillStyle = this.fillStyle;
    context.strokeStyle = '#000';
    context.stroke();
    context.fill();
    context.closePath();
  }

  protected inShape(cursorPosition: Vector){
    const width = this.width;
    return (
      cursorPosition.x > - width / 2 + this.position.x && 
      cursorPosition.y > - width / 2 + this.position.y &&
      cursorPosition.x < width / 2 + this.position.x && 
      cursorPosition.y < width / 2 + this.position.y
    )
  }

}

class TriangleShape extends BaseShape {

  private side = 30;
  private points:Vector[] = [];

  render(context: CanvasRenderingContext2D) {
    context.beginPath();
    this.points = [];
    for (let i = 0; i < 3; i++) {
      let ang = Math.PI * 2 / 3 * i;
      let x = Math.sin(ang) * this.side*this.scale + this.position.x;
      let y = Math.cos(ang) * this.side*this.scale + this.position.y;
      i == 0 ? context.moveTo(x, y) : context.lineTo(x, y);
      this.points.push(new Vector(x, y));
    }
    context.fillStyle = this.fillStyle;
    context.strokeStyle = '#000';
    context.stroke();
    context.fill();
    context.closePath();
  }

  protected inShape(cursorPosition: Vector){
    let sq = (a:Vector, b:Vector, c:Vector)=>{
      let _a = a.x - c.x;
      let _c = a.y - c.y;
      let _b = b.x - c.x;
      let _d = b.y - c.y;
      return Math.abs(_a*_d - _b*_c);
    }
    let sq0 = sq(this.points[0], this.points[1], this.points[2]);
    let sq1 = sq(cursorPosition, this.points[0], this.points[1]);
    let sq2 = sq(cursorPosition, this.points[0], this.points[2]);
    let sq3 = sq(cursorPosition, this.points[1], this.points[2]);
    return (Math.abs(sq1+sq2+sq3 - sq0) < 0.0000001)
  }
}

/*
const path = `M3362 12652 c-13 -601 -227 -1121 -671 -1630 -129 -149 -235 -255
-566 -567 -447 -422 -581 -563 -741 -775 -194 -257 -321 -513 -393 -793 -83
-323 -82 -757 4 -1153 30 -137 29 -124 8 -124 -44 0 -127 66 -259 205 -190
200 -249 232 -315 169 -38 -36 -37 -42 37 -229 153 -382 366 -720 678 -1074
110 -125 436 -446 601 -592 72 -63 274 -238 450 -389 406 -350 514 -447 706
-641 743 -748 1083 -1478 1140 -2445 6 -104 14 -196 18 -204 11 -22 200 -96
306 -120 350 -80 813 -63 1108 39 81 28 177 72 177 81 0 32 -35 316 -56 450
-179 1165 -665 2017 -1652 2892 -79 70 -254 221 -389 335 -586 494 -802 689
-1001 903 -401 431 -605 803 -666 1215 -80 535 40 1028 363 1494 111 161 223
295 541 651 217 244 339 396 444 553 321 481 397 949 250 1532 -28 112 -105
345 -113 345 -3 0 -7 -58 -9 -128z`;

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

function trimToTag(path:Array<string>):Array<string>{
  let trimmed = path.findIndex(sym=>{
    return /^[a-zA-Z]$/.test(sym);
  });
  return path.slice(trimmed);
}

function readArgs(_path:Array<string>, length:number = 1):[Array<number>, Array<string>]{
  let result:Array<number> = [];
  let path = [..._path];
  for (let i=0; i < length; i++){
    let [num, nextPath] = readNumber(path);
    result.push(num);
    //if (i!==length-1){
    path = trimToNumber(nextPath);
    //}
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
  ['c', 6],
  ['z',0],
  ['l',2]
])

function parseTagRecord(path:Array<string>, lastTag:string):[{tag:string, args:Array<number>}, Array<string>]{
  let [tag, nextPath] = readTagName(path);
  if (!tag){
    tag = lastTag;
  }
  let [args, nextPath1] = readArgs(nextPath, tags.get(tag)); 
  console.log(tag, args);
  return [{tag, args}, nextPath1];
}

function parsePath(_path:string):Array<{tag:string, args:Array<number>}>{
  let path = _path.split('');
  let res: Array<{tag:string, args:Array<number>}> = [];
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

class Sview extends Control{
  editable: SVGPathElement;
  constructor(parentNode:HTMLElement){
    super(parentNode, 'div', '', `
    <svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 822.000000 1280.000000"
 preserveAspectRatio="xMidYMid meet">
      <g class ="all_image" transform="translate(0.000000,1280.000000) scale(0.100000,-0.100000)"
      stroke="none">
    <path class="a" d="M3362 12652 c-13 -601 -227 -1121 -671 -1630 -129 -149 -235 -255
    -566 -567 -447 -422 -581 -563 -741 -775 -194 -257 -321 -513 -393 -793 -83
    -323 -82 -757 4 -1153 30 -137 29 -124 8 -124 -44 0 -127 66 -259 205 -190
    200 -249 232 -315 169 -38 -36 -37 -42 37 -229 153 -382 366 -720 678 -1074
    110 -125 436 -446 601 -592 72 -63 274 -238 450 -389 406 -350 514 -447 706
    -641 743 -748 1083 -1478 1140 -2445 6 -104 14 -196 18 -204 11 -22 200 -96
    306 -120 350 -80 813 -63 1108 39 81 28 177 72 177 81 0 32 -35 316 -56 450
    -179 1165 -665 2017 -1652 2892 -79 70 -254 221 -389 335 -586 494 -802 689
    -1001 903 -401 431 -605 803 -666 1215 -80 535 40 1028 363 1494 111 161 223
    295 541 651 217 244 339 396 444 553 321 481 397 949 250 1532 -28 112 -105
    345 -113 345 -3 0 -7 -58 -9 -128z"/>

    </g>
    </svg>
   `);

   this.node.style.width = '822.000000px'; 
   this.node.style.height = '1280.000000px';

   this.editable = this.node.querySelector<SVGPathElement>('.a');
  }

  addPoint(px:number, py: number, color:string, onMove:(x:number, y:number)=>void){
    let main = this.node.querySelector<SVGGElement>('.all_image');
    //let circle = new Control<SVGCircleElement>(main, 'circle');
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', px.toString());
    circle.setAttribute('cy', py.toString());
    circle.setAttribute('r', 40..toString());
    circle.setAttribute('fill', color);

    let isDrag = false;
    circle.onmousedown = (ev)=>{
      isDrag = true;

      this.node.onmousemove = (ev)=>{
        console.log(ev.clientY);
        circle.setAttribute('cx', ((ev.clientX)*10 ).toString());
        circle.setAttribute('cy', ((ev.clientY-1280)* -10 ).toString());  
        onMove((ev.clientX)*10, (ev.clientY-1280)* -10);
      }

      this.node.onmouseup = (ev)=>{
        isDrag = false;
        this.node.onmouseup = null;
        this.node.onmousemove = null;
      }
    }

    

    main.append(circle);
  }
}

let sv = new Sview(document.body);
//sv.addPoint(3363, 12652);


function toAbsolute(data:Array<{tag:string, args:Array<number>}>):Array<{tag:string, args:Array<number>}>{
  let lx = 0;
  let ly = 0;
  let res1: Array<{tag:string, args:Array<number>}> = [];
  data.forEach(it=>{
    let rec:{tag:string, args:Array<number>} = {
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

let res = parsePath(path);
let ab = toAbsolute(res);
console.log(ab);
ab.forEach(it=>{
  console.log(it)
  if (it.tag=='C'){
    for (let i = 0; i< 3; i++){
      sv.addPoint(it.args[0 + i*2], it.args[1+ i*2], i==2? 'green':'red', (x,y)=>{
        it.args[0 + i*2] = x;
        it.args[1+ i*2] = y;
        sv.editable.setAttribute('d', unParse(ab));
      });
    }
      //
  } else {

  }
});


/*let lx = 0;
let ly = 0;
res.forEach(it=>{
  if (it.tag=='c'){
    for (let i = 0; i< 3; i++){
      let cllx = lx;
      let clly = ly;
      sv.addPoint(it.args[0 + i*2]+lx, it.args[1+ i*2]+ly, (x,y)=>{
        it.args[0 + i*2] = x-cllx;
        it.args[1+ i*2] = y-clly;
        sv.editable.setAttribute('d', unParse(res));
      });
      if (i==2){
      lx = it.args[0+ i*2]+lx;
      ly = it.args[1+ i*2]+ly;
    }
      //
    }
  } else {
    lx = it.args[0]+lx;
    ly = it.args[1]+ly;
  }
});*/
/*console.log(res);

function unParse(data:Array<{tag:string, args:Array<number>}>):string{
  let res = '';
  data.forEach(it=>{
    res+=it.tag+it.args.join(' ');  
  }); 
  return res; 
}
*/