import Control from '../../common/control';
import { parsePath, SPathTag, tags, toAbsolute, unParse } from './pathParser';
import {SRect} from './srect';
import {sv1, sv} from './imgs';
import { pixel } from './utils';

export class SEditor extends Control{
  sview: SView = null;
  selected: SVGPathElement = null;

  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', '');
    let fileInput = new Control<HTMLInputElement>(this.node, 'input');
    fileInput.node.type = 'file';
    fileInput.node.accept = '.svg';
    fileInput.node.onchange = ()=>{
      let file = fileInput.node.files[0];
      
      if (file){
        let reader = new FileReader(); 
        reader.readAsText(file, 'utf8');
        reader.onload = res=>{
          let sv = reader.result.toString();
          this.loadSvg(sv);
        }
      }
    }
    /*fetch('https://svgx.ru/svg/1296104.svg').then(res=>res.text()).then(sv=>{
      this.loadSvg(sv);
    })*/
  }  

  loadSvg(svgCode:string){
    if (this.sview){
      this.sview.destroy();
      this.sview = null;
    }

    let sview = new SView(this.node, svgCode);
    this.sview = sview;
    sview.editables.forEach(editable=>{
      editable.onmouseover=()=>{
        editable.style.fill = "#222";
      }

      editable.onmouseout=()=>{
        editable.style.fill = null;
      }

      editable.onclick=()=>{
        if (this.selected != editable){
          console.log(editable);
          this.selectPath(editable);
        }
      }
      
    })
  }

  selectPath(editable:SVGPathElement){
    this.selected = editable;
    this.sview.cleanMarkers();
    let pathData = editable.getAttribute('d');
    let res = parsePath(pathData);
    let ab = toAbsolute(res);
    ab.forEach((it, i)=>{
      const editHandler = (data:SPathTag)=>{
        ab[i] = data;
        editable.setAttribute('d', unParse(ab));
      }
      let subPathView:ISubPathView = null;
      switch (it.tag){
        case 'h': 
        subPathView = new SubPathViewH(editable, this.sview, it, editHandler);
        break;
        case 'H': 
        subPathView = new SubPathViewH(editable, this.sview, it, editHandler);
        break;
        case 'v': 
        subPathView = new SubPathViewV(editable, this.sview, it, editHandler);
        break;
        case 'V': 
        subPathView = new SubPathViewV(editable, this.sview, it, editHandler);
        break;
        case 'z': 
        //subPathView = new SubPathViewV(editable, this.sview, it, editHandler);
        break;
        case 'Z': 
        //subPathView = new SubPathViewV(editable, this.sview, it, editHandler);
        break;
        default:
        subPathView = new SubPathView(editable, this.sview, it, editHandler);
      } 
    }); 
  }
}

interface ISubPathView{}

class SubPathView implements ISubPathView{
  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let lx = 0;
    let ly = 0;
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }
    for (let i = 0; i< tags.get(data.tag)/2; i++){
      let ax:number = data.args[0 + i*2];
      let ay:number = data.args[1+ i*2];

      sview.addPoint(editable.parentNode, ax ?? lx, ay ?? ly, i==tags.get(data.tag)/2-1? 'green':'red', (x,y, lastx, lasty)=>{
        nextData.args[0 + i*2] = x;
        nextData.args[1 + i*2] = y;
        onEdit(nextData);
      },
      (x,y, lastx, lasty)=>{
       /* console.log(x,y, lastx, lasty);
        sview.selected.forEach(point=>{
          point.onMove(point.x - lastx + x, point.y - lasty + y, point.x, point.y);
          point.x = point.x - lastx + x;
          point.y = point.y - lasty + y;
          
        });*/
      });
      lx = data.args[0 + i*2];
      ly = data.args[1 + i*2];
    }  
  }
}

