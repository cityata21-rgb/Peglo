export const THEME_KEY = 'halcyon-theme'

export const THEME_BOOT = `try{if(localStorage.getItem('${THEME_KEY}')==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`
