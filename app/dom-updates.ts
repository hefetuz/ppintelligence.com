/** Read inline values only: these checks do not request layout/computed styles. */
export function setMotionStyle(element: HTMLElement | SVGElement | null | undefined, name: string, value: string) {
  if (element && element.style.getPropertyValue(name) !== value)
    element.style.setProperty(name, value);
}

export function setMotionAttribute(element: Element | null | undefined, name: string, value: string) {
  if (element && element.getAttribute(name) !== value)
    element.setAttribute(name, value);
}

export function setMotionText(element: Element | null | undefined, value: string) {
  if (element && element.textContent !== value) element.textContent = value;
}
