export const getImage = (path: string): string => new URL(`../assets/${path}`, import.meta.url).href

export const checkImage = (url: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image()
    img.src = url
    img.onload = () => resolve(url)
    img.onerror = () => resolve('')
  })
