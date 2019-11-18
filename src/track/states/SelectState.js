import { pixelsToSeconds } from '../../utils/conversions';

export default class {
  constructor(track) {
    this.track = track;
  }

  setup(samplesPerPixel, sampleRate) {
    this.samplesPerPixel = samplesPerPixel;
    this.sampleRate = sampleRate;
  }

  emitSelection(x) {
    const minX = Math.min(x, this.startX);
    const maxX = Math.max(x, this.startX);
    const startTime = pixelsToSeconds(minX, this.samplesPerPixel, this.sampleRate);
    const endTime = pixelsToSeconds(maxX, this.samplesPerPixel, this.sampleRate);

    this.track.ee.emit('select', startTime, endTime, this.track);
  }

  mousedown(downEvent) {
    if (downEvent.button !== 0) return; // Only respond to main mouse button

    downEvent.preventDefault();

    const overlayElement = downEvent.target;

    // We will set mouse event listeners on the whole document to catch movements outside the track.
    const docElement = overlayElement.ownerDocument.documentElement;

    // Update selection on move.
    const handleMouseMove = moveEvent => {
      moveEvent.preventDefault();
      const x = moveEvent.clientX - overlayElement.getBoundingClientRect().left;
      this.emitSelection(x);
    };

    const handleMouseLeave = leaveEvent => {
      leaveEvent.preventDefault();

      // In Firefox, if the cursor is held down and while dragging it out of the document, we will
      // first get a leave and an enter event, and then no more move or up events; but we get a
      // leave event when the button is released. Therefore we check if the button is still pressed.
      if (!(enterEvent.buttons & 1)) { // Tests if the primary button is no longer pressed
        // User released the button; end of interaction.
        removeEventListeners();
        // Don’t update the selection: it would jump unexpectedly as we did not receive move events.
        return;
      }

      // Treat like a 'move' event.
      const x = leaveEvent.clientX - overlayElement.getBoundingClientRect().left;
      this.emitSelection(x);
    };

    const handleMouseUp = upEvent => {
      upEvent.preventDefault();
      removeEventListeners();
      const x = upEvent.clientX - overlayElement.getBoundingClientRect().left;
      this.emitSelection(x);
    };

    // Detect, when the mouse re-enters the document, if a mouse-up has happened outside of it.
    const handleMouseEnter = enterEvent => {
      enterEvent.preventDefault();
      if (!(enterEvent.buttons & 1)) { // Tests if the primary button is no longer pressed
        removeEventListeners();
      }
    };

    const removeEventListeners = () => {
      docElement.removeEventListener('mousemove', handleMouseMove);
      docElement.removeEventListener('mouseleave', handleMouseLeave);
      docElement.removeEventListener('mouseup', handleMouseUp);
      docElement.removeEventListener('mouseenter', handleMouseEnter);
    };

    docElement.addEventListener('mousemove', handleMouseMove);
    docElement.addEventListener('mouseleave', handleMouseLeave);
    docElement.addEventListener('mouseup', handleMouseUp);
    docElement.addEventListener('mouseenter', handleMouseEnter);

    this.startX = downEvent.clientX - overlayElement.getBoundingClientRect().left;
    const startTime = pixelsToSeconds(this.startX, this.samplesPerPixel, this.sampleRate);

    this.track.ee.emit('select', startTime, startTime, this.track);
  }

  static getClass() {
    return '.state-select';
  }

  static getEvents() {
    return ['mousedown'];
  }
}
