import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MathJaxContext } from 'better-react-mathjax';
import { App } from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

const mathJaxConfig = {
  loader: {
    load: [
      '[tex]/ams',
      '[tex]/noerrors',
      '[tex]/noundefined'
    ]
  },
  tex: {
    inlineMath: [
      ['$', '$'],
      ['\\(', '\\)']
    ],
    displayMath: [
      ['$$', '$$'],
      ['\\[', '\\]']
    ],
    processEscapes: true,
    processEnvironments: true,
    packages: {
      '[+]': [
        'ams',
        'noerrors',
        'noundefined'
      ]
    }
  },
  options: {
    skipHtmlTags: [
      'script',
      'noscript',
      'style',
      'textarea',
      'pre',
      'code'
    ]
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MathJaxContext
      version={3}
      config={mathJaxConfig}
      src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
      onLoad={() => {
        console.info('MathJax đã tải thành công');
      }}
      onError={(error) => {
        console.error('Lỗi tải MathJax:', error);
      }}
    >
      <AppProvider>
        <App />
      </AppProvider>
    </MathJaxContext>
  </StrictMode>,
);
