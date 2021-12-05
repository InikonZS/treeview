import {Application} from './app/application';
import im from "./settings.svg";

console.log(im); 

const app = new Application(document.body);

(window as any).app = app;