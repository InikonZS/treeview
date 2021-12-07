import Control from '../../common/control';
import { parsePath, SPathTag, tags, toAbsolute, unParse } from './pathParser';
import {SRect} from './srect';
import {sv1, sv} from './imgs';
import { pixel } from './utils';

export class SEditor extends Control{
  sview: SView = null;
  selected: SVGPathElement = null;
  editors: ISubPathView[] = [];

  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', '');
    let fileInput = new Control<HTMLInputElement>(this.node, 'input');
    fileInput.node.type = 'file';
    fileInput.node.accept = '.svg';
    fileInput.node.onchange = ()=>{
      const file = fileInput.node.files[0];
      if (file){
        this.loadSvgFromFile(file).then(res=>{
          this.loadSvgFromCode(res);
        });
      }
    }
  } 
  
  loadSvgFromFile(file:File):Promise<string>{ 
    return new Promise((resolve)=>{
      let reader = new FileReader(); 
      reader.readAsText(file, 'utf8');
      reader.onload = (res) => {
        let sv = reader.result.toString();
        resolve(sv);
      }
    });
  }

  loadSvgFromCode(svgCode:string){
    if (this.sview){
      this.sview.destroy();
      this.sview = null;
    }

    let sview = new SView(this.node, svgCode);

    sview.onSelectPath = path => {
      this.selectPath(path);
    };

    this.sview = sview;

  }

  selectPath(editable:SVGPathElement){
    this.selected = editable;
    this.cleanPath();
    let pathData = editable.getAttribute('d');
    let res = parsePath(pathData);
    let ab = toAbsolute(res);
    ab.forEach((it, i)=>{
      const editHandler = (data:SPathTag)=>{
        ab[i] = data;
        editable.setAttribute('d', unParse(ab));
      }
      
      let pathViews:Record<string, ISubPathViewClass> = {
        'h': SubPathViewH,
        'v': SubPathViewV,
        'z': SubPathViewZ
      }
      const ViewClass = pathViews[it.tag.toLowerCase()] || SubPathView;
      const subPathView = new ViewClass(editable, this.sview, it, editHandler);
      this.editors.push(subPathView);
      
    }); 
  }

  cleanPath(){
    this.editors.forEach(it=> it.destroy());
    this.editors = [];
  }
}

interface ISubPathView{
  destroy: ()=>void;
}

interface ISubPathViewClass{
  new (editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void): ISubPathView;
}

class SubPathView implements ISubPathView{
  markers: SMarker[] = [];

  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let lx = 0;
    let ly = 0;
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }
    for (let i = 0; i< tags.get(data.tag)/2; i++){
      let ax:number = data.args[0 + i*2];
      let ay:number = data.args[1 + i*2];

      let marker = new SMarker(sview.svg, editable.parentNode, ax ?? lx, ay ?? ly, i==tags.get(data.tag)/2-1? 'green':'red', (x,y, lastx, lasty)=>{
        nextData.args[0 + i*2] = x;
        nextData.args[1 + i*2] = y;
        onEdit(nextData);
      });
      this.markers.push(marker);
    
      lx = data.args[0 + i*2];
      ly = data.args[1 + i*2];
    }   
  }

  destroy(){
    this.markers.forEach(it=>it.destroy());
    this.markers = [];
  }
}

class SubPathViewH implements ISubPathView{
  marker: SMarker;
  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }

    let ax:number = data.args[0];
    
    this.marker = new SMarker(sview.svg, editable.parentNode, ax, 0, '#f0f', (x,y, lastx, lasty)=>{
      nextData.args[0] = x;
      onEdit(nextData);
    });
  }

  destroy(){
    this.marker.destroy();
  }
}

class SubPathViewV implements ISubPathView{
  marker: SMarker;
  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }
    let ay:number = data.args[0];

    this.marker = new SMarker(sview.svg, editable.parentNode, 0, ay, '#0ff', (x,y, lastx, lasty)=>{
      nextData.args[0] = y;
      onEdit(nextData);
    });
  }

  destroy(){
    this.marker.destroy();
  }
}