class SubPathViewH implements ISubPathView{
  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let lx = 0;
    let ly = 0;
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }
    for (let i = 0; i< tags.get(data.tag)/2; i++){
      let ax:number = data.args[0];
      let ay:number = null;
      
      sview.addPoint(editable.parentNode, ax ?? lx, ay ?? ly, i==tags.get(data.tag)/2-1? 'green':'red', (x,y, lastx, lasty)=>{
        nextData.args[0 + i*2] = x;
        nextData.args[1 + i*2] = y;
        onEdit(nextData);
      },
      (x,y, lastx, lasty)=>{
       /* console.log(x,y, lastx, lasty);
        sview.selected.forEach(point=>{
          point.onMove(point.x - lastx + x, point.y - lasty + y, point.x, point.y);
          point.x = point.x - lastx + x;
          point.y = point.y - lasty + y;
          
        });*/
      });
      lx = data.args[0 + i*2];
      ly = data.args[1 + i*2];
    }  
  }
}

class SubPathViewV implements ISubPathView{
  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let lx = 0;
    let ly = 0;
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }
    for (let i = 0; i< tags.get(data.tag)/2; i++){
      let ax:number = data.args[0];
      let ay:number = null;
      
      sview.addPoint(editable.parentNode, ax ?? lx, ay ?? ly, i==tags.get(data.tag)/2-1? 'green':'red', (x,y, lastx, lasty)=>{
        nextData.args[0 + i*2] = x;
        nextData.args[1 + i*2] = y;
        onEdit(nextData);
      },
      (x,y, lastx, lasty)=>{
       /* console.log(x,y, lastx, lasty);
        sview.selected.forEach(point=>{
          point.onMove(point.x - lastx + x, point.y - lasty + y, point.x, point.y);
          point.x = point.x - lastx + x;
          point.y = point.y - lasty + y;
          
        });*/
      });
      lx = data.args[0 + i*2];
      ly = data.args[1 + i*2];
    }  
  }
}


export class SView extends Control {
  editables: SVGPathElement[];
  svg: SVGElement;
  markers: Array<SMarker> = [];
  selected: Array<SMarker> = [];

  constructor(parentNode: HTMLElement, svgCode:string) {
    super(parentNode, 'div', '',);

   this.node.innerHTML = svgCode;

    this.svg = this.node.querySelector<SVGElement>('svg');

    this.svg.onmousedown = (ev)=>{
      const rect = new SRect(this.svg as SVGSVGElement, ev.clientX, ev.clientY);

      this.svg.onmousemove = (ev)=>{
        rect.resize(ev.clientX, ev.clientY);
      }

      this.svg.onmouseup = (ev)=>{
        this.svg.onmousemove = null;
        this.svg.onmouseup = null;

        this.markers.forEach(it=> it.unselect());
        let selected = this.selectMarkers(rect.startPoint.x, rect.startPoint.y, rect.endPoint.x, rect.endPoint.y);
        selected.forEach(it=>it.select());
        this.selected = selected; 
        
        rect.destroy();
      }

    }

    let r = this.svg.getAttribute('viewBox').split(' ');
    let rect = {
      left: Number.parseFloat(r[0]),
      top: Number.parseFloat(r[1]),
      width: Number.parseFloat(r[2]),
      height: Number.parseFloat(r[3])
    }

    this.node.style.width = pixel(rect.width);
    this.node.style.height = pixel(rect.height);

    this.editables = [...this.node.querySelectorAll<SVGPathElement>('path')];
  }

  addPoint(pathParent:Node, px: number, py: number, color: string, onMove: (x: number, y: number, lastx:number, lasty:number) => void, onMoveEnd: (x: number, y: number, lastx:number, lasty:number) => void)  {
    let marker = new SMarker(this.svg, pathParent, this.node, px, py, color, onMove, onMoveEnd);
    this.markers.push(marker);
  }

  cleanMarkers(){
    this.markers.forEach(it=>it.node.remove());
    this.markers = [];
  }

