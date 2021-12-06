import Control from '../../common/control';
import { parsePath, tags, toAbsolute, unParse } from './pathParser';

import {sv1, sv} from './imgs';

export class SEditor extends Control{
  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', '');
    let sview = new SView(this.node);
    sview.editables.forEach(editable=>{

      let pathData = editable.getAttribute('d');
      //pathData = pathData.split('-').join(' -');
      let res = parsePath(pathData);
      let ab = toAbsolute(res);
    // console.log(ab);
      ab.forEach(it=>{
    //    console.log(it)
        //if (it.tag=='M'){
          let lx = 0;
          let ly = 0;
          for (let i = 0; i< tags.get(it.tag)/2; i++){
            
            sview.addPoint(it.args[0 + i*2] ?? lx, it.args[1+ i*2] ?? ly, i==tags.get(it.tag)/2-1? 'green':'red', (x,y)=>{
              it.args[0 + i*2] = x;
              it.args[1+ i*2] = y;
              editable.setAttribute('d', unParse(ab));
            });
            lx = it.args[0 + i*2];
            ly = it.args[1+ i*2];
          }
            //
      // } else {

        //}
      }); 
    })
  }  
}

export class SView extends Control {
  editables: SVGPathElement[];
  svg: SVGElement;
  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', '',);

   this.node.innerHTML = sv1;

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

  addPoint(px: number, py: number, color: string, onMove: (x: number, y: number) => void) {
    let main = this.node.querySelector<SVGGElement>('.all_image');
    let marker = new SMarker(main, this.node, px, py, color, onMove);
  }
}

class SMarker {
  private size:number = 50;

  constructor(
    parentNode: Node,
    dropNode: HTMLElement,
    px: number,
    py: number,
    color: string,
    onMove: (x: number, y: number) => void
  ) {
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    let mtp = DOMMatrix.fromMatrix((parentNode as SVGGElement).getScreenCTM()).inverse();
    let vec = new DOMPoint(5);
    let vz = new DOMPoint(0);
    let rv = mtp.transformPoint(vec);
    let rvz = mtp.transformPoint(vz);

    circle.setAttribute('cx', px.toString());
    circle.setAttribute('cy', py.toString());
    circle.setAttribute('r', (rv.x - rvz.x).toString());
    circle.setAttribute('fill', color);

    let isDrag = false;
    let dragPoint:DOMPoint = null;
    circle.onmousedown = (ev) => {
      isDrag = true;
      dragPoint = new DOMPoint(ev.offsetX - circle.cx.baseVal.value, ev.offsetY- circle.cy.baseVal.value);

      let mtx = DOMMatrix.fromMatrix(circle.getScreenCTM()).inverse();

     // let dp = mtx.transformPoint(dragPoint);
      console.log(mtx);
      
      
      dropNode.onmousemove = (ev) => {
        let cr = new DOMPoint(ev.clientX, ev.clientY);
        let lr = mtx.transformPoint(cr);
        let cx = lr.x - dragPoint.x;
        let cy = lr.y - dragPoint.y;
        circle.setAttribute('cx', cx.toString());
        circle.setAttribute('cy', cy.toString());
        onMove(cx, cy);
      }

      dropNode.onmouseup = (ev) => {
        isDrag = false;
        dropNode.onmouseup = null;
        dropNode.onmousemove = null;
      }
    }
    parentNode.appendChild(circle);
  }

  setSize(){

  }
}
