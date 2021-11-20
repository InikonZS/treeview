import Control from '../common/control';

class TreeItemView extends Control{
  public onClick: ()=>void;
  public onDelete: ()=>void;

  constructor(parentNode:HTMLElement, data:ITreeNode, undeletable:boolean = false){
    super(parentNode);
    const itemName = new Control(this.node);
    itemName.node.textContent = data.name;
    itemName.node.onclick = ()=>{
      this.onClick();
    }
    if (!undeletable){
      const deleteButton = new Control(this.node, 'div', '', 'X');
      deleteButton.node.onclick = ()=>{
        this.onDelete();
      }
    }
  } 
}

export class TreeEditorView extends Control{
  private items: TreeItemView[] = [];
  private backItem: TreeItemView;
  private model: TreeEditorModel;

  constructor(parentNode:HTMLElement, model:TreeEditorModel){
    super(parentNode);
    this.model = model;
    const addButton = new Control(this.node, 'button', '', 'create');
    addButton.node.onclick = ()=>{
      this.model.addItem('newItem');
    }
    this.model.onChangeNode= (current=>{
      this.update(current);
    });

  }

  update(data:ITreeNode){
    if (!data.children){

    } else {
      this.clear();
      if (this.model.hasParent()){
        const back = new TreeItemView(this.node, {name:'..', type:-1}, true);
        back.onClick = ()=>{
          this.model.toParent();
        }
        this.backItem = back;
      }
      const children = data.children.map((childData, index)=>{
        const child = new TreeItemView(this.node, childData);
        child.onClick = ()=>{
          this.model.toChild(index);
        }
        child.onDelete = ()=>{
          this.model.deleteItem(index);
        }
        return child;
      });
      this.items = children;
    }
  }

  clear(){
    if (this.backItem){
      this.backItem.destroy();
      this.backItem = null;
    }
    this.items.forEach(it => it.destroy());
  }
}

interface ITreeNode{
  name: string;
  type: number;
  children?: Array<ITreeNode>
}

export const initialTree: ITreeNode = {
  name:'root',
  type:0,
  children:[
    {  
      name:'1_1',
      type:0,
      children:[]
    },
    {  
      name:'1_2',
      type:0,
      children:[
        {  
          name:'1_2_1',
          type:0,
          children:[]
        },
        {  
          name:'1_2_2',
          type:0,
          children:[]
        },
      ]
    },
    {  
      name:'1_3',
      type:0,
      children:[]
    },
  ]
}

export class TreeEditorModel{
  private root: ITreeNode;
  private current: ITreeNode;
  private stack: ITreeNode[] = [];
  public onChangeNode: (currenNode: ITreeNode)=>void;
  constructor(){
    
  }

  setData(data:ITreeNode){
    this.root = data;
    this.stack = [];
    this.current = this.root;
    //this.onChange();
  }

  toChild(index:number){
    this.stack.push(this.current);
    this.current = this.current.children[index];
    this.onChangeNode(this.getCurrentNode());
  }

  toParent(){
    this.current = this.stack.pop();
    this.onChangeNode(this.getCurrentNode());
  }

  hasParent(){
    return !!this.stack.length
  }

  getCurrentNode(){
    return this.current;
  }

  addItem(name:string){
    this.current.children.push({
      name: name,
      type: 0,
      children: []
    });
    this.onChangeNode(this.getCurrentNode());
  }
  deleteItem(index:number){
    this.current.children.splice(index, 1);
    this.onChangeNode(this.getCurrentNode());
  }
}
