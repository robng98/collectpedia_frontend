import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


import { register as registerSwiperElements } from 'swiper/element/bundle';

// Add global styles
const style = document.createElement('style');
style.innerHTML = `
  html, body {
    height: 100%;
    margin: 0;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: #4263c3 #1e3a8a;
  }
  body {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  /* Webkit scrollbar styles (Chrome, Safari, newer Edge) */
  ::-webkit-scrollbar {
    width: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: #1e3a8a;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background-color: #4263c3;
    border-radius: 4px;
  }
  
  /* Only display scrollbar when content overflows */
  ::-webkit-scrollbar {
    display: auto;
  }
`;
document.head.appendChild(style);

registerSwiperElements();

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
