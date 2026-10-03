import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { validateLevel } from './LevelValidator.js';
import {
  ROUTINE_ACTIONS,
  INTERACTION_TYPES,
  createEnvironmentObject,
  uniqueId,
} from './EditorCatalog.js';

const clone = value =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const SPACE_ITEMS = [
  ['desk', '工位'],
  ['tallCover', '高柜'],
  ['wall', '实墙'],
  ['glassWall', '玻璃墙'],
  ['glassRoom', '玻璃房'],
  ['printer', '打印机'],
  ['counter', '柜台'],
  ['waterCooler', '饮水机'],
  ['plant', '盆栽'],
  ['bench', '长椅'],
];

const GAMEPLAY_ITEMS = [
  ['interaction:fakeWork', '假装工作'],
  ['interaction:hideSpot', '躲藏点'],
  ['interaction:distraction', '诱饵点'],
];

const WORKSPACES = [
  ['layout', '布局'],
  ['ai', 'AI'],
  ['gameplay', '玩法'],
  ['analysis', '分析'],
];

export class EditorController {
  constructor({
    root,
    renderer,
    session,
    loader,
    recorder = null,
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
    this.recorder = recorder;
    this.onPlay = onPlay;
    this.onRebuild = onRebuild;
    this.onReplaceLevel = onReplaceLevel;

    this.level = null;
    this.officeLevel = null;
    this.active = false;
    this.workspace = 'layout';
    this.focusNpcId = null;
    this.selectedRef = null;
    this.selectedObject = null;
    this.linkSourceId = null;
    this.analysisLayers = {
      nav: true,
      routines: true,
      interactions: true,
      runs: true,
    };

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
    this.orbit.maxPolarAngle = Math.PI * 0.48;
    this.orbit.minDistance = 4;
    this.orbit.maxDistance = 32;

    this.transform = new TransformControls(
      this.camera,
      this.canvas,
    );
    this.transform.enabled = false;
    this.transform.setMode('translate');
    this.transform.showY = false;
    this.renderer.scene.add(
      this.transform.getHelper(),
    );

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
        this.updateChrome();
        this.renderInspector();
      },
    );

