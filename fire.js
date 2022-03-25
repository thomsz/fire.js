class Fire {
  constructor({
    prefix,
    tagName,
    trackAttribute,
    state
  } = {}) {
    this._prefix = prefix || 'fire'
    this._tagName = tagName || 'fire'
    this._trackAttribute = trackAttribute || `${this._prefix}-track-id`
    this._initialState = state || {}
    this._state = state || {}
    this._watchers = {}
    this._elementTracker = {}

    this.setState(state)
  }

  get initialState () {
    return this._initialState
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

  generateTrackId = () => `${this._prefix}_${Math.random().toString(36).substr(2, 9)}`

  setTrackId = (element, trackId) => element.setAttribute(this._trackAttribute, trackId)

  getTrackId = key =>
    this._elementTracker[key]
      ? this._elementTracker[key]
      : this.generateTrackId()

  trackElement = key => this._elementTracker[key] = this.getTrackId(key)

  updateDOM = (key, value) => {
    const excludedElements = ['html', 'head', 'body', 'script']
    const elements = document.getElementsByTagName('*')

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i]

      if (excludedElements.includes(element.nodeName.toLowerCase())) continue

      for (let j = 0; j < element.childNodes.length; j++) {
        const childNode = element.childNodes[j]

        if (childNode.nodeType === 3) {
          const wrapperElement = childNode.parentElement
          const fireVariable = `{{${key}}}`

          if (childNode.nodeValue.includes(fireVariable)) {
            this.trackElement(key)

            if (childNode.nodeValue.length === fireVariable.length) {
              wrapperElement.innerHTML = value
              this.setTrackId(wrapperElement, this._elementTracker[key])
            } else {
              wrapperElement.innerHTML = wrapperElement.innerHTML
                .replace(
                  fireVariable,
                  `<${this._tagName}>${value}</${this._tagName}>`
                )

              this.setTrackId(
                wrapperElement.getElementsByTagName(this._tagName)[0],
                this._elementTracker[key]
              )
            }
          } else if (
            wrapperElement.getAttribute(this._trackAttribute) === this._elementTracker[key] &&
            childNode.nodeValue !== String(this._state[key])
          ) {
            childNode.nodeValue = this._state[key]
          }
        }
      }
    }
  }

  watch = (watchers = {}) => Object.entries(watchers).forEach(([key, watcher]) => (this._watchers[key] = watcher))
}
