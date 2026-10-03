import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { validateLevel } from './LevelValidator.js';
import {
  PALETTE,
  ROUTINE_ACTIONS,
  INTERACTION_TYPES,
  createEnvironmentObject,
  uniqueId,
} from './EditorCatalog.js';

const clone = value =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

export class EditorController {
  constructor({
    root,
    renderer,
    session,
    loader,
    onPlay,
    onRebuild,
    onReplaceLevel,
  }) {
    this.root = root;
    this.renderer = renderer;
    this.camera = renderer.camera;
    this.canvas = renderer.renderer.domElement;
    this.session = session;
    this.loader = loader;
    this.onPlay = onPlay;
    this.onRebuild = onRebuild;
    this.onReplaceLevel = onReplaceLevel;

    this.level = null;
    this.officeLevel = null;
    this.active = false;
    this.selectedRef = null;
    this.selectedObject = null;
    this.linkSourceId = null;
    this.helperGroup = new THREE.Group();
    this.helperGroup.name = 'EditorHelpers';
    this.renderer.scene.add(this.helperGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.selectableHelpers = [];

    this.orbit = new OrbitControls(
      this.camera,
      this.canvas,
    );
    this.orbit.enabled = false;
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.maxPolarAngle =
      Math.PI * 0.48;
    this.orbit.minDistance = 4;
    this.orbit.maxDistance = 32;

    this.transform = new TransformControls(
      this.camera,
      this.canvas,
    );
    this.transform.enabled = false;
    this.transform.setMode('translate');
    this.transform.showY = false;
    this.renderer.scene.add(this.transform.getHelper());

    this.transform.addEventListener(
      'dragging-changed',
      event => {
        this.orbit.enabled =
          this.active && !event.value;
      },
    );

    this.transform.addEventListener(
      'objectChange',
      () => {
        this.writeSelectedTransform();
        this.session.markDirty();
        this.renderInspector();
      },
    );

    this.transform.addEventListener(
      'mouseUp',
      () => {
        this.commitMutation({
          rebuild: true,
          preserve:
            this.selectedRef,
        });
      },
    );

    this.onCanvasPointerDown =
      this.onCanvasPointerDown.bind(this);

    this.canvas.addEventListener(
      'pointerdown',
      this.onCanvasPointerDown,
    );

    this.buildUi();
    this.bindUi();
  }

  buildUi() {
    this.root.innerHTML = `
      <div class="editor-ui">
        <header class="editor-toolbar">
          <div class="editor-toolbar-group">
            <button class="editor-primary" data-editor-action="play">▶ PLAY</button>
            <button data-editor-action="translate">移动</button>
            <button data-editor-action="rotate">旋转</button>
          </div>

          <div class="editor-toolbar-group editor-level-picker">
            <select data-editor-levels></select>
            <button data-editor-action="load">加载</button>
          </div>

          <div class="editor-toolbar-group">
            <button data-editor-action="save">Save Draft</button>
            <button data-editor-action="export">Export</button>
            <button data-editor-action="import">Import</button>
            <button data-editor-action="duplicate-level">Duplicate</button>
            <button data-editor-action="revert">Revert</button>
            <button class="editor-publish" data-editor-action="publish">Publish</button>
          </div>

          <div class="editor-validation-pill" data-editor-validation-pill>
            未验证
          </div>
        </header>

        <aside class="editor-palette" data-editor-palette></aside>

        <aside class="editor-inspector">
          <div data-editor-inspector></div>
        </aside>

        <section class="editor-validation-panel" data-editor-validation></section>

        <div class="editor-help">
          点击选择 · W 移动 · E 旋转 · Delete 删除 · Ctrl/Cmd+D 复制 · Tab 试玩
        </div>

        <input type="file" accept="application/json" data-editor-import hidden />

        <dialog class="editor-publish-dialog" data-editor-publish-dialog>
          <form method="dialog" data-editor-publish-form>
            <p class="editor-kicker">PUBLISH TO GITHUB</p>
            <h3>发布关卡</h3>
            <p>需要一个只对 guopanqi/cowandhorse 有 Contents 写权限的 fine-grained token。Token 只用于这次请求。</p>
            <label>
              GitHub token
              <input type="password" autocomplete="off" data-editor-token required />
            </label>
            <label>
              Commit message
              <input type="text" data-editor-commit />
            </label>
            <div class="editor-dialog-actions">
              <button value="cancel">取消</button>
              <button value="default" class="editor-primary" data-editor-publish-confirm>Publish</button>
            </div>
            <p data-editor-publish-status></p>
          </form>
        </dialog>
      </div>
    `;

    const paletteRoot =
      this.root.querySelector(
        '[data-editor-palette]',
      );

    paletteRoot.innerHTML =
      PALETTE.map(
        group => `
          <section class="editor-palette-group">
            <h3>${group.title}</h3>
            <div class="editor-palette-grid">
              ${group.items
                .map(
                  ([type, label]) => `
                    <button data-editor-add="${type}">
                      ${label}
                    </button>
                  `,
                )
                .join('')}
            </div>
          </section>
        `,
      ).join('') +
      `
        <section class="editor-palette-group">
          <h3>AI</h3>
          <label class="editor-field">
            NPC
            <select data-editor-routine-npc></select>
          </label>
          <p class="editor-mini-note">
            “NPC 行为点”会添加到这里选中的角色日程末尾。
          </p>
        </section>
      `;
  }

  bindUi() {
    this.ui = {
      levels:
        this.root.querySelector(
          '[data-editor-levels]',
        ),
      palette:
        this.root.querySelector(
          '[data-editor-palette]',
        ),
      inspector:
        this.root.querySelector(
          '[data-editor-inspector]',
        ),
      validation:
        this.root.querySelector(
          '[data-editor-validation]',
        ),
      validationPill:
        this.root.querySelector(
          '[data-editor-validation-pill]',
        ),
      import:
        this.root.querySelector(
          '[data-editor-import]',
        ),
      routineNpc:
        this.root.querySelector(
          '[data-editor-routine-npc]',
        ),
      publishDialog:
        this.root.querySelector(
          '[data-editor-publish-dialog]',
        ),
      token:
        this.root.querySelector(
          '[data-editor-token]',
        ),
      commit:
        this.root.querySelector(
          '[data-editor-commit]',
        ),
      publishStatus:
        this.root.querySelector(
          '[data-editor-publish-status]',
        ),
    };

    this.root.addEventListener(
      'click',
      event => {
        const action =
          event.target.closest(
            '[data-editor-action]',
          )?.dataset
            .editorAction;

        if (action) {
          this.handleAction(action);
          return;
        }

        const add =
          event.target.closest(
            '[data-editor-add]',
          )?.dataset
            .editorAdd;

        if (add) {
          this.addFromPalette(add);
          return;
        }

        if (
          event.target.closest(
            '[data-editor-delete]',
          )
        ) {
          this.deleteSelected();
          return;
        }

        if (
          event.target.closest(
            '[data-editor-duplicate]',
          )
        ) {
          this.duplicateSelected();
          return;
        }

        if (
          event.target.closest(
            '[data-editor-link]',
          )
        ) {
          this.startLink();
        }
      },
    );

    this.root.addEventListener(
      'change',
      event => {
        if (
          event.target.matches(
            '[data-editor-level-field]',
          )
        ) {
          const field =
            event.target.dataset
              .editorLevelField;

          this.level[field] =
            event.target.value;

          this.session.markDirty();
          this.renderInspector();
          return;
        }

        if (
          event.target.matches(
            '[data-editor-param]',
          )
        ) {
          this.applyInspectorParam(
            event.target,
          );
          return;
        }

        if (
          event.target.matches(
            '[data-editor-field]',
          )
        ) {
          this.applyInspectorField(
            event.target,
          );
        }
      },
    );

    this.ui.import.addEventListener(
      'change',
      async () => {
        const file =
          this.ui.import
            .files?.[0];

        if (!file) return;

        try {
          const level =
            await this.session
              .importFile(file);

          await this.onReplaceLevel(
            level,
          );
        } catch (error) {
          this.setStatus(
            error.message,
            'error',
          );
        } finally {
          this.ui.import.value = '';
        }
      },
    );

    this.root
      .querySelector(
        '[data-editor-publish-confirm]',
      )
      .addEventListener(
        'click',
        async event => {
          event.preventDefault();
          await this.publish();
        },
      );

    window.addEventListener(
      'keydown',
      event => {
        if (!this.active) return;

        const tag =
          document.activeElement
            ?.tagName;

        if (
          tag === 'INPUT' ||
          tag === 'SELECT' ||
          tag === 'TEXTAREA'
        ) {
          return;
        }

        if (event.code === 'Tab') {
          event.preventDefault();
          this.onPlay?.();
        } else if (
          event.code === 'KeyW'
        ) {
          this.setTransformMode(
            'translate',
          );
        } else if (
          event.code === 'KeyE'
        ) {
          this.setTransformMode(
            'rotate',
          );
        } else if (
          event.code === 'Delete' ||
          event.code === 'Backspace'
        ) {
          this.deleteSelected();
        } else if (
          (event.metaKey ||
            event.ctrlKey) &&
          event.code === 'KeyD'
        ) {
          event.preventDefault();
          this.duplicateSelected();
        }
      },
    );
  }

  async activate() {
    this.active = true;
    this.root.classList.add(
      'active',
    );
    this.orbit.enabled = true;
    this.transform.enabled = true;

    this.camera.position.set(
      0,
      16,
      13,
    );
    this.orbit.target.set(
      0,
      0,
      -0.5,
    );
    this.orbit.update();

    await this.refreshLevelList();
    this.validate();
  }

  deactivate() {
    this.active = false;
    this.root.classList.remove(
      'active',
    );
    this.orbit.enabled = false;
    this.transform.enabled = false;
    this.transform.detach();
    this.selectedObject = null;
  }

  update() {
    if (this.active) {
      this.orbit.update();
    }
  }

  bindLevel(
    level,
    officeLevel,
    preserveRef = null,
  ) {
    this.level = level;
    this.officeLevel = officeLevel;

    this.populateNpcPicker();
    this.rebuildHelpers();

    if (preserveRef) {
      this.selectRef(preserveRef);
    } else {
      this.clearSelection();
    }

    this.validate();
  }

  populateNpcPicker() {
    if (!this.ui?.routineNpc) return;

    this.ui.routineNpc.innerHTML =
      (this.level?.npcs ?? [])
        .map(
          npc =>
            `<option value="${npc.id}">${npc.role ?? npc.id}</option>`,
        )
        .join('');
  }

  clearHelpers() {
    this.transform.detach();

    this.helperGroup.traverse(
      object => {
        object.geometry?.dispose?.();

        if (
          object.material &&
          !Array.isArray(
            object.material,
          )
        ) {
          object.material.dispose?.();
        }
      },
    );

    this.helperGroup.clear();
    this.selectableHelpers = [];
  }

  makeHandle({
    position,
    color,
    ref,
    size = 0.16,
    shape = 'sphere',
  }) {
    const geometry =
      shape === 'box'
        ? new THREE.BoxGeometry(
            size * 1.7,
            size * 1.7,
            size * 1.7,
          )
        : new THREE.SphereGeometry(
            size,
            12,
            8,
          );

    const material =
      new THREE.MeshBasicMaterial({
        color,
        depthTest: false,
        transparent: true,
        opacity: 0.92,
      });

    const mesh =
      new THREE.Mesh(
        geometry,
        material,
      );

    mesh.position.set(...position);
    mesh.renderOrder = 20;
    mesh.userData.editorRef = ref;
    this.helperGroup.add(mesh);
    this.selectableHelpers.push(mesh);
    return mesh;
  }

  addLine(points, color, opacity = 0.55) {
    if (points.length < 2) return;

    const geometry =
      new THREE.BufferGeometry()
        .setFromPoints(
          points.map(
            point =>
              new THREE.Vector3(
                ...point,
              ),
          ),
        );

    const material =
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthTest: false,
      });

