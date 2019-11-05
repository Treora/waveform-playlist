import _clamp from 'lodash.clamp';
import { pixelsToSeconds } from '../../utils/conversions';

export default class {
  constructor(track) {
    this.track = track;
    this.active = false;
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

  complete(x) {
    this.emitSelection(x);
    this.active = false;
  }

  mousedown(e) {
    if (e.button !== 0) return; // Only respond to main mouse button

    e.preventDefault();
    this.active = true;

    this.startX = e.offsetX;
    const chosenTime = pixelsToSeconds(this.startX, this.samplesPerPixel, this.sampleRate);
    const startTime = _clamp(chosenTime, this.track.getStartTime(), this.track.getEndTime());

    this.track.ee.emit('select', startTime, startTime, this.track);
  }

  mousemove(e) {
    if (this.active) {
      e.preventDefault();
      this.emitSelection(e.offsetX);
    }
  }

  mouseup(e) {
    if (this.active) {
      e.preventDefault();
      this.complete(e.offsetX);
    }
  }

  mouseleave(e) {
    if (this.active) {
      e.preventDefault();
      this.complete(e.offsetX);
    }
  }

  static getClass() {
    return '.state-select';
  }

  static getEvents() {
    return ['mousedown', 'mousemove', 'mouseup', 'mouseleave'];
  }
}
