import Control from '../common/control';
import {DataHolder, ICategoryData, IWordData} from './dataHolder';
import {TreeEditorView, TreeEditorModel, initialTree} from './treeEditor';

export class Application extends Control{
  constructor(parentNode:HTMLElement){
    super(parentNode);
    const hello = new Control(this.node, 'div', '', 'hello');

    const treeEditorModel = new TreeEditorModel();
    const treeEditorView = new TreeEditorView(this.node, treeEditorModel);
    treeEditorModel.setData(initialTree);
    treeEditorView.update(initialTree);

   /* const preloaderView = new Control(this.node);
    preloaderView.node.textContent = 'loading...';

    const dataHolder = new DataHolder();
    dataHolder.build((loaded, count)=>{
      preloaderView.node.textContent = `${loaded}/${count}`
    }).then(loadingResult=>{
      preloaderView.destroy();
      const mainCycle = ()=>{
        const mainMenu = new CategorySelectView(this.node, loadingResult.base.categories);
        mainMenu.onCategorySelect = (categoryIndex)=>{
          mainMenu.destroy();
          showQuestion(categoryIndex, 0, ()=>{
            mainCycle();
          });
        }
      }
      mainCycle();
      
      const showQuestion = (categoryIndex:number, questionIndex:number, onFinish:()=>void)=>{
        const currentCategory = loadingResult.base.categories[categoryIndex];
        const currentImageView = new QuestionView(this.node, currentCategory.words[questionIndex]);
        currentImageView.onNextClick = ()=>{
          if (questionIndex<currentCategory.words.length -1 ){
            currentImageView.destroy();
            showQuestion(categoryIndex, questionIndex+1, onFinish);
          } else {
            currentImageView.destroy();
            onFinish();
          }
        }
      }
  
    }); */
  }
}

class QuestionView extends Control{
  public onNextClick: ()=>void;

  constructor(parentNode:HTMLElement, data:IWordData){
    super(parentNode);
    const image = new Control<HTMLImageElement>(this.node, 'img', '');
    image.node.onclick = ()=>{
      this.onNextClick();
    }
    image.node.src = data.loadedImage;
    const word = new Control(this.node);
    word.node.textContent = data.word;
    const translation = new Control(this.node);
    translation.node.textContent = data.translation;
  } 
}

class CategorySelectView extends Control{
  public onCategorySelect: (index:number)=>void;

  constructor(parentNode:HTMLElement, data:Array<ICategoryData>){
    super(parentNode);
    data.forEach((item, index)=>{
      const categoryName = new Control(this.node);
      categoryName.node.textContent = item.name;
      categoryName.node.onclick = ()=>{
        this.onCategorySelect(index);
      }
    })
  } 
}