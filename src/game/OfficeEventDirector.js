export class OfficeEventDirector {
  constructor(data) {
    this.data = data;
    this.fired = new Set();
  }

  handleExtractionCalled(agents) {
    if (
      this.fired.has('extraction-call')
    ) {
      return;
    }

    this.fired.add('extraction-call');

    const event =
      this.data.events?.extractionCall;

    if (!event) return;

    const agent =
      agents.find(
        item =>
          item.config.id ===
          event.npcId,
      );

    if (!agent) return;

    agent.triggerInterrupt(
      event.routine,
    );
  }

  reset() {
    this.fired.clear();
  }
}
