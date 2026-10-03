import * as THREE from 'three';

const DEFAULT_RANGE = 0.95;

const PROFILES = {
  fakeWork: {
    pose: 'sit',
    enterLabel: '假装工作',
    activeLabel: '工作中',
    exitLabel: '起身',
  },

  drinkWater: {
    pose: 'tea',
    enterLabel: '喝水',
    activeLabel: '喝水中',
    exitLabel: '离开',
  },

  hideSpot: {
    pose: 'crouch',
    enterLabel: '躲一下',
    activeLabel: '躲藏中',
    exitLabel: '出来',
  },
};

export class SafeInteractionSystem {
  constructor({
    interactions = [],
    player,
    input,
  }) {
    this.player = player;
    this.input = input;

    this.interactions =
      interactions
        .filter(
          interaction =>
            interaction.enabled !==
            false,
        )
        .map(interaction => ({
          ...interaction,
          point:
            new THREE.Vector3(
              ...interaction.position,
            ),
          range:
            interaction.range ??
            DEFAULT_RANGE,
          safe:
            interaction.safe ??
            true,
        }));

    this.active = null;
    this.nearby = null;

    this.reset();
  }

  profile(interaction) {
    return {
      ...(PROFILES[
        interaction?.type
      ] ??
        PROFILES.hideSpot),
      ...(interaction?.presentation ??
        {}),
    };
  }

  reset() {
    this.active = null;
    this.nearby = null;

    const initial =
      this.interactions.find(
        interaction =>
          interaction.startActive,
      );

    if (initial) {
      this.enter(
        initial,
        {
          force: true,
        },
      );
    } else {
      this.player
        .exitInteraction?.();
      this.refreshNearby();
    }
  }

  get isActive() {
    return Boolean(this.active);
  }

  get isSafe() {
    return Boolean(
      this.active?.safe,
    );
  }

  get state() {
    const interaction =
      this.active ??
      this.nearby;

    if (!interaction) {
      return {
        active: false,
        safe: false,
        interaction: null,
        prompt: null,
        label: null,
      };
    }

    const profile =
      this.profile(interaction);

    return {
      active:
        Boolean(this.active),
      safe:
        this.isSafe,
      interaction,
      label:
        this.active
          ? profile.activeLabel
          : profile.enterLabel,
      prompt:
        this.active
          ? 'E · ' + profile.exitLabel
          : 'E · ' + profile.enterLabel,
    };
  }

  refreshNearby() {
    if (this.active) {
      this.nearby = null;
      return;
    }

    let closest = null;
    let bestDistance =
      Infinity;

    for (
      const interaction
      of this.interactions
    ) {
      const distance =
        this.player.position
          .distanceTo(
            interaction.point,
          );

      if (
        distance <=
          interaction.range &&
        distance <
          bestDistance
      ) {
        closest =
          interaction;

        bestDistance =
          distance;
      }
    }

    this.nearby = closest;
  }

  update({
    enabled = true,
    canEnter = true,
  } = {}) {
    if (!enabled) {
      return this.state;
    }

    this.refreshNearby();

    if (
      !this.input.consume(
        'KeyE',
      )
    ) {
      return this.state;
    }

    if (this.active) {
      this.exit();
      this.refreshNearby();
      return this.state;
    }

    if (
      this.nearby &&
      canEnter
    ) {
      this.enter(
        this.nearby,
      );
    }

    return this.state;
  }

  enter(
    interaction,
    {
      force = false,
    } = {},
  ) {
    if (
      !interaction ||
      (
        this.active &&
        !force
      )
    ) {
      return false;
    }

    this.active =
      interaction;

    this.nearby = null;

    const profile =
      this.profile(interaction);

    this.player
      .enterInteraction?.({
        position:
          interaction.position,
        facing:
          interaction.facing ??
          interaction.presentation
            ?.facing ??
          null,
        pose:
          interaction.pose ??
          profile.pose,
      });

    return true;
  }

  exit() {
    if (!this.active) {
      return false;
    }

    this.active = null;

    this.player
      .exitInteraction?.();

    return true;
  }
}