    this.transform.addEventListener(
      'mouseUp',
      () => {
        this.commitMutation({
          rebuild: true,
          preserve: this.selectedRef,
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
        <header class="editor-toolbar editor-toolbar-v2">
          <button class="editor-play" data-editor-action="play" type="button">
            <span>▶</span> PLAY
          </button>

          <nav class="editor-workspaces" aria-label="编辑工作区">
            ${WORKSPACES.map(
              ([id, label]) => `
                <button
                  type="button"
                  data-editor-workspace="${id}"
                  class="${id === this.workspace ? 'active' : ''}"
                >
                  ${label}
                </button>
              `,
            ).join('')}
          </nav>

          <div class="editor-level-switcher">
            <span class="editor-toolbar-label">关卡</span>
            <select data-editor-levels></select>
            <button type="button" data-editor-action="load">打开</button>
          </div>

          <div class="editor-toolbar-spacer"></div>

          <button class="editor-save" data-editor-action="save" type="button">
            <span data-editor-save-label>保存草稿</span>
          </button>

          <button class="editor-publish-v2" data-editor-action="publish" type="button">
            <span class="editor-github-dot" data-github-dot></span>
            发布
          </button>

          <details class="editor-more" data-editor-more>
            <summary aria-label="更多操作">•••</summary>
            <div class="editor-more-menu">
              <button type="button" data-editor-action="export">导出 JSON</button>
              <button type="button" data-editor-action="import">导入 JSON</button>
              <button type="button" data-editor-action="duplicate-level">复制关卡</button>
              <button type="button" data-editor-action="revert">恢复正式版</button>
              <button type="button" data-editor-action="clear-runs">清除试玩轨迹</button>
            </div>
          </details>

          <button class="editor-validation-pill" data-editor-validation-pill data-editor-action="show-validation" type="button">
            未验证
          </button>
        </header>

        <aside class="editor-tool-panel">
          <div class="editor-panel-heading">
            <div>
              <p class="editor-kicker" data-editor-workspace-kicker>LAYOUT</p>
              <h2 data-editor-workspace-title>布局</h2>
            </div>
            <div class="editor-transform-toggle">
              <button type="button" data-editor-action="translate" class="active" title="W">移动</button>
              <button type="button" data-editor-action="rotate" title="E">旋转</button>
            </div>
          </div>

          <div data-editor-tools></div>
        </aside>

        <aside class="editor-inspector editor-inspector-v2">
          <div data-editor-inspector></div>
        </aside>

        <section class="editor-validation-panel editor-validation-v2" data-editor-validation></section>

        <div class="editor-context-help" data-editor-help>
          布局：点击物件选择 · W 移动 · E 旋转 · ⌘/Ctrl+D 复制
        </div>

        <input type="file" accept="application/json" data-editor-import hidden />

        <dialog class="editor-publish-dialog" data-editor-publish-dialog>
          <form method="dialog" data-editor-publish-form>
            <p class="editor-kicker">GITHUB</p>
            <h3>发布关卡</h3>
            <p class="editor-dialog-copy">
              发布会写入 <strong>guopanqi/cowandhorse</strong>，随后 GitHub Actions 自动验证并部署。
            </p>

            <div class="editor-token-row">
              <label>
                GitHub token
                <input type="password" autocomplete="off" data-editor-token required />
              </label>
              <button type="button" data-editor-action="forget-token" class="editor-forget-token">
                忘记 Token
              </button>
            </div>

            <label class="editor-remember-token">
              <input type="checkbox" data-editor-remember-token checked />
              <span>
                长期记住在这台设备
                <small>保存在此浏览器 localStorage；仅建议私人设备使用。</small>
              </span>
            </label>

            <label>
              Commit message
              <input type="text" data-editor-commit />
            </label>

            <div class="editor-dialog-actions">
              <button value="cancel">取消</button>
              <button value="default" class="editor-primary" data-editor-publish-confirm>
                Publish
              </button>
            </div>

            <p class="editor-publish-status" data-editor-publish-status></p>
          </form>
        </dialog>
      </div>
    `;
  }

  bindUi() {
    this.ui = {
      levels: this.root.querySelector('[data-editor-levels]'),
      tools: this.root.querySelector('[data-editor-tools]'),
      inspector: this.root.querySelector('[data-editor-inspector]'),
      validation: this.root.querySelector('[data-editor-validation]'),
      validationPill: this.root.querySelector('[data-editor-validation-pill]'),
      import: this.root.querySelector('[data-editor-import]'),
      workspaceKicker: this.root.querySelector('[data-editor-workspace-kicker]'),
      workspaceTitle: this.root.querySelector('[data-editor-workspace-title]'),
      help: this.root.querySelector('[data-editor-help]'),
      saveLabel: this.root.querySelector('[data-editor-save-label]'),
      githubDot: this.root.querySelector('[data-github-dot]'),
      more: this.root.querySelector('[data-editor-more]'),
      publishDialog: this.root.querySelector('[data-editor-publish-dialog]'),
      token: this.root.querySelector('[data-editor-token]'),
      rememberToken: this.root.querySelector('[data-editor-remember-token]'),
      commit: this.root.querySelector('[data-editor-commit]'),
      publishStatus: this.root.querySelector('[data-editor-publish-status]'),
    };

    this.root.addEventListener(
      'click',
      event => {
        const workspaceButton =
          event.target.closest('[data-editor-workspace]');

        if (workspaceButton) {
          this.setWorkspace(
            workspaceButton.dataset.editorWorkspace,
          );
          return;
        }

        const action =
          event.target.closest('[data-editor-action]')
            ?.dataset.editorAction;

        if (action) {
          this.handleAction(action);
          return;
        }

        const add =
          event.target.closest('[data-editor-add]')
            ?.dataset.editorAdd;

        if (add) {
          this.addFromPalette(add);
          return;
        }

        if (event.target.closest('[data-editor-delete]')) {
          this.deleteSelected();
          return;
        }

        if (event.target.closest('[data-editor-duplicate]')) {
          this.duplicateSelected();
          return;
        }

        if (event.target.closest('[data-editor-link]')) {
          this.startLink();
        }
      },
    );

    this.root.addEventListener(
      'change',
      event => {
        if (
          event.target.matches('[data-editor-routine-npc]')
        ) {
          this.focusNpcId = event.target.value;
          this.rebuildHelpers();
          this.renderToolPanel();
          return;
        }

        if (
          event.target.matches('[data-editor-layer-toggle]')
        ) {
          const key =
            event.target.dataset.editorLayerToggle;

          this.analysisLayers[key] =
            event.target.checked;

          this.rebuildHelpers();
          return;
        }

        if (
          event.target.matches('[data-editor-level-field]')
        ) {
          const field =
            event.target.dataset.editorLevelField;

          this.level[field] =
            event.target.value;

          this.session.markDirty();
          this.updateChrome();
          this.renderInspector();
          return;
        }

        if (
          event.target.matches('[data-editor-param]')
        ) {
          this.applyInspectorParam(event.target);
          return;
        }

        if (
          event.target.matches('[data-editor-field]')
        ) {
          this.applyInspectorField(event.target);
        }
      },
    );

    this.ui.import.addEventListener(
      'change',
      async () => {
        const file = this.ui.import.files?.[0];

        if (!file) return;

        try {
          const level =
            await this.session.importFile(file);

          await this.onReplaceLevel(level);
        } catch (error) {
          this.setStatus(error.message, 'error');
        } finally {
          this.ui.import.value = '';
        }
      },
    );

    this.root
      .querySelector('[data-editor-publish-confirm]')
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
          document.activeElement?.tagName;

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
        } else if (event.code === 'KeyW') {
          this.setTransformMode('translate');
        } else if (event.code === 'KeyE') {
          this.setTransformMode('rotate');
        } else if (
          event.code === 'Delete' ||
          event.code === 'Backspace'
        ) {
          this.deleteSelected();
        } else if (
          (event.metaKey || event.ctrlKey) &&
          event.code === 'KeyD'
        ) {
          event.preventDefault();
          this.duplicateSelected();
        }
      },
    );

    this.updateChrome();
  }

  async activate() {
    this.active = true;
    this.root.classList.add('active');
    this.orbit.enabled = true;
    this.transform.enabled = true;

    this.camera.position.set(0, 16, 13);
    this.orbit.target.set(0, 0, -0.5);
    this.orbit.update();

    await this.refreshLevelList();
    this.renderToolPanel();
    this.updateChrome();
    this.validate();
  }

  deactivate() {
    this.active = false;
    this.root.classList.remove('active');
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

  bindLevel(level, officeLevel, preserveRef = null) {
    this.level = level;
    this.officeLevel = officeLevel;

    if (
      !this.focusNpcId ||
      !this.level.npcs?.some(npc => npc.id === this.focusNpcId)
    ) {
      this.focusNpcId =
        this.level.npcs?.[0]?.id ?? null;
    }

    this.renderToolPanel();
    this.rebuildHelpers();

    if (preserveRef) {
      this.selectRef(preserveRef);
    } else {
      this.clearSelection();
    }

    this.updateChrome();
    this.validate();
  }

  setWorkspace(workspace) {
    if (
      !WORKSPACES.some(([id]) => id === workspace)
    ) {
      return;
    }

    this.workspace = workspace;
    this.linkSourceId = null;

    this.root
      .querySelectorAll('[data-editor-workspace]')
      .forEach(button => {
        button.classList.toggle(
          'active',
          button.dataset.editorWorkspace === workspace,
        );
      });

    const labels = {
      layout: ['LAYOUT', '布局'],
      ai: ['AI', '行为与导航'],
      gameplay: ['GAMEPLAY', '玩法点'],
      analysis: ['ANALYSIS', '分析'],
    };

    this.ui.workspaceKicker.textContent =
      labels[workspace][0];

    this.ui.workspaceTitle.textContent =
      labels[workspace][1];

    const help = {
      layout:
        '布局：点击物件选择 · W 移动 · E 旋转 · ⌘/Ctrl+D 复制',
      ai:
        'AI：蓝色是导航 · 彩色方块是当前 NPC 行为点 · 点两个导航点可连线',
      gameplay:
        '玩法：绿色假装工作 · 蓝色躲藏 · 粉色诱饵',
      analysis:
        '分析：按需叠加导航、NPC 路线、玩法点和最近试玩轨迹',
    };

    this.ui.help.textContent =
      help[workspace];

    this.clearSelection();
    this.renderToolPanel();
    this.rebuildHelpers();
  }

  renderToolPanel() {
    if (!this.ui?.tools || !this.level) return;

    if (this.workspace === 'layout') {
      this.ui.tools.innerHTML = `
        <p class="editor-panel-copy">
          先解决空间。这里只放几何，不显示 AI 调试线。
        </p>
        <div class="editor-tool-grid">
          ${SPACE_ITEMS.map(
            ([type, label]) => `
              <button type="button" data-editor-add="${type}">
                <span class="editor-tool-icon">${this.iconFor(type)}</span>
                <span>${label}</span>
              </button>
            `,
          ).join('')}
        </div>
      `;
      return;
    }

    if (this.workspace === 'ai') {
      this.ui.tools.innerHTML = `
        <p class="editor-panel-copy">
          一次只编辑一个角色。导航网保持可见，其他 NPC 路线隐藏。
        </p>

        <label class="editor-field editor-focus-field">
          当前 NPC
          <select data-editor-routine-npc>
            ${(this.level.npcs ?? [])
              .map(
                npc => `
                  <option value="${npc.id}" ${npc.id === this.focusNpcId ? 'selected' : ''}>
                    ${this.escape(npc.role ?? npc.id)}
                  </option>
                `,
              )
              .join('')}
          </select>
        </label>

        <div class="editor-ai-actions">
          <button type="button" data-editor-add="nav">
            <span class="editor-tool-icon">●</span>
            新导航点
          </button>
          <button type="button" data-editor-add="routine">
            <span class="editor-tool-icon">◆</span>
            新行为点
          </button>
        </div>

        <div class="editor-legend">
          <span><i class="nav"></i>导航</span>
          <span><i class="routine"></i>当前 NPC 路线</span>
        </div>
      `;
      return;
    }

    if (this.workspace === 'gameplay') {
      this.ui.tools.innerHTML = `
        <p class="editor-panel-copy">
          放置能改变潜行决策的办公室行为，不在这里摆家具。
        </p>

        <div class="editor-gameplay-list">
          ${GAMEPLAY_ITEMS.map(
            ([type, label]) => `
              <button type="button" data-editor-add="${type}">
                <span class="editor-tool-icon">${this.iconFor(type)}</span>
                <span>
                  <strong>${label}</strong>
                  <small>${this.descriptionFor(type)}</small>
                </span>
              </button>
            `,
          ).join('')}
        </div>
      `;
      return;
    }

    this.ui.tools.innerHTML = `
      <p class="editor-panel-copy">
        分析模式才显示多层调试信息。平时不要把这些层全部打开。
      </p>

      <div class="editor-analysis-toggles">
        ${[
          ['nav', '导航网'],
          ['routines', '全部 NPC 路线'],
          ['interactions', '玩法点'],
          ['runs', '试玩轨迹'],
        ]
          .map(
            ([key, label]) => `
              <label>
                <input
                  type="checkbox"
                  data-editor-layer-toggle="${key}"
                  ${this.analysisLayers[key] ? 'checked' : ''}
                />
                <span>${label}</span>
              </label>
            `,
          )
          .join('')}
      </div>

      <button
        type="button"
        class="editor-secondary-wide"
        data-editor-action="clear-runs"
      >
        清除试玩轨迹
      </button>
    `;
  }

  iconFor(type) {
    const icons = {
      desk: '▰',
      tallCover: '▮',
      wall: '━',
      glassWall: '┅',
      glassRoom: '□',
      printer: '▣',
      counter: '▱',
      waterCooler: '◧',
      plant: '▲',
      bench: '▬',
      'interaction:fakeWork': '▤',
      'interaction:hideSpot': '◐',
      'interaction:distraction': '✦',
    };

    return icons[type] ?? '•';
  }

  descriptionFor(type) {
    const descriptions = {
      'interaction:fakeWork':
        '坐下装忙，作为社交潜行点',
      'interaction:hideSpot':
        '暂时脱离视线的安全点',
      'interaction:distraction':
        '把领导注意力引向别处',
    };

    return descriptions[type] ?? '';
  }

  updateChrome() {
    if (!this.ui) return;

    if (this.ui.saveLabel) {
      this.ui.saveLabel.textContent =
        this.session.dirty
          ? '保存草稿 •'
          : '保存草稿';
    }

    if (this.ui.githubDot) {
      this.ui.githubDot.classList.toggle(
        'connected',
        this.session.hasRememberedGithubToken(),
      );
    }
  }

  clearHelpers() {
    this.transform.detach();

    this.helperGroup.traverse(
      object => {
        object.geometry?.dispose?.();

        if (
          object.material &&
          !Array.isArray(object.material)
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
              new THREE.Vector3(...point),
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
      new THREE.Line(geometry, material);

    line.renderOrder = 15;
    this.helperGroup.add(line);
  }

  rebuildHelpers() {
    this.clearHelpers();

    if (!this.level) return;

    const showSpawn =
      this.workspace === 'layout' ||
      this.workspace === 'gameplay' ||
      this.workspace === 'analysis';

    const showNav =
      this.workspace === 'ai' ||
      (
        this.workspace === 'analysis' &&
        this.analysisLayers.nav
      );

    const showRoutines =
      this.workspace === 'ai' ||
      (
        this.workspace === 'analysis' &&
        this.analysisLayers.routines
      );

    const showInteractions =
      this.workspace === 'gameplay' ||
      (
        this.workspace === 'analysis' &&
        this.analysisLayers.interactions
      );

    const showRuns =
      this.workspace === 'analysis' &&
      this.analysisLayers.runs;

    if (showSpawn) {
      this.makeHandle({
        position: this.level.playerSpawn,
        color: 0x62d58d,
        size: 0.22,
        shape: 'box',
        ref: { kind: 'spawn' },
      });

      this.makeHandle({
        position: this.level.extraction.position,
        color: 0xffb85e,
        size: 0.23,
        shape: 'box',
        ref: { kind: 'extraction' },
      });
    }

    const navById = new Map();

    if (showNav) {
      for (
        const node of
        this.level.navigation?.nodes ?? []
      ) {
        const handle =
          this.makeHandle({
            position: node.position,
            color: 0x55c9e8,
            size: 0.105,
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
        const [a, b] of
        this.level.navigation?.edges ?? []
      ) {
        const pa = navById.get(a);
        const pb = navById.get(b);

        if (pa && pb) {
          this.addLine(
            [
              [pa.x, 0.055, pa.z],
              [pb.x, 0.055, pb.z],
            ],
            0x55c9e8,
            this.workspace === 'analysis' ? 0.22 : 0.42,
          );
        }
      }
    }

    if (showRoutines) {
      const npcColors = [
        0xf0b45f,
        0xe2766a,
        0xb991e8,
        0x75cfb1,
      ];

      (this.level.npcs ?? []).forEach(
        (npc, npcIndex) => {
          if (
            this.workspace === 'ai' &&
            npc.id !== this.focusNpcId
          ) {
            return;
          }

          const color =
            npcColors[
              npcIndex % npcColors.length
            ];

          const points =
            npc.routine?.map(
              node => node.position,
            ) ?? [];

          if (points.length > 1) {
            this.addLine(
              [...points, points[0]],
              color,
              this.workspace === 'analysis'
                ? 0.46
                : 0.82,
            );
          }

          (npc.routine ?? []).forEach(
            (node, index) => {
              this.makeHandle({
                position: node.position,
                color,
                size: 0.145,
                shape: 'box',
                ref: {
                  kind: 'routine',
                  npcId: npc.id,
                  index,
                },
              });
            },
          );
        },
      );
    }

    if (showRuns) {
      const runs =
        this.recorder?.list(
          this.level.id,
        ) ?? [];

      runs
        .slice(0, 6)
        .reverse()
        .forEach(
          (run, index) => {
            if (
              run.points?.length > 1
            ) {
              this.addLine(
                run.points,
                0xf06cc6,
                0.12 + index * 0.04,
              );
            }
          },
        );
    }

    if (showInteractions) {
      for (
        const interaction of
        this.level.interactions ?? []
      ) {
        const color =
          interaction.type === 'fakeWork'
            ? 0x74d9a4
            : interaction.type === 'hideSpot'
              ? 0x8da7ff
              : 0xf17bc6;

        this.makeHandle({
          position: interaction.position,
          color,
          size: 0.165,
          shape: 'box',
          ref: {
            kind: 'interaction',
            id: interaction.id,
          },
        });
      }
    }
  }

  environmentIds() {
    return new Set(
      (this.level.environment ?? [])
        .map(object => object.id),
    );
  }

  insertionPoint() {
    return this.orbit.target.clone();
  }

  addFromPalette(type) {
    const point =
      this.insertionPoint();

    if (
      type.startsWith('interaction:')
    ) {
      const interactionType =
        type.split(':')[1];

      const ids =
        new Set(
          (this.level.interactions ?? [])
            .map(item => item.id),
        );

      const id =
        uniqueId(
          interactionType,
          ids,
        );

      this.level.interactions.push({
        id,
        type: interactionType,
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
          kind: 'interaction',
          id,
        },
      });
      return;
    }

    if (type === 'nav') {
      const ids =
        new Set(
          (this.level.navigation?.nodes ?? [])
            .map(node => node.id),
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
      const npc =
        this.level.npcs.find(
          item => item.id === this.focusNpcId,
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
          npcId: npc.id,
          index: npc.routine.length - 1,
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

    this.level.environment.push(object);

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
      this.canvas.getBoundingClientRect();

    this.pointer.x =
      ((event.clientX - rect.left) /
        rect.width) *
        2 -
      1;

    this.pointer.y =
      -(
        (event.clientY - rect.top) /
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
        ?.objectRoots?.values?.() ?? []
    ) {
      if (
        root.userData.editorSelectable !== false
      ) {
        targets.push(root);
      }
    }

    const hits =
      this.raycaster.intersectObjects(
        targets,
        true,
      );

    if (!hits.length) {
      this.clearSelection();
      return;
    }

    let object = hits[0].object;

    while (
      object &&
      !object.userData.editorRef &&
      !object.userData.levelObjectId
    ) {
      object = object.parent;
    }

    if (!object) return;

    const ref =
      object.userData.editorRef ??
      {
        kind: 'environment',
        id: object.userData.levelObjectId,
      };

    if (
      this.linkSourceId &&
      ref.kind === 'nav' &&
      ref.id !== this.linkSourceId
    ) {
      this.completeLink(ref.id);
      return;
    }

    this.selectRef(ref);
  }

  selectRef(ref) {
    this.selectedRef =
      clone(ref);

    let object = null;

    if (ref.kind === 'environment') {
      object =
        this.officeLevel?.builder
          ?.objectRoots?.get(ref.id);
    } else {
      object =
        this.selectableHelpers.find(
          helper =>
            this.refsEqual(
              helper.userData.editorRef,
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

    if (ref.kind === 'environment') {
      return this.level.environment.find(
        object => object.id === ref.id,
      );
    }

    if (ref.kind === 'interaction') {
      return this.level.interactions.find(
        item => item.id === ref.id,
      );
    }

    if (ref.kind === 'nav') {
      return this.level.navigation.nodes.find(
        node => node.id === ref.id,
      );
    }

    if (ref.kind === 'routine') {
      return this.level.npcs.find(
        npc => npc.id === ref.npcId,
      )?.routine?.[ref.index];
    }

    if (ref.kind === 'spawn') {
      return {
        position: this.level.playerSpawn,
      };
    }

    if (ref.kind === 'extraction') {
      return this.level.extraction;
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

    const position = [
      Number(
        this.selectedObject.position.x.toFixed(3),
      ),
      0,
      Number(
        this.selectedObject.position.z.toFixed(3),
      ),
    ];

    if (
      this.selectedRef.kind === 'spawn'
    ) {
      this.level.playerSpawn =
        position;

      this.level.prepZone ??= {
        center: [...position],
        radius: 1.75,
      };

      this.level.prepZone.center =
        [...position];
    } else if (
      this.selectedRef.kind === 'extraction'
    ) {
      this.level.extraction.position =
        position;

      const elevator =
        this.level.environment.find(
          object => object.type === 'elevator',
        );

      if (elevator) {
        elevator.position =
          [...position];
      }
    } else {
      data.position = position;
    }

    if (
      this.selectedRef.kind === 'environment'
    ) {
      data.rotation =
        Number(
          this.selectedObject.rotation.y.toFixed(4),
        );

      if (data.type === 'elevator') {
        this.level.extraction.position =
          [...position];
      }
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
        <div class="editor-inspector-empty">
          <p class="editor-kicker">LEVEL</p>
          <h2>${this.escape(this.level?.name ?? 'No Level')}</h2>
          <label class="editor-field">
            名称
            <input
              data-editor-level-field="name"
              value="${this.escape(this.level?.name ?? '')}"
            />
          </label>

          <div class="editor-level-summary">
            <span><strong>${this.level?.environment?.length ?? 0}</strong> 物件</span>
            <span><strong>${this.level?.npcs?.length ?? 0}</strong> NPC</span>
            <span><strong>${this.level?.interactions?.length ?? 0}</strong> 玩法点</span>
          </div>

          <p class="editor-mini-note">
            点击场景对象后，这里只显示和当前选择有关的参数。
          </p>
        </div>
      `;
      return;
    }

    const position =
      data.position ?? [0, 0, 0];

    const rotation =
      ref.kind === 'environment'
        ? (
            (data.rotation ?? 0) *
            180 /
            Math.PI
          ).toFixed(1)
        : null;

    let specific = '';

    if (ref.kind === 'environment') {
      const fields = [];

      if (Array.isArray(data.size)) {
        ['宽', '高', '深'].forEach(
          (label, index) => {
            fields.push(
              `<label>${label}<input type="number" min="0.05" step="0.05" data-editor-param="size.${index}" value="${data.size[index] ?? 1}"></label>`,
            );
          },
        );
      }

      const paramLabels = {
        width: '宽',
        depth: '深',
        height: '高',
        partitionHeight: '隔板高',
        doorWidth: '门宽',
      };

      for (
        const key of
        Object.keys(paramLabels)
      ) {
        if (
          data.params?.[key] != null
        ) {
          fields.push(
            `<label>${paramLabels[key]}<input type="number" min="0.05" step="0.05" data-editor-param="params.${key}" value="${data.params[key]}"></label>`,
          );
        }
      }

      if (fields.length) {
        specific = `
          <div class="editor-inspector-section">
            <h3>尺寸</h3>
            <div class="editor-dimension-grid">
              ${fields.join('')}
            </div>
          </div>
        `;
      }
    }

    if (ref.kind === 'routine') {
      specific = `
        <div class="editor-inspector-section">
          <h3>办公室行为</h3>
          <label class="editor-field">
            动作
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
            停留秒数
            <input
              type="number"
              min="0"
              step="0.1"
              data-editor-field="duration"
              value="${data.duration ?? 0}"
            />
          </label>
        </div>
      `;
    }

    if (ref.kind === 'interaction') {
      specific = `
        <div class="editor-inspector-section">
          <h3>玩法</h3>
          <label class="editor-field">
            类型
            <select data-editor-field="type">
              ${INTERACTION_TYPES
                .map(
                  type =>
                    `<option value="${type}" ${data.type === type ? 'selected' : ''}>${type}</option>`,
                )
                .join('')}
            </select>
          </label>
        </div>
      `;
    }

    const canDelete =
      !['spawn', 'extraction']
        .includes(ref.kind);

    const canDuplicate =
      ['environment', 'interaction', 'routine']
        .includes(ref.kind);

    const kindNames = {
      environment: '物件',
      interaction: '玩法点',
      nav: '导航点',
      routine: 'NPC 行为点',
      spawn: '玩家出生点',
      extraction: '电梯出口',
    };

    root.innerHTML = `
      <div class="editor-selection-heading">
        <div>
          <p class="editor-kicker">${kindNames[ref.kind] ?? ref.kind}</p>
          <h2>${this.escape(data.id ?? ref.id ?? ref.npcId ?? ref.kind)}</h2>
        </div>
        <span class="editor-selection-type">${ref.kind}</span>
      </div>

      <div class="editor-inspector-section">
        <h3>位置</h3>
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
            旋转 °
            <input type="number" step="15" data-editor-field="rotation" value="${rotation}">
          </label>
        `}
      </div>

      ${specific}

      ${ref.kind === 'nav' ? `
        <div class="editor-inspector-section">
          <h3>连接</h3>
          <button class="editor-secondary-wide" data-editor-link>
            ${this.linkSourceId === ref.id ? '现在选择另一个导航点…' : '连接 / 断开另一个导航点'}
          </button>
        </div>
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
      input.dataset.editorParam.split('.');

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
      preserve: this.selectedRef,
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
        field === 'x' ? 0 : 2;

      data.position[index] =
        Number(input.value);

      this.syncSpecialPositions();

      this.commitMutation({
        rebuild: true,
        preserve: ref,
      });
      return;
    }

    if (field === 'rotation') {
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

    if (field === 'duration') {
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

  syncSpecialPositions() {
    const ref =
      this.selectedRef;

    if (!ref) return;

    if (ref.kind === 'spawn') {
      this.level.prepZone ??= {
        center: [...this.level.playerSpawn],
        radius: 1.75,
      };

      this.level.prepZone.center =
        [...this.level.playerSpawn];
    }

    if (ref.kind === 'extraction') {
      const elevator =
        this.level.environment.find(
          object => object.type === 'elevator',
        );

      if (elevator) {
        elevator.position =
          [...this.level.extraction.position];
      }
    }

    if (ref.kind === 'environment') {
      const object =
        this.selectedData();

      if (object?.type === 'elevator') {
        this.level.extraction.position =
          [...object.position];
      }
    }
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

    this.root
      .querySelectorAll(
        '[data-editor-action="translate"], [data-editor-action="rotate"]',
      )
      .forEach(button => {
        button.classList.toggle(
          'active',
          button.dataset.editorAction === mode,
        );
      });
  }

  startLink() {
    if (
      this.selectedRef?.kind !== 'nav'
    ) {
      return;
    }

    this.linkSourceId =
      this.selectedRef.id;

    this.renderInspector();
    this.setStatus(
      '选择第二个导航点：已有连线会断开，没有则建立。',
      'info',
    );
  }

  completeLink(targetId) {
    const a = this.linkSourceId;
    const b = targetId;

    this.linkSourceId = null;

    const exists =
      this.level.navigation.edges.some(
        edge =>
          (edge[0] === a && edge[1] === b) ||
          (edge[0] === b && edge[1] === a),
      );

    if (exists) {
      this.level.navigation.edges =
        this.level.navigation.edges.filter(
          edge =>
            !(
              (edge[0] === a && edge[1] === b) ||
              (edge[0] === b && edge[1] === a)
            ),
        );
    } else {
      this.level.navigation.edges.push([a, b]);
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

    if (ref.kind === 'environment') {
      this.level.environment =
        this.level.environment.filter(
          object => object.id !== ref.id,
        );

      this.level.interactions =
        this.level.interactions.filter(
          interaction =>
            interaction.linkedObjectId !== ref.id,
        );
    } else if (ref.kind === 'interaction') {
      this.level.interactions =
        this.level.interactions.filter(
          item => item.id !== ref.id,
        );
    } else if (ref.kind === 'nav') {
      this.level.navigation.nodes =
        this.level.navigation.nodes.filter(
          node => node.id !== ref.id,
        );

      this.level.navigation.edges =
        this.level.navigation.edges.filter(
          edge => !edge.includes(ref.id),
        );
    } else if (ref.kind === 'routine') {
      const npc =
        this.level.npcs.find(
          item => item.id === ref.npcId,
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

    if (ref.kind === 'environment') {
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

      this.level.environment.push(copy);

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind: 'environment',
          id: copy.id,
        },
      });
      return;
    }

    if (ref.kind === 'interaction') {
      const source =
        this.selectedData();

      const ids =
        new Set(
          this.level.interactions
            .map(item => item.id),
        );

      const copy =
        clone(source);

      copy.id =
        uniqueId(
          source.type,
          ids,
        );

      copy.position[0] += 0.5;

      this.level.interactions.push(copy);

      this.commitMutation({
        rebuild: true,
        preserve: {
          kind: 'interaction',
          id: copy.id,
        },
      });
      return;
    }

    if (ref.kind === 'routine') {
      const npc =
        this.level.npcs.find(
          item => item.id === ref.npcId,
        );

      const source =
        npc?.routine?.[ref.index];

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
          index: ref.index + 1,
        },
      });
    }
  }

  async commitMutation({
    rebuild = false,
    preserve = null,
  } = {}) {
    this.session.markDirty();
    this.updateChrome();

    if (rebuild) {
      await this.onRebuild(
        this.level,
        preserve,
      );
    } else {
      this.rebuildHelpers();

      if (preserve ?? this.selectedRef) {
        this.selectRef(
          preserve ?? this.selectedRef,
        );
      }

      this.validate();
    }
  }

  validate() {
    if (!this.level) return;

    const result =
      validateLevel(this.level);

    const pill =
      this.ui.validationPill;

    pill.textContent =
      result.valid
        ? `✓ Valid · ${result.metrics.objects}`
        : `✕ ${result.errors.length} errors`;

    pill.className =
      `editor-validation-pill ${result.valid ? 'valid' : 'invalid'}`;

    const rows = [
      ...result.errors
        .slice(0, 10)
        .map(
          message =>
            `<li class="error">${this.escape(message)}</li>`,
        ),
      ...result.warnings
        .slice(0, 6)
        .map(
          message =>
            `<li class="warning">${this.escape(message)}</li>`,
        ),
    ];

    this.ui.validation.innerHTML =
      rows.length
        ? `
            <div class="editor-validation-card">
              <div class="editor-validation-card-head">
                <strong>${result.errors.length ? '需要修复' : '提醒'}</strong>
                <span>${result.errors.length} errors · ${result.warnings.length} warnings</span>
              </div>
              <ul>${rows.join('')}</ul>
            </div>
          `
        : '';

    this.ui.validation.classList.toggle(
      'visible',
      rows.length > 0,
    );

    return result;
  }

  async handleAction(action) {
    try {
      if (action === 'play') {
        this.onPlay?.();
        return;
      }

      if (action === 'translate') {
        this.setTransformMode('translate');
        return;
      }

      if (action === 'rotate') {
        this.setTransformMode('rotate');
        return;
      }

      if (action === 'save') {
        this.session.saveDraft();
        this.updateChrome();
        this.setStatus(
          '草稿已保存到这台设备',
          'success',
        );
        await this.refreshLevelList();
        return;
      }

      if (action === 'export') {
        this.session.downloadJson();
      } else if (action === 'import') {
        this.ui.import.click();
      } else if (action === 'duplicate-level') {
        await this.duplicateLevel();
      } else if (action === 'revert') {
        const level =
          await this.session.revertPublished();

        await this.onReplaceLevel(level);

        this.setStatus(
          '已恢复 GitHub 上的正式版本',
          'success',
        );
      } else if (action === 'clear-runs') {
        this.recorder?.clear(this.level.id);
        this.rebuildHelpers();
        this.setStatus(
          '已清除本关试玩轨迹',
          'success',
        );
      } else if (action === 'publish') {
        this.openPublishDialog();
      } else if (action === 'load') {
        await this.loadSelectedLevel();
      } else if (action === 'show-validation') {
        if (!this.ui.validation.innerHTML) {
          this.setStatus(
            '当前关卡没有 Validation 问题',
            'success',
          );
        } else {
          this.ui.validation.classList.toggle('visible');
        }
      } else if (action === 'forget-token') {
        this.session.forgetGithubToken();
        this.ui.token.value = '';
        this.updateChrome();
        this.setStatus(
          '已从这台设备移除 GitHub token',
          'success',
        );
      }

      if (this.ui.more?.open) {
        this.ui.more.open = false;
      }
    } catch (error) {
      this.setStatus(
        error.message,
        'error',
      );
    }
  }

  openPublishDialog() {
    const remembered =
      this.session.getRememberedGithubToken();

    this.ui.token.value =
      remembered;

    this.ui.rememberToken.checked =
      true;

    this.ui.commit.value =
      `level: update ${this.level.id} from graybox editor`;

    this.ui.publishStatus.textContent =
      remembered
        ? 'GitHub token 已从这台设备载入。'
        : '';

    this.ui.publishDialog.showModal();
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
          name?.trim() || id,
      });

    await this.onReplaceLevel(level);
    await this.refreshLevelList();
  }

  async refreshLevelList() {
    const published =
      await this.loader
        .listPublished()
        .catch(() => []);

    const drafts =
      this.session.listDrafts();

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

    if (
      drafts.some(
        item => item.id === current,
      )
    ) {
      this.ui.levels.value =
        `draft:${current}`;
    } else {
      this.ui.levels.value =
        `published:${current}`;
    }
  }

  async loadSelectedLevel() {
    const [source, id] =
      this.ui.levels.value.split(':');

    let level;

    if (source === 'draft') {
      level =
        this.session.loadDraft(id);
    } else {
      level =
        await this.loader.loadPublished(id);
    }

    if (!level) return;

    this.session.setLevel(level);

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

    if (!token) {
      this.ui.publishStatus.textContent =
        '请输入 GitHub token。';
      return;
    }

    this.ui.publishStatus.textContent =
      'Publishing…';

    try {
      const result =
        await this.session.publishToGitHub({
          token,
          message,
        });

      if (this.ui.rememberToken.checked) {
        this.session.rememberGithubToken(token);
      } else {
        this.session.forgetGithubToken();
      }

      this.updateChrome();

      this.ui.publishStatus.textContent =
        `Published: ${result.path}`;

      this.setStatus(
        '已提交 GitHub，Actions 会自动验证并部署 Pages',
        'success',
      );

      await this.refreshLevelList();

      setTimeout(
        () => this.ui.publishDialog.close(),
        800,
      );
    } catch (error) {
      this.ui.publishStatus.textContent =
        error.message;
    }
  }

  setStatus(message, type = 'info') {
    this.ui.validation.innerHTML =
      `<div class="editor-toast ${type}">${this.escape(message)}</div>`;

    this.ui.validation.classList.add(
      'visible',
    );

    setTimeout(
      () => {
        this.validate();
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