    const line =
      new THREE.Line(
        geometry,
        material,
      );

    line.renderOrder = 15;
    this.helperGroup.add(line);
  }

  rebuildHelpers() {
    this.clearHelpers();

    if (!this.level) return;

    this.makeHandle({
      position:
        this.level.playerSpawn,
      color: 0x62d58d,
      size: 0.22,
      shape: 'box',
      ref: {
        kind: 'spawn',
      },
    });

    this.makeHandle({
      position:
        this.level.extraction
          .position,
      color: 0xffb85e,
      size: 0.23,
      shape: 'box',
      ref: {
        kind: 'extraction',
      },
    });

    const navById =
      new Map();

    for (
      const node of
      this.level.navigation
        ?.nodes ?? []
    ) {
      const handle =
        this.makeHandle({
          position:
            node.position,
          color: 0x55c9e8,
          size: 0.11,
          ref: {
            kind: 'nav',
            id: node.id,
          },
        });

      navById.set(
        node.id,
        handle.position,
      );
    }

    for (
      const [
        a,
        b,
      ] of
      this.level.navigation
        ?.edges ?? []
    ) {
      const pa =
        navById.get(a);
      const pb =
        navById.get(b);

      if (pa && pb) {
        this.addLine(
          [
            [
              pa.x,
              0.055,
              pa.z,
            ],
            [
              pb.x,
              0.055,
              pb.z,
            ],
          ],
          0x55c9e8,
          0.32,
        );
      }
    }

    const npcColors = [
      0xf0b45f,
      0xe2766a,
      0xb991e8,
      0x75cfb1,
    ];

    (this.level.npcs ?? [])
      .forEach(
        (npc, npcIndex) => {
          const color =
            npcColors[
              npcIndex %
                npcColors.length
            ];

          const points =
            npc.routine?.map(
              node =>
                node.position,
            ) ?? [];

          if (
            points.length > 1
          ) {
            this.addLine(
              [
                ...points,
                points[0],
              ],
              color,
              0.72,
            );
          }

          (npc.routine ?? [])
            .forEach(
              (
                node,
                index,
              ) => {
                this.makeHandle({
                  position:
                    node.position,
                  color,
                  size: 0.14,
                  shape: 'box',
                  ref: {
                    kind:
                      'routine',
                    npcId:
                      npc.id,
                    index,
                  },
                });
              },
            );
        },
      );

    for (
      const interaction of
      this.level.interactions ?? []
    ) {
      const color =
        interaction.type ===
        'fakeWork'
          ? 0x74d9a4
          : interaction.type ===
              'hideSpot'
            ? 0x8da7ff
            : 0xf17bc6;

      this.makeHandle({
        position:
          interaction.position,
        color,
        size: 0.16,
        shape: 'box',
        ref: {
          kind:
            'interaction',
          id:
            interaction.id,
        },
      });
    }
  }

  environmentIds() {
    return new Set(
      (this.level.environment ?? [])
        .map(
          object => object.id,
        ),
    );
  }

  insertionPoint() {
    return this.orbit.target.clone();
  }

  addFromPalette(type) {
    const point =
      this.insertionPoint();

    if (
      type.startsWith(
        'interaction:',
      )
    ) {
      const interactionType =
        type.split(':')[1];

      const ids =
        new Set(
          (this.level.interactions ?? [])
            .map(
              item => item.id,
            ),
        );

      const id =
        uniqueId(
          interactionType,
          ids,
        );

      this.level.interactions.push({
        id,
        type:
          interactionType,
        position: [
          point.x,
          0,
          point.z,
        ],
        enabled: true,
      });

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind:
            'interaction',
          id,
        },
      });

      return;
    }

    if (type === 'nav') {
      const ids =
        new Set(
          (this.level.navigation
            ?.nodes ?? [])
            .map(
              node => node.id,
            ),
        );

      const id =
        uniqueId('N', ids);

      this.level.navigation.nodes.push({
        id,
        position: [
          point.x,
          0,
          point.z,
        ],
      });

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind: 'nav',
          id,
        },
      });

      return;
    }

    if (type === 'routine') {
      const npcId =
        this.ui.routineNpc.value;

      const npc =
        this.level.npcs.find(
          item =>
            item.id === npcId,
        );

      if (!npc) return;

      npc.routine ??= [];

      npc.routine.push({
        position: [
          point.x,
          0,
          point.z,
        ],
        action: 'inspect',
        duration: 2,
        facing: [0, 0, 1],
      });

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind: 'routine',
          npcId,
          index:
            npc.routine.length -
            1,
        },
      });

      return;
    }

    const object =
      createEnvironmentObject(
        type,
        point,
        this.environmentIds(),
      );

    this.level.environment.push(
      object,
    );

    this.commitMutation({
      rebuild: true,
      preserve: {
        kind: 'environment',
        id: object.id,
      },
    });
  }

  onCanvasPointerDown(event) {
    if (
      !this.active ||
      this.transform.dragging
    ) {
      return;
    }

    const rect =
      this.canvas
        .getBoundingClientRect();

    this.pointer.x =
      ((event.clientX -
        rect.left) /
        rect.width) *
        2 -
      1;

    this.pointer.y =
      -(
        (event.clientY -
          rect.top) /
        rect.height
      ) *
        2 +
      1;

    this.raycaster.setFromCamera(
      this.pointer,
      this.camera,
    );

    const targets = [
      ...this.selectableHelpers,
    ];

    for (
      const root of
      this.officeLevel?.builder
        ?.objectRoots
        ?.values?.() ?? []
    ) {
      if (
        root.userData
          .editorSelectable !==
        false
      ) {
        targets.push(root);
      }
    }

    const hits =
      this.raycaster
        .intersectObjects(
          targets,
          true,
        );

    if (!hits.length) {
      this.clearSelection();
      return;
    }

    let object =
      hits[0].object;

    while (
      object &&
      !object.userData
        .editorRef &&
      !object.userData
        .levelObjectId
    ) {
      object = object.parent;
    }

    if (!object) return;

    const ref =
      object.userData
        .editorRef ??
      {
        kind: 'environment',
        id:
          object.userData
            .levelObjectId,
      };

    if (
      this.linkSourceId &&
      ref.kind === 'nav' &&
      ref.id !==
        this.linkSourceId
    ) {
      this.completeLink(
        ref.id,
      );
      return;
    }

    this.selectRef(ref);
  }

  selectRef(ref) {
    this.selectedRef =
      clone(ref);

    let object = null;

    if (
      ref.kind ===
      'environment'
    ) {
      object =
        this.officeLevel
          ?.builder
          ?.objectRoots
          ?.get(ref.id);
    } else {
      object =
        this.selectableHelpers
          .find(
            helper =>
              this.refsEqual(
                helper.userData
                  .editorRef,
                ref,
              ),
          );
    }

    this.selectedObject =
      object ?? null;

    if (this.selectedObject) {
      this.transform.attach(
        this.selectedObject,
      );
    } else {
      this.transform.detach();
    }

    this.renderInspector();
  }

  refsEqual(a, b) {
    if (!a || !b) return false;

    return (
      a.kind === b.kind &&
      a.id === b.id &&
      a.npcId === b.npcId &&
      a.index === b.index
    );
  }

  clearSelection() {
    this.selectedRef = null;
    this.selectedObject = null;
    this.transform.detach();
    this.renderInspector();
  }

  selectedData() {
    const ref =
      this.selectedRef;

    if (!ref) return null;

    if (
      ref.kind ===
      'environment'
    ) {
      return this.level.environment
        .find(
          object =>
            object.id === ref.id,
        );
    }

    if (
      ref.kind ===
      'interaction'
    ) {
      return this.level.interactions
        .find(
          item =>
            item.id === ref.id,
        );
    }

    if (ref.kind === 'nav') {
      return this.level.navigation
        .nodes.find(
          node =>
            node.id === ref.id,
        );
    }

    if (
      ref.kind === 'routine'
    ) {
      return this.level.npcs
        .find(
          npc =>
            npc.id ===
            ref.npcId,
        )
        ?.routine?.[
          ref.index
        ];
    }

    if (ref.kind === 'spawn') {
      return {
        position:
          this.level
            .playerSpawn,
      };
    }

    if (
      ref.kind ===
      'extraction'
    ) {
      return this.level
        .extraction;
    }

    return null;
  }

  writeSelectedTransform() {
    if (
      !this.selectedRef ||
      !this.selectedObject
    ) {
      return;
    }

    const data =
      this.selectedData();

    if (!data) return;

    data.position = [
      Number(
        this.selectedObject
          .position.x.toFixed(3),
      ),
      0,
      Number(
        this.selectedObject
          .position.z.toFixed(3),
      ),
    ];

    if (
      this.selectedRef.kind ===
      'environment'
    ) {
      data.rotation =
        Number(
          this.selectedObject
            .rotation.y
            .toFixed(4),
        );
    }
  }

  renderInspector() {
    const root =
      this.ui?.inspector;

    if (!root) return;

    const ref =
      this.selectedRef;

    const data =
      this.selectedData();

    if (!ref || !data) {
      root.innerHTML = `
        <p class="editor-kicker">LEVEL</p>
        <h2>${this.level?.name ?? 'No Level'}</h2>
        <label class="editor-field">
          名称
          <input data-editor-level-field="name" value="${this.escape(this.level?.name ?? '')}">
        </label>
        <p class="editor-mini-note">
          从左侧放置对象，或直接点击场景里的对象、蓝色导航点、彩色 NPC 行为点。
        </p>
      `;
      return;
    }

    const position =
      data.position ?? [
        0,
        0,
        0,
      ];

    const rotation =
      ref.kind ===
      'environment'
        ? (
            (data.rotation ?? 0) *
            180 /
            Math.PI
          ).toFixed(1)
        : null;

    let specific = '';

    if (
      ref.kind ===
      'environment'
    ) {
      const fields = [];

      if (Array.isArray(data.size)) {
        ['W', 'H', 'D'].forEach(
          (label, index) => {
            fields.push(
              `<label>${label}<input type="number" min="0.05" step="0.05" data-editor-param="size.${index}" value="${data.size[index] ?? 1}"></label>`,
            );
          },
        );
      }

      for (
        const key of [
          'width',
          'depth',
          'height',
          'partitionHeight',
          'doorWidth',
        ]
      ) {
        if (
          data.params?.[key] != null
        ) {
          fields.push(
            `<label>${key}<input type="number" min="0.05" step="0.05" data-editor-param="params.${key}" value="${data.params[key]}"></label>`,
          );
        }
      }

      if (fields.length) {
        specific = `
          <p class="editor-kicker editor-section-kicker">DIMENSIONS</p>
          <div class="editor-dimension-grid">
            ${fields.join('')}
          </div>
        `;
      }
    }

    if (
      ref.kind ===
      'routine'
    ) {
      specific = `
        <label class="editor-field">
          Action
          <select data-editor-field="action">
            ${ROUTINE_ACTIONS
              .map(
                action =>
                  `<option value="${action}" ${data.action === action ? 'selected' : ''}>${action}</option>`,
              )
              .join('')}
          </select>
        </label>
        <label class="editor-field">
          Duration
          <input type="number" min="0" step="0.1" data-editor-field="duration" value="${data.duration ?? 0}">
        </label>
      `;
    }

    if (
      ref.kind ===
      'interaction'
    ) {
      specific = `
        <label class="editor-field">
          Type
          <select data-editor-field="type">
            ${INTERACTION_TYPES
              .map(
                type =>
                  `<option value="${type}" ${data.type === type ? 'selected' : ''}>${type}</option>`,
              )
              .join('')}
          </select>
        </label>
      `;
    }

    const canDelete =
      ![
        'spawn',
        'extraction',
      ].includes(ref.kind);

    const canDuplicate =
      [
        'environment',
        'interaction',
        'routine',
      ].includes(ref.kind);

    root.innerHTML = `
      <p class="editor-kicker">${ref.kind.toUpperCase()}</p>
      <h2>${this.escape(data.id ?? ref.id ?? ref.npcId ?? ref.kind)}</h2>

      <div class="editor-coordinates">
        <label>
          X
          <input type="number" step="0.1" data-editor-field="x" value="${position[0].toFixed(2)}">
        </label>
        <label>
          Z
          <input type="number" step="0.1" data-editor-field="z" value="${position[2].toFixed(2)}">
        </label>
      </div>

      ${rotation == null ? '' : `
        <label class="editor-field">
          Rotation °
          <input type="number" step="15" data-editor-field="rotation" value="${rotation}">
        </label>
      `}

      ${specific}

      ${ref.kind === 'nav' ? `
        <button data-editor-link>
          ${this.linkSourceId === ref.id ? '选择目标节点…' : '连接到另一个导航点'}
        </button>
      ` : ''}

      <div class="editor-inspector-actions">
        ${canDuplicate ? '<button data-editor-duplicate>复制</button>' : ''}
        ${canDelete ? '<button class="danger" data-editor-delete>删除</button>' : ''}
      </div>
    `;
  }

  applyInspectorParam(input) {
    const data =
      this.selectedData();

    if (!data) return;

    const path =
      input.dataset.editorParam
        .split('.');

    const value =
      Number(input.value);

    if (path[0] === 'size') {
      data.size ??= [1, 1, 1];
      data.size[
        Number(path[1])
      ] = value;
    } else if (
      path[0] === 'params'
    ) {
      data.params ??= {};
      data.params[path[1]] =
        value;
    }

    this.commitMutation({
      rebuild: true,
      preserve:
        this.selectedRef,
    });
  }

  applyInspectorField(input) {
    const ref =
      this.selectedRef;

    const data =
      this.selectedData();

    if (!ref || !data) return;

    const field =
      input.dataset.editorField;

    if (
      field === 'x' ||
      field === 'z'
    ) {
      const index =
        field === 'x'
          ? 0
          : 2;

      data.position[index] =
        Number(input.value);

      this.commitMutation({
        rebuild: true,
        preserve: ref,
      });
      return;
    }

    if (
      field ===
      'rotation'
    ) {
      data.rotation =
        Number(input.value) *
        Math.PI /
        180;

      this.commitMutation({
        rebuild: true,
        preserve: ref,
      });
      return;
    }

    if (
      field ===
      'duration'
    ) {
      data.duration =
        Number(input.value);
    } else {
      data[field] =
        input.value;
    }

    this.commitMutation({
      rebuild: false,
      preserve: ref,
    });
  }

  setTransformMode(mode) {
    this.transform.setMode(mode);

    this.transform.showX = true;
    this.transform.showZ = true;
    this.transform.showY = false;

    if (mode === 'rotate') {
      this.transform.showX = false;
      this.transform.showZ = false;
      this.transform.showY = true;
    }
  }

  startLink() {
    if (
      this.selectedRef?.kind !==
      'nav'
    ) {
      return;
    }

    this.linkSourceId =
      this.selectedRef.id;

    this.renderInspector();
    this.setStatus(
      '选择第二个导航点建立连线',
      'info',
    );
  }

  completeLink(targetId) {
    const a =
      this.linkSourceId;
    const b =
      targetId;

    this.linkSourceId = null;

    const exists =
      this.level.navigation.edges
        .some(
          edge =>
            (edge[0] === a &&
              edge[1] === b) ||
            (edge[0] === b &&
              edge[1] === a),
        );

    if (!exists) {
      this.level.navigation.edges
        .push([a, b]);
    }

    this.commitMutation({
      rebuild: true,
      preserve: {
        kind: 'nav',
        id: b,
      },
    });
  }

  deleteSelected() {
    const ref =
      this.selectedRef;

    if (
      !ref ||
      ['spawn', 'extraction']
        .includes(ref.kind)
    ) {
      return;
    }

    if (
      ref.kind ===
      'environment'
    ) {
      this.level.environment =
        this.level.environment
          .filter(
            object =>
              object.id !==
              ref.id,
          );

      this.level.interactions =
        this.level.interactions
          .filter(
            interaction =>
              interaction
                .linkedObjectId !==
              ref.id,
          );
    } else if (
      ref.kind ===
      'interaction'
    ) {
      this.level.interactions =
        this.level.interactions
          .filter(
            item =>
              item.id !== ref.id,
          );
    } else if (
      ref.kind === 'nav'
    ) {
      this.level.navigation.nodes =
        this.level.navigation.nodes
          .filter(
            node =>
              node.id !== ref.id,
          );

      this.level.navigation.edges =
        this.level.navigation.edges
          .filter(
            edge =>
              !edge.includes(
                ref.id,
              ),
          );
    } else if (
      ref.kind ===
      'routine'
    ) {
      const npc =
        this.level.npcs
          .find(
            item =>
              item.id ===
              ref.npcId,
          );

      npc?.routine?.splice(
        ref.index,
        1,
      );
    }

    this.selectedRef = null;

    this.commitMutation({
      rebuild: true,
      preserve: null,
    });
  }

  duplicateSelected() {
    const ref =
      this.selectedRef;

    if (!ref) return;

    if (
      ref.kind ===
      'environment'
    ) {
      const source =
        this.selectedData();

      if (!source) return;

      const copy =
        clone(source);

      copy.id =
        uniqueId(
          source.type,
          this.environmentIds(),
        );

      copy.position[0] += 0.6;
      copy.position[2] += 0.6;

      this.level.environment.push(
        copy,
      );

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind: 'environment',
          id: copy.id,
        },
      });

      return;
    }

    if (
      ref.kind ===
      'interaction'
    ) {
      const source =
        this.selectedData();

      const ids =
        new Set(
          this.level.interactions
            .map(
              item => item.id,
            ),
        );

      const copy =
        clone(source);

      copy.id =
        uniqueId(
          source.type,
          ids,
        );

      copy.position[0] += 0.5;

      this.level.interactions.push(
        copy,
      );

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind:
            'interaction',
          id: copy.id,
        },
      });

      return;
    }

    if (
      ref.kind ===
      'routine'
    ) {
      const npc =
        this.level.npcs.find(
          item =>
            item.id ===
            ref.npcId,
        );

      const source =
        npc?.routine?.[
          ref.index
        ];

      if (!source) return;

      const copy =
        clone(source);

      copy.position[0] += 0.5;

      npc.routine.splice(
        ref.index + 1,
        0,
        copy,
      );

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind: 'routine',
          npcId: ref.npcId,
          index:
            ref.index + 1,
        },
      });
    }
  }

  async commitMutation({
    rebuild = false,
    preserve = null,
  } = {}) {
    this.session.markDirty();

    if (rebuild) {
      await this.onRebuild(
        this.level,
        preserve,
      );
    } else {
      this.rebuildHelpers();
      this.selectRef(
        preserve ??
          this.selectedRef,
      );
      this.validate();
    }
  }

  validate() {
    if (!this.level) return;

    const result =
      validateLevel(
        this.level,
      );

    const pill =
      this.ui
        .validationPill;

    pill.textContent =
      result.valid
        ? `✓ Valid · ${result.metrics.objects} objects`
        : `✕ ${result.errors.length} errors`;

    pill.className =
      `editor-validation-pill ${result.valid ? 'valid' : 'invalid'}`;

    const rows = [
      ...result.errors
        .slice(0, 8)
        .map(
          message =>
            `<li class="error">${this.escape(message)}</li>`,
        ),
      ...result.warnings
        .slice(0, 4)
        .map(
          message =>
            `<li class="warning">${this.escape(message)}</li>`,
        ),
    ];

    this.ui.validation.innerHTML =
      rows.length
        ? `
            <details>
              <summary>Validation</summary>
              <ul>${rows.join('')}</ul>
            </details>
          `
        : '';

    return result;
  }

  async handleAction(action) {
    try {
      if (action === 'play') {
        this.onPlay?.();
      } else if (
        action === 'translate'
      ) {
        this.setTransformMode(
          'translate',
        );
      } else if (
        action === 'rotate'
      ) {
        this.setTransformMode(
          'rotate',
        );
      } else if (
        action === 'save'
      ) {
        this.session.saveDraft();
        this.setStatus(
          '草稿已保存到浏览器',
          'success',
        );
        await this.refreshLevelList();
      } else if (
        action === 'export'
      ) {
        this.session.downloadJson();
      } else if (
        action === 'import'
      ) {
        this.ui.import.click();
      } else if (
        action ===
        'duplicate-level'
      ) {
        await this.duplicateLevel();
      } else if (
        action === 'revert'
      ) {
        const level =
          await this.session
            .revertPublished();

        await this.onReplaceLevel(
          level,
        );

        this.setStatus(
          '已恢复正式发布版本',
          'success',
        );
      } else if (
        action === 'publish'
      ) {
        this.ui.commit.value =
          `level: update ${this.level.id} from graybox editor`;
        this.ui.publishStatus.textContent =
          '';
        this.ui.publishDialog.showModal();
      } else if (
        action === 'load'
      ) {
        await this.loadSelectedLevel();
      }
    } catch (error) {
      this.setStatus(
        error.message,
        'error',
      );
    }
  }

  async duplicateLevel() {
    const defaultId =
      `${this.level.id}-copy`;

    const id =
      prompt(
        'New level id',
        defaultId,
      );

    if (!id) return;

    const name =
      prompt(
        'Level name',
        `${this.level.name} Copy`,
      );

    const level =
      this.session.duplicate({
        id:
          id
            .trim()
            .replace(
              /[^a-zA-Z0-9-_]/g,
              '-',
            ),
        name:
          name?.trim() ||
          id,
      });

    await this.onReplaceLevel(
      level,
    );

    await this.refreshLevelList();
  }

  async refreshLevelList() {
    const published =
      await this.loader
        .listPublished()
        .catch(() => []);

    const drafts =
      this.session
        .listDrafts();

    const options = [];

    for (const item of published) {
      options.push(
        `<option value="published:${item.id}">✓ ${this.escape(item.name)} · ${item.id}</option>`,
      );
    }

    for (const item of drafts) {
      options.push(
        `<option value="draft:${item.id}">● Draft · ${this.escape(item.name)} · ${item.id}</option>`,
      );
    }

    this.ui.levels.innerHTML =
      options.join('');

    const current =
      this.level?.id;

    const draftValue =
      `draft:${current}`;
    const publishedValue =
      `published:${current}`;

    if (
      drafts.some(
        item =>
          item.id === current,
      )
    ) {
      this.ui.levels.value =
        draftValue;
    } else {
      this.ui.levels.value =
        publishedValue;
    }
  }

  async loadSelectedLevel() {
    const [
      source,
      id,
    ] =
      this.ui.levels
        .value.split(':');

    let level;

    if (source === 'draft') {
      level =
        this.session
          .loadDraft(id);
    } else {
      level =
        await this.loader
          .loadPublished(id);
    }

    if (!level) return;

    this.session.setLevel(
      level,
    );

    await this.onReplaceLevel(
      this.session.level,
    );
  }

  async publish() {
    const validation =
      this.validate();

    if (!validation.valid) {
      this.ui.publishStatus.textContent =
        '发布被阻止：先修复 Validation errors。';
      return;
    }

    const token =
      this.ui.token.value.trim();

    const message =
      this.ui.commit.value.trim();

    this.ui.publishStatus.textContent =
      'Publishing…';

    try {
      const result =
        await this.session
          .publishToGitHub({
            token,
            message,
          });

      this.ui.publishStatus.textContent =
        `Published: ${result.path}`;

      this.ui.token.value = '';

      this.setStatus(
        '已提交 GitHub，Actions 会自动验证并部署 Pages',
        'success',
      );

      await this.refreshLevelList();

      setTimeout(
        () =>
          this.ui
            .publishDialog
            .close(),
        850,
      );
    } catch (error) {
      this.ui.publishStatus.textContent =
        error.message;
    }
  }

  setStatus(message, type = 'info') {
    this.ui.validation.innerHTML =
      `<div class="editor-toast ${type}">${this.escape(message)}</div>`;

    setTimeout(
      () => {
        if (
          this.ui.validation
            .textContent ===
          message
        ) {
          this.validate();
        }
      },
      2200,
    );
  }

  escape(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
