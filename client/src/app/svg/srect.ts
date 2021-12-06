import { pixel } from "./utils";

export class SRect {
  startPoint: DOMPoint;
  endPoint: DOMPoint;
  node: SVGRectElement;
  mtx: DOMMatrix;

  constructor(parentNode:SVGSVGElement, sx:number, sy:number){
    this.mtx = DOMMatrix.fromMatrix(parentNode.getScreenCTM()).inverse();
    this.startPoint = this.mtx.transformPoint(new DOMPoint(sx, sy));
    this.endPoint = this.startPoint;
    let rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.style.stroke = '#000';
    rect.style.fill = '#0004';
    rect.setAttribute('x', pixel(this.startPoint.x));
    rect.setAttribute('y', pixel(this.startPoint.y));
    rect.setAttribute('width', pixel(0));
    rect.setAttribute('height', pixel(0));
    parentNode.appendChild(rect);
    this.node = rect;
  }

  resize(ex:number, ey:number){
    const rect = this.node;
    this.endPoint = this.mtx.transformPoint(new DOMPoint(ex, ey));
    rect.setAttribute('width', pixel(Math.abs(this.endPoint.x - this.startPoint.x)));
    rect.setAttribute('height', pixel(Math.abs(this.endPoint.y - this.startPoint.y)));

    if (this.endPoint.x - this.startPoint.x < 0) {
      rect.setAttribute('x', pixel(this.endPoint.x));
    } else {
      rect.setAttribute('x', pixel(this.startPoint.x));
    }

    if (this.endPoint.y - this.startPoint.y < 0) {
      rect.setAttribute('y', pixel(this.endPoint.y));
    } else {
      rect.setAttribute('y', pixel(this.startPoint.y));
    }
  }

  destroy(){
    this.node.remove();
  }
}