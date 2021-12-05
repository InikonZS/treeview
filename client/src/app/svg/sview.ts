import Control from '../../common/control';
import { parsePath, toAbsolute, unParse } from './pathParser';

export class SEditor extends Control{
  constructor(parentNode: HTMLElement) {
    super(parentNode, 'div', '');
    let sview = new SView(this.node);

    let res = parsePath(sview.editable.getAttribute('d'));
    let ab = toAbsolute(res);
    console.log(ab);
    ab.forEach(it=>{
      console.log(it)
      if (it.tag=='C'){
        for (let i = 0; i< 3; i++){
          sview.addPoint(it.args[0 + i*2], it.args[1+ i*2], i==2? 'green':'red', (x,y)=>{
            it.args[0 + i*2] = x;
            it.args[1+ i*2] = y;
            sview.editable.setAttribute('d', unParse(ab));
          });
        }
          //
      } else {

      }
    });
  }  
}

export class SView extends Control {
  editable: SVGPathElement;
  svg: SVGElement;
  constructor(parentNode: HTMLElement) {
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

    this.svg = this.node.querySelector<SVGSVGElement>('svg');
    let r = this.svg.getAttribute('viewBox').split(' ');
    let rect = {
      left: Number.parseFloat(r[0]),
      top: Number.parseFloat(r[1]),
      width: Number.parseFloat(r[2]),
      height: Number.parseFloat(r[3])
    }

    this.node.style.width = px(rect.width);
    this.node.style.height = px(rect.height);

    this.editable = this.node.querySelector<SVGPathElement>('.a');
  }

  addPoint(px: number, py: number, color: string, onMove: (x: number, y: number) => void) {
    let main = this.node.querySelector<SVGGElement>('.all_image');
    let marker = new SMarker(main, this.node, px, py, color, onMove);
  }
}

class SMarker {
  constructor(
    parentNode: Node,
    dropNode: HTMLElement,
    px: number,
    py: number,
    color: string,
    onMove: (x: number, y: number) => void
  ) {
    let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', px.toString());
    circle.setAttribute('cy', py.toString());
    circle.setAttribute('r', 40..toString());
    circle.setAttribute('fill', color);

    let isDrag = false;
    circle.onmousedown = (ev) => {
      isDrag = true;

      dropNode.onmousemove = (ev) => {
        let cx = (ev.clientX) * 10;
        let cy = (ev.clientY - 1280) * -10;
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
}

function px(value:number){
  return value+'px';
}