class SubPathViewZ implements ISubPathView{
  marker: SMarker;
  constructor(editable:SVGPathElement, sview:SView, data:SPathTag, onEdit:(data:SPathTag)=>void){
    let nextData:SPathTag = {
      tag: data.tag,
      args: [...data.args]
    }

    this.marker = new SMarker(sview.svg, editable.parentNode, 0, 0, '#ff0', (x,y, lastx, lasty)=>{
      onEdit(nextData);
    });
  }

  destroy(){
    this.marker.destroy();
  }
}


export class SView extends Control {
  editables: SVGPathElement[];
  svg: SVGSVGElement;
  markers: Array<SMarker> = [];
  selected: Array<SMarker> = [];
  selectedPath: SVGPathElement = null;
  onSelectPath: (path:SVGPathElement)=>void;

  constructor(parentNode: HTMLElement, svgCode:string) {
    super(parentNode, 'div', '',);

    this.node.innerHTML = svgCode;

    this.svg = this.node.querySelector<SVGSVGElement>('svg');

    this.svg.onmousedown = (ev)=>{
      const rect = new SRect(this.svg as SVGSVGElement, ev.clientX, ev.clientY);

      window.onmousemove = (ev:MouseEvent)=>{
        rect.resize(ev.clientX, ev.clientY);
      }

      window.onmouseup = (ev:MouseEvent)=>{
        this.svg.onmousemove = null;
        this.svg.onmouseup = null;

        this.markers.forEach(it=> it.unselect());
        let selected = this.selectMarkers(rect.startPoint.x, rect.startPoint.y, rect.endPoint.x, rect.endPoint.y);
        selected.forEach(it=>it.select());
        this.selected = selected; 
        
        rect.destroy();
      }

    }

    let rect = this.svg.viewBox.baseVal;
    //this.svg.getAttribute('viewBox').split(' ');
    /*let rect = {
      left: Number.parseFloat(r[0]),
      top: Number.parseFloat(r[1]),
      width: Number.parseFloat(r[2]),
      height: Number.parseFloat(r[3])
    }*/

    this.node.style.width = pixel(rect.width);
    this.node.style.height = pixel(rect.height);

    this.editables = [...this.node.querySelectorAll<SVGPathElement>('path')];

    this.editables.forEach(editable=>{
      editable.onmouseover=()=>{
        editable.style.fill = "#222";
      }

      editable.onmouseout=()=>{
        editable.style.fill = null;
      }

      editable.onclick=()=>{
        if (this.selectedPath != editable){
          this.onSelectPath(editable);
        }
      }
      
    })
  }

  addPoint(pathParent:Node, px: number, py: number, color: string, onMove: (x: number, y: number, lastx:number, lasty:number) => void, onMoveEnd?: (x: number, y: number, lastx:number, lasty:number) => void)  {
    let marker = new SMarker(this.svg, pathParent, px, py, color, onMove, onMoveEnd);
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
    mainNode: SVGSVGElement,
    parentNode: Node,
    //dropNode: HTMLElement,
    px: number,
    py: number,
    color: string,
    onMove: (x: number, y: number, lx:number, ly:number) => void,
    onMoveEnd?: (x: number, y: number, lx:number, ly:number) => void
  ) {
    this.onMove = onMove;
    this.color = color;
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.node = circle;

    let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM());
    let ptm = DOMMatrix.fromMatrix((mainNode).getScreenCTM()).inverse();
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
      
      mainNode.onmousemove = (ev) => {
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

      mainNode.onmouseup = (ev) => {
        let cr = new DOMPoint(ev.clientX- dragPoint.x, ev.clientY- dragPoint.y);
        let lr = mtx.transformPoint(cr);
        let cx = lr.x 
        let cy = lr.y
        //this.x = cx;
        //this.y = cy;
        let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM()).inverse();
        let cxp = ptp.transformPoint(cr);
        isDrag = false;
        mainNode.onmouseup = null;
        mainNode.onmousemove = null;
        onMoveEnd(cxp.x, cxp.y, lastx, lasty);
      }

      window.onmouseup = ()=>{
        isDrag = false;
        mainNode.onmouseup = null;
        mainNode.onmousemove = null;  
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

  destroy(){
    this.node.remove();
  }
}

