import Control from '../../common/control';
import { parsePath, tags, toAbsolute, unParse } from './pathParser';

import {sv1, sv} from './imgs';

export class SEditor extends Control{
  sview: SView = null;

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
      let pathData = editable.getAttribute('d');
      let res = parsePath(pathData);
      let ab = toAbsolute(res);
      ab.forEach(it=>{
        let lx = 0;
        let ly = 0;
        for (let i = 0; i< tags.get(it.tag)/2; i++){
          let ax:number = null;
          let ay:number = null;
          if (it.tag.toLowerCase() == 'z' ){
    
          } else 
          if (it.tag.toLowerCase() == 'h' ){
            ax = it.args[0];
          } else 

          if (it.tag.toLowerCase() == 'v' ){
            
            ay = it.args[0]; 
          } else {
            ax = it.args[0 + i*2];
            ay = it.args[1+ i*2]; 
          }
          
          sview.addPoint(editable.parentNode, ax ?? lx, ay ?? ly, i==tags.get(it.tag)/2-1? 'green':'red', (x,y)=>{
            it.args[0 + i*2] = x;
            it.args[1 + i*2] = y;
            editable.setAttribute('d', unParse(ab));
          });
          lx = it.args[0 + i*2];
          ly = it.args[1 + i*2];
        }
      }); 
    })
  }
}

export class SView extends Control {
  editables: SVGPathElement[];
  svg: SVGElement;
  constructor(parentNode: HTMLElement, svgCode:string) {
    super(parentNode, 'div', '',);

   this.node.innerHTML = svgCode;

    this.svg = this.node.querySelector<SVGSVGElement>('svg');
    let r = this.svg.getAttribute('viewBox').split(' ');
    let rect = {
      left: Number.parseFloat(r[0]),
      top: Number.parseFloat(r[1]),
      width: Number.parseFloat(r[2]),
      height: Number.parseFloat(r[3])
    }

    const pixel = (value:number)=>{
      return value+'px';
    }
    this.node.style.width = pixel(rect.width);
    this.node.style.height = pixel(rect.height);

    this.editables = [...this.node.querySelectorAll<SVGPathElement>('path')];
  }

  addPoint(pathParent:Node, px: number, py: number, color: string, onMove: (x: number, y: number) => void) {
    let main = this.node.querySelector<SVGElement>('svg');
    let marker = new SMarker(main, pathParent, this.node, px, py, color, onMove);
  }
}

class SMarker {
  private size:number = 50;

  constructor(
    mainNode: Node,
    parentNode: Node,
    dropNode: HTMLElement,
    px: number,
    py: number,
    color: string,
    onMove: (x: number, y: number) => void
  ) {
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

   /* let mtp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM());
    let ptmp = DOMMatrix.fromMatrix((mainNode as SVGGElement).getScreenCTM()).inverse();
    let vec = new DOMPoint(10);
    let vz = new DOMPoint(0);
    let rv = mtp.transformPoint(vec);
    let rvz = mtp.transformPoint(vz);*/

    let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM());
    let ptm = DOMMatrix.fromMatrix((mainNode as SVGGElement).getScreenCTM()).inverse();
    let ppoint = new DOMPoint(px, py);
    let pp = ptp.transformPoint(ppoint);
    let pm = ptm.transformPoint(pp);

    circle.setAttribute('cx', pm.x.toString());
    circle.setAttribute('cy', pm.y.toString());
    circle.setAttribute('r', (5).toString());
    circle.setAttribute('fill', color);

    let isDrag = false;
    let dragPoint:DOMPoint = null;
    circle.onmousedown = (ev) => {
      isDrag = true;
      

      let mtx = DOMMatrix.fromMatrix(circle.getScreenCTM()).inverse();

      let cp = new DOMPoint(circle.cx.baseVal.value, circle.cy.baseVal.value);
      let mcp = mtx.inverse().transformPoint(cp);
      dragPoint = new DOMPoint(ev.clientX - mcp.x, ev.clientY- mcp.y);
     // let dp = mtx.transformPoint(dragPoint);
      console.log(mtx);
      
      
      dropNode.onmousemove = (ev) => {
        let cr = new DOMPoint(ev.clientX- dragPoint.x, ev.clientY- dragPoint.y);
        let lr = mtx.transformPoint(cr);
        let cx = lr.x 
        let cy = lr.y ;
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', cy.toString());
        let ptp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM()).inverse();
        let cxp = ptp.transformPoint(cr);
        onMove(cxp.x, cxp.y);
      }

      dropNode.onmouseup = (ev) => {
        isDrag = false;
        dropNode.onmouseup = null;
        dropNode.onmousemove = null;
      }
    }
    mainNode.appendChild(circle);
  }

  setSize(){

  }
}