  drawSelection(){
    
  }

  selectMarkers(sx:number, sy:number, ex:number, ey:number){
    const inRect = (sx:number, sy:number, ex:number, ey:number, px:number, py:number)=>{
      return (
        (px>sx &&
        py>sy &&
        px<ex &&
        py<ey)
      );
    }

    return this.markers.filter(marker=>{
      return inRect(Math.min(sx, ex), Math.min(sy, ey), Math.max(sx, ex), Math.max(sy, ey), marker.x, marker.y);
    });
  }
}

class SMarker {
  private size:number = 50;

  public _x:number;
  onMove: (x: number, y: number, lx: number, ly: number) => void;
  set x(value:number){
    this._x = value;
    this.node.setAttribute('cx', value.toString());
  }
  get x(){
    return this._x;
  }

  public _y:number;
  set y(value:number){
    this._y = value;
    this.node.setAttribute('cy', value.toString());
  }
  get y(){
    return this._y;
  }

  node: SVGCircleElement;
  private color: string;

  constructor(
    mainNode: Node,
    parentNode: Node,
    dropNode: HTMLElement,
    px: number,
    py: number,
    color: string,
    onMove: (x: number, y: number, lx:number, ly:number) => void,
    onMoveEnd: (x: number, y: number, lx:number, ly:number) => void
  ) {
    this.onMove = onMove;
    this.color = color;
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.node = circle;

    let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM());
    let ptm = DOMMatrix.fromMatrix((mainNode as SVGGElement).getScreenCTM()).inverse();
    let ppoint = new DOMPoint(px, py);
    let pp = ptp.transformPoint(ppoint);
    let pm = ptm.transformPoint(pp);

   // circle.setAttribute('cx', pm.x.toString());
    //circle.setAttribute('cy', pm.y.toString());
    this.x = pm.x;
    this.y = pm.y;
    circle.setAttribute('r', (5).toString());
    circle.setAttribute('fill', color);

    let isDrag = false;
    let dragPoint:DOMPoint = null;
    circle.onmousedown = (ev) => {
      ev.stopPropagation();
      isDrag = true;
      

      let mtx = DOMMatrix.fromMatrix(circle.getScreenCTM()).inverse();

      let cp = new DOMPoint(circle.cx.baseVal.value, circle.cy.baseVal.value);
      let mcp = mtx.inverse().transformPoint(cp);
      dragPoint = new DOMPoint(ev.clientX - mcp.x, ev.clientY- mcp.y);
     // let dp = mtx.transformPoint(dragPoint);
      console.log(mtx);
      let lastx = this.x;
      let lasty = this.y;
      
      dropNode.onmousemove = (ev) => {
        let cr = new DOMPoint(ev.clientX- dragPoint.x, ev.clientY- dragPoint.y);
        let lr = mtx.transformPoint(cr);
        let cx = lr.x 
        let cy = lr.y
        this.x = cx;
        this.y = cy;
        let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM()).inverse();
        let cxp = ptp.transformPoint(cr);
        onMove(cxp.x, cxp.y, lastx, lasty);
      }

      dropNode.onmouseup = (ev) => {
        let cr = new DOMPoint(ev.clientX- dragPoint.x, ev.clientY- dragPoint.y);
        let lr = mtx.transformPoint(cr);
        let cx = lr.x 
        let cy = lr.y
        //this.x = cx;
        //this.y = cy;
        let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM()).inverse();
        let cxp = ptp.transformPoint(cr);
        isDrag = false;
        dropNode.onmouseup = null;
        dropNode.onmousemove = null;
        onMoveEnd(cxp.x, cxp.y, lastx, lasty);
      }
    }
    mainNode.appendChild(circle);
  }

  setSize(){

  }

  select(){
    this.node.setAttribute('fill', '#00f');
  }

  unselect(){
    this.node.setAttribute('fill', this.color);
  }
}

