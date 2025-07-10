import ReactDom from 'react-dom/client'
import React from 'react'

import { App } from './routes'

import './globals.css'

console.log('React app starting...')

const appElement = document.querySelector('app')
console.log('App element found:', appElement)

if (appElement) {
  ReactDom.createRoot(appElement as HTMLElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('React app mounted successfully')
} else {
  console.error('App element not found!')
}
