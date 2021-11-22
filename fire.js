class Fire {
  constructor({
    prefix,
    tagName,
    trackAttribute,
    initialState
  } = {}) {
    this._prefix = prefix || 'fire'
    this._tagName = tagName || 'fire'
    this._trackAttribute = trackAttribute || `${this._prefix}-track-id`
    this._state = initialState || {}
    this._watchers = {}
    this._elementTracker = {}

    this.setState(initialState)
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
          const fireVariable = `{{${key}}}`

          if (elementChildNodes[j].nodeValue.includes(fireVariable)) {
            wrapperElement.innerHTML = wrapperElement.innerHTML
              .replace(
                fireVariable,
                `<${this._tagName}>${value}</${this._tagName}>`
              )

            this.trackElement(key)
            this.setTrackId(
              wrapperElement.getElementsByTagName(this._tagName)[0],
              this._elementTracker[key]
            )
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