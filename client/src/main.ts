import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';


import { register as registerSwiperElements } from 'swiper/element/bundle';

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
  
  ::-webkit-scrollbar {
    display: auto;
  }
`;
document.head.appendChild(style);

registerSwiperElements();

document.addEventListener('DOMContentLoaded', () => {
  const observer = new MutationObserver((mutations) => {
    document.querySelectorAll('swiper-container').forEach(swiperElement => {
      if (swiperElement.shadowRoot) {
        if (!swiperElement.shadowRoot.querySelector('#custom-swiper-styles')) {
          const style = document.createElement('style');
          style.id = 'custom-swiper-styles';
          style.textContent = `
            :host {
              --swiper-theme-color: #4263c3 !important;
            }
            .swiper-pagination-bullet-active {
              background-color: rgb(224, 226, 236) !important;
            }
            .swiper-pagination-vertical.swiper-pagination-bullets,
            .swiper-vertical > .swiper-pagination-bullets {
              right: var(--swiper-pagination-right, 25px);
              background-color: #1340af;
              padding: 5px;
              border-radius: 15px;
            }
          `;
          swiperElement.shadowRoot.appendChild(style);
        }
      }
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
});

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
