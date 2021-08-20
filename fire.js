console.log('Happy coding!')

const app = document.getElementById('app')

class Fire {
  constructor({
    prefix,
    trackAttribute,
    initialState
  } = {}) {
    this._prefix = prefix || 'fire'
    this._trackAttribute = trackAttribute || `${this._prefix}-track-id`
    this._state = initialState || {}
    this._watchers = {}
    this._elementTracker = {}
  }

  generateTrackId = () => `${this._prefix}_${Math.random().toString(36).substr(2, 9)}`

  setTrackId = (element, trackId) => element.setAttribute(this._trackAttribute, trackId)

  getTrackId = key =>
    this._elementTracker[key]
      ? this._elementTracker[key]
      : this.generateTrackId()

  trackElement = key => this._elementTracker[key] = this.getTrackId(key)

  updateDOM = (key, value) => {
    const elements = document.getElementsByTagName('*')

    for (let i = 0; i < elements.length; i++) {
      const elementChildNodes = elements[i].childNodes

      for (let j = 0; j < elementChildNodes.length; j++) {
        if (elementChildNodes[j].nodeType === 3) {
          const wrapperElement = elementChildNodes[j].parentElement

          if (elementChildNodes[j].nodeValue.includes(`🔥${key}🔥`)) {
            elementChildNodes[j].nodeValue = value
            this.trackElement(key)
            this.setTrackId(wrapperElement, this._elementTracker[key])
          } else if (
            wrapperElement.getAttribute(this._trackAttribute) === this._elementTracker[key] &&
            elementChildNodes[j].nodeValue !== String(this._state[key])
          ) {
            elementChildNodes[j].nodeValue = this._state[key]
          }
        }
      }
    }
  }

  setState = handler => {
    const payload = typeof handler === 'function'
      ? handler(this._state)
      : handler

    const oldState = this._state
    this._state = {
      ...this._state,
      ...payload
    }

    Object.entries(payload).forEach(([key, value]) => {
      this.updateDOM(key, value)
      this._watchers[key] && this._watchers[key](this._state[key], oldState[key])
    })
  }

  watch = (watchers = {}) => Object.entries(watchers).forEach(([key, watcher]) => (this._watchers[key] = watcher))
}