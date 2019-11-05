import _clamp from 'lodash.clamp';
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
    const chosenStartTime = pixelsToSeconds(minX, this.samplesPerPixel, this.sampleRate);
    const startTime = _clamp(chosenStartTime, this.track.getStartTime(), this.track.getEndTime());
    const chosenEndTime = pixelsToSeconds(maxX, this.samplesPerPixel, this.sampleRate);
    const endTime = _clamp(chosenEndTime, this.track.getStartTime(), this.track.getEndTime());

    this.track.ee.emit('select', startTime, endTime, this.track);
  }

  mousedown(downEvent) {
    if (downEvent.button !== 0) return; // Only respond to main mouse button

    downEvent.preventDefault();

    const overlayElement = downEvent.target;

    // We will set up mouse event listeners on the whole body, to catch movements outside the track.
    const body = overlayElement.ownerDocument.body;

    // Update selection on move. Treat 'leave' as a 'move' to ensure we set x to the very edge.
    const handleMouseMoveOrLeave = moveEvent => {
      moveEvent.preventDefault();
      const x = moveEvent.clientX - overlayElement.getBoundingClientRect().left;
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
      body.removeEventListener('mousemove', handleMouseMoveOrLeave);
      body.removeEventListener('mouseleave', handleMouseMoveOrLeave);
      body.removeEventListener('mouseup', handleMouseUp);
      body.removeEventListener('mouseenter', handleMouseEnter);
    };

    body.addEventListener('mousemove', handleMouseMoveOrLeave);
    body.addEventListener('mouseleave', handleMouseMoveOrLeave);
    body.addEventListener('mouseup', handleMouseUp);
    body.addEventListener('mouseenter', handleMouseEnter);

    this.startX = downEvent.clientX - overlayElement.getBoundingClientRect().left;
    const chosenTime = pixelsToSeconds(this.startX, this.samplesPerPixel, this.sampleRate);
    const startTime = _clamp(chosenTime, this.track.getStartTime(), this.track.getEndTime());

    this.track.ee.emit('select', startTime, startTime, this.track);
  }

  static getClass() {
    return '.state-select';
  }

  static getEvents() {
    return ['mousedown'];
  }
}
