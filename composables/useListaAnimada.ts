// Hooks para <TransitionGroup :css="false">: las filas que entran se abren en
// alto (con opacidad y un leve descenso) y las que salen se cierran. Alto y
// opacidad van juntos para que el resto de la lista se acomode sin saltos.
const EASE = 'cubic-bezier(0.23, 1, 0.32, 1)'

export function useListaAnimada() {
  function onEnter(el: Element, done: () => void) {
    const e = el as HTMLElement
    const h = e.scrollHeight
    e.style.overflow = 'hidden'
    e.animate(
      [{ height: '0px', opacity: 0, transform: 'translateY(-6px)' }, { height: `${h}px`, opacity: 1, transform: 'none' }],
      { duration: 360, easing: EASE },
    ).onfinish = () => { e.style.overflow = ''; done() }
  }
  function onLeave(el: Element, done: () => void) {
    const e = el as HTMLElement
    e.style.overflow = 'hidden'
    e.animate(
      [{ height: `${e.offsetHeight}px`, opacity: 1 }, { height: '0px', opacity: 0 }],
      { duration: 240, easing: EASE },
    ).onfinish = done
  }
  return { onEnter, onLeave }
}
