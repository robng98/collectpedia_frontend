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

// Add global style mutation observer to handle Shadow DOM
document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    document.querySelectorAll('swiper-container').forEach(swiperElement => {
      if (swiperElement.shadowRoot) {
        // Apply style to shadow DOM
        const style = document.createElement('style');
        style.textContent = `
          :host {
            --swiper-theme-color: #c4c4c4 !important;
            
            .swiper-pagination-vertical.swiper-pagination-bullets, .swiper-vertical > .swiper-pagination-bullets{
              right: var(--swiper-pagination-bullet-right, 25px);
              background-color: #1340af;
              padding: 5px;
              border-radius: 15px;
            }
          }
            
        `;
        swiperElement.shadowRoot.appendChild(style);
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
