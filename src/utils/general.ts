/* eslint-disable @typescript-eslint/no-explicit-any */
export const getById = (id: string) => document.getElementById(id)

export const clickById = (id: string) => {
  const el = getById(id)
  if (el) {
    el.click()
  }
}

export const focusById = (id: string) => {
  const el = getById(id)
  if (el) {
    el.focus()
  }
}

export const toSection = (id: string) => {
  const header = getById('main-header')
  const headerHeight = header ? header.offsetHeight : 0
  const element = getById(id)
  const elementPosition = element!.getBoundingClientRect().top
  const offsetPosition = elementPosition + window.scrollY - headerHeight

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth',
  })
}

export const moveItem = (arr: any[], from: number, to: number) => {
  if (from < 0) from = arr.length + from
  if (to < 0) to = arr.length + to
  if (from >= arr.length || to >= arr.length) return
  const item = arr.splice(from, 1)[0]
  arr.splice(to, 0, item)
}
