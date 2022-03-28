type StateValue = any
type State = Record<string, StateValue>
type Watcher = (value: StateValue, oldValue: StateValue) => void
type Watchers = Record<keyof State, Watcher>
type TrackId = string

class Fire {
  constructor({
    prefix,
    tagName,
    trackAttribute,
    state
  }: {
    prefix?: string,
    tagName?: string,
    trackAttribute?: string,
    state?: State
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

  _prefix: string
  _tagName: string
  _trackAttribute: string
  _initialState: State
  _state: State
  _watchers: Watchers
  _elementTracker: Record<keyof State, TrackId>

  get initialState (): State {
    return this._initialState
  }

  setState = (handler: Partial<State> | ((state: State) => Partial<State>)): void => {
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
      const watcher = this._watchers[key]
      if (watcher) watcher(this._state[key], oldState[key])
    })
  }

  generateTrackId = (): TrackId => `${this._prefix}_${Math.random().toString(36).substr(2, 9)}`

  setTrackIdToElement = (element: Element, trackId: TrackId): void =>
    element.setAttribute(this._trackAttribute, trackId)

  getTrackId = (key: keyof State): TrackId =>
    this._elementTracker[key] ? this._elementTracker[key] : this.generateTrackId()

  trackElement = (key: keyof State): TrackId => this._elementTracker[key] = this.getTrackId(key)

  updateDOM = (key: keyof State, value: StateValue) => {
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
              this.setTrackIdToElement(wrapperElement, this._elementTracker[key])
            } else {
              wrapperElement.innerHTML = wrapperElement.innerHTML
                .replace(
                  fireVariable,
                  `<${this._tagName}>${value}</${this._tagName}>`
                )

              this.setTrackIdToElement(
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

  watch = (watchers: Watchers = {}) =>
    Object.entries(watchers).forEach(([key, watcher]) => this._watchers[key] = watcher)
}
