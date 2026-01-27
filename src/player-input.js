import { entity } from "./entity.js";
import { passes } from './passes.js';


export const player_input = (() => {

  const KEYS = {
    'a': 65,
    's': 83,
    'w': 87,
    'd': 68,
    'SPACE': 32,
    'SHIFT_L': 16,
    'CTRL_L': 17,
    'ALT_L': 18,
    'TAB': 9,
  };

  // Mouse smoothing factor (0 = no smoothing, 1 = maximum smoothing)
  const MOUSE_SMOOTHING = 0.3;

  class PlayerInput extends entity.Component {
    static CLASS_NAME = 'PlayerInput';

    get NAME() {
      return PlayerInput.CLASS_NAME;
    }

    constructor(params) {
      super();
      this.params_ = params;
    }

    InitEntity() {
      this.current_ = {
        leftButton: false,
        rightButton: false,
        mouseXDelta: 0,
        mouseYDelta: 0,
        mouseX: 0,
        mouseY: 0,
      };
      this.previous_ = null;
      this.keys_ = {};
      this.previousKeys_ = {};

      // Pointer lock state
      this.pointerLocked_ = false;

      // Smoothed mouse delta values
      this.smoothMouseX_ = 0;
      this.smoothMouseY_ = 0;

      // Raw accumulated delta (reset each frame)
      this.rawDeltaX_ = 0;
      this.rawDeltaY_ = 0;

      this.target_ = document;
      this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
      this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
      this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
      this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
      this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);

      // Pointer lock change listener
      document.addEventListener('pointerlockchange', () => this.onPointerLockChange_(), false);
      document.addEventListener('mozpointerlockchange', () => this.onPointerLockChange_(), false);
      document.addEventListener('webkitpointerlockchange', () => this.onPointerLockChange_(), false);

      // Flag to track if user WANTS aim mode (used to auto-lock on click)
      this.wantAimMode_ = true;

      this.Parent.Attributes.Input = {
        Keyboard: {
          Current: this.keys_,
          Previous: this.previousKeys_
        },
        Mouse: {
          Current: this.current_,
          Previous: this.previous_
        },
      };

      this.SetPass(passes.INPUT);
    }

    onPointerLockChange_() {
      this.pointerLocked_ = document.pointerLockElement !== null ||
        document.mozPointerLockElement !== null ||
        document.webkitPointerLockElement !== null;

      // Sync wantAimMode with actual pointer lock state
      this.wantAimMode_ = this.pointerLocked_;

      // Update cursor visibility
      const container = document.getElementById('container');
      if (container) {
        if (this.pointerLocked_) {
          container.classList.add('aim-mode');
        } else {
          container.classList.remove('aim-mode');
        }
      }
    }

    togglePointerLock_() {
      const container = document.getElementById('container');
      if (!container) return;

      if (this.pointerLocked_) {
        document.exitPointerLock = document.exitPointerLock ||
          document.mozExitPointerLock ||
          document.webkitExitPointerLock;
        document.exitPointerLock();
      } else {
        container.requestPointerLock = container.requestPointerLock ||
          container.mozRequestPointerLock ||
          container.webkitRequestPointerLock;
        container.requestPointerLock();
      }
    }

    onMouseMove_(e) {
      // Use movementX/Y when pointer is locked for smooth, precise deltas
      if (this.pointerLocked_) {
        this.rawDeltaX_ += e.movementX || e.mozMovementX || e.webkitMovementX || 0;
        this.rawDeltaY_ += e.movementY || e.mozMovementY || e.webkitMovementY || 0;
      } else {
        // Fallback for non-locked mode
        this.current_.mouseX = e.pageX - window.innerWidth / 2;
        this.current_.mouseY = e.pageY - window.innerHeight / 2;

        if (this.previous_ === null) {
          this.previous_ = { ...this.current_ };
        }

        this.rawDeltaX_ = this.current_.mouseX - this.previous_.mouseX;
        this.rawDeltaY_ = this.current_.mouseY - this.previous_.mouseY;
      }
    }

    onMouseDown_(e) {
      this.onMouseMove_(e);

      // Auto-lock pointer on click if user wants aim mode
      if (this.wantAimMode_ && !this.pointerLocked_) {
        const container = document.getElementById('container');
        if (container) {
          container.requestPointerLock = container.requestPointerLock ||
            container.mozRequestPointerLock ||
            container.webkitRequestPointerLock;
          container.requestPointerLock();
        }
      }

      switch (e.button) {
        case 0: {
          this.current_.leftButton = true;
          break;
        }
        case 2: {
          this.current_.rightButton = true;
          break;
        }
      }
    }

    onMouseUp_(e) {
      this.onMouseMove_(e);

      switch (e.button) {
        case 0: {
          this.current_.leftButton = false;
          break;
        }
        case 2: {
          this.current_.rightButton = false;
          break;
        }
      }
    }

    onKeyDown_(e) {
      this.keys_[e.keyCode] = true;

      // Ctrl + Alt = enable aim mode (set flag and try to lock pointer)
      if (e.keyCode === KEYS.ALT_L && e.ctrlKey) {
        e.preventDefault();
        this.wantAimMode_ = true;

        // Hide cursor immediately with CSS
        const container = document.getElementById('container');
        if (container) {
          container.classList.add('aim-mode');
          // Try to request pointer lock (will work on click if not immediately)
          container.requestPointerLock = container.requestPointerLock ||
            container.mozRequestPointerLock ||
            container.webkitRequestPointerLock;
          container.requestPointerLock();
        }

        // Flash the control hint
        const controlHints = document.getElementById('control-hints');
        if (controlHints) {
          controlHints.classList.add('visible');
          setTimeout(() => {
            controlHints.classList.remove('visible');
          }, 2000);
        }
      }
      // Ctrl alone = release mouse (exit pointer lock)
      else if (e.keyCode === KEYS.CTRL_L && !e.altKey) {
        this.wantAimMode_ = false;

        // Show cursor
        const container = document.getElementById('container');
        if (container) {
          container.classList.remove('aim-mode');
        }

        if (this.pointerLocked_) {
          document.exitPointerLock = document.exitPointerLock ||
            document.mozExitPointerLock ||
            document.webkitExitPointerLock;
          document.exitPointerLock();
        }

        // Flash the control hint
        const controlHints = document.getElementById('control-hints');
        if (controlHints) {
          controlHints.classList.add('visible');
          setTimeout(() => {
            controlHints.classList.remove('visible');
          }, 2000);
        }
      }
    }

    onKeyUp_(e) {
      this.keys_[e.keyCode] = false;
    }

    key(keyCode) {
      return !!this.keys_[keyCode];
    }

    mouseLeftReleased(checkPrevious = true) {
      return (!this.current_.leftButton && this.previous_.leftButton);
    }

    isReady() {
      return this.previous_ !== null;
    }

    Update(_) {
      // Apply mouse smoothing for buttery smooth camera movement
      this.smoothMouseX_ = this.smoothMouseX_ * MOUSE_SMOOTHING + this.rawDeltaX_ * (1 - MOUSE_SMOOTHING);
      this.smoothMouseY_ = this.smoothMouseY_ * MOUSE_SMOOTHING + this.rawDeltaY_ * (1 - MOUSE_SMOOTHING);

      // Set smoothed deltas
      this.current_.mouseXDelta = this.smoothMouseX_;
      this.current_.mouseYDelta = this.smoothMouseY_;

      // Reset raw deltas for next frame
      this.rawDeltaX_ = 0;
      this.rawDeltaY_ = 0;

      if (this.previous_ !== null) {
        this.previous_ = { ...this.current_ };
        this.previousKeys_ = { ...this.keys_ };
      } else {
        this.previous_ = { ...this.current_ };
      }
    }
  };

  return {
    PlayerInput: PlayerInput,
    KEYS: KEYS,
  };

})();
