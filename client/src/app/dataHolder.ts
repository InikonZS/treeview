export interface IApplicationData {
  categories: Array<ICategoryData>
  preload: (onProgress: (loaded:number, count:number)=>void )=> Promise<void>
}

export interface ICategoryData{
  name: string;
  words: Array<IWordData>;
}

export interface IWordData{
  word: string;
  translation: string;
  image: string;
  loadedImage?: string;
  preload: ()=> Promise<void>
}

interface IWordRawData{
  word:string
  translation: string,
  image?: string,
  audioSrc?: string,
}

class WordData implements IWordData{
  public word: string;
  public translation: string;
  public image: string;
  private loadedImageBlob: Blob;
  public loadedImage: string;
  constructor(word:string, translation:string, image?:string){
    if (typeof word !== 'string'){
      throw new Error('Word parameter is incorrect');
    }
    if (typeof translation !== 'string'){
      throw new Error('Translation parameter is incorrect');
    }
    this.word = word;
    this.translation = translation;
    if (image){
      this.image = './public/'+image;
    } else {
      this.image = './public/'+ `img/${word}.jpg`
    }
  }

  static fromJson(json:any){
    return new WordData(json.word, json.translation, json.image);
  }

  preload(){
    return fetch(this.image).then(res => res.blob()).then( img =>{
      this.loadedImageBlob = img;
      this.loadedImage = URL.createObjectURL(this.loadedImageBlob);
      return null;
    });
  }
}

class ApplicationData implements IApplicationData{
  public categories: Array<ICategoryData>;
  constructor(data: Array<ICategoryData>){
    this.categories = data;
  }

  static fromJson(data:any){
    const categories: Array<string> = data[0];
    const categoryRecords: Array<Array<IWordRawData>> = data.slice(1);
    if (categories.length != categoryRecords.length){
      throw new Error('Bad database');
    }
    const formattedCategories:Array<ICategoryData> = categories.map((item, index)=>{
      const category:ICategoryData = {
        name: item,
        words: categoryRecords[index].map(wordRawData => WordData.fromJson(wordRawData))
      }
      return category;
    })
    
    return new ApplicationData(formattedCategories);
  }

  async preload(onProgress: (loaded:number, count:number)=>void){
    for (let i = 0; i < this.categories.length; i++){
      let category = this.categories[i];
      for (let j = 0; j < category.words.length; j++){
        let word = category.words[j];
        onProgress(i, this.categories.length);
        await word.preload();
      }
    }
  }
}

export class DataHolder{
  public base: ApplicationData;

  constructor(){

  }

  public async build(onProgress: (loaded:number, count:number)=>void ){
    const applicationData = await this.getBase();
    await applicationData.preload((loaded, count)=>{
      onProgress(loaded, count);
    });
    this.base = applicationData;
    return this;
  }

  private getBase(){
    return fetch('./public/base.json').then(res=> res.json()).then((data:Array<any>)=>{
      return ApplicationData.fromJson(data);
      
    });
  }
}