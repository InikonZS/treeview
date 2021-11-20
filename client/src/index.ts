import {Application} from './app/application';

const app = new Application(document.body);

(window as any).app = app;