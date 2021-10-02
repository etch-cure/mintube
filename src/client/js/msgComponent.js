class CustomMsg extends HTMLElement {
  render () {
    let styleClassType = this.getAttribute('type');
    let text = this.getAttribute('text');
    this.innerHTML =
    `<div class="message ${styleClassType}">
      <span>${text}</span>
    </div>`
  }

  connectedCallback () {
    this.render()
  }

  static get observedAttributes() {return ['text', 'type']; }

  attributeChangedCallback (name, oldValue, newValue) {
    this.render()
  }
}

customElements.define('mintube-message', CustomMsg)

export const showMsg = (msgText, msgType) => {
  let msgElement = document.querySelector('mintube-message');
  if (msgElement === null) {
    msgElement = document.createElement('mintube-message');
    const body = document.body;
    body.insertBefore(msgElement, body.firstChild);
  }
  msgElement.setAttribute('text', msgText);
  msgElement.setAttribute('type', msgType);
}
