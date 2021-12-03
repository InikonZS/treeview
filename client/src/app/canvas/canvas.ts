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
