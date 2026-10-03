export class EncounterSystem {
  constructor({ clock, resources, minigames }) {
    this.clock = clock;
    this.resources = resources;
    this.minigames = minigames;
    this.currentNpc = null;
  }

  begin(npc, onComplete) {
    if (this.currentNpc) return;
    this.currentNpc = npc;

    this.minigames.start(npc.config.minigame || 'logo-bigger', {
      title: npc.config.danger >= 3 ? '老板的新想法' : '临时需求',
      npcRole: npc.config.role,
      penaltyMinutes: npc.config.penaltyMinutes,
      energyCost: npc.config.energyCost,
      onComplete: (result) => {
        const multiplier = result?.success ? 1 : 1.35;
        const minutes = Math.round(npc.config.penaltyMinutes * multiplier);
        this.clock.addMinutes(minutes);
        this.resources.addOvertime(minutes);
        this.resources.spendEnergy(npc.config.energyCost);
        this.currentNpc = null;
        onComplete?.({ minutes });
      }
    });
  }
}